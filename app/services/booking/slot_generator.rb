module Booking
  class SlotGenerator
    def initialize(professional:, procedure:, date_from:, date_to:)
      @professional = professional
      @procedure = procedure
      @date_from = date_from.to_date
      @date_to = date_to.to_date
      @duration = procedure.duration_min.minutes
    end

    def call
      available_slots = []

      (@date_from..@date_to).each do |date|
        available_slots += slots_for_date(date)
      end

      available_slots
    end

    private

    def slots_for_date(date)
      rules = @professional.availability_rules.where(weekday: date.wday)
      return [] if rules.empty?

      day_slots = []
      rules.each do |rule|
        day_slots += generate_slots_from_rule(rule, date)
      end

      filter_busy_slots(day_slots, date)
    end

    def generate_slots_from_rule(rule, date)
      slots = []
      current_time = Time.zone.parse("#{date} #{rule.start_time.strftime('%H:%M:%S')}")
      end_time = Time.zone.parse("#{date} #{rule.end_time.strftime('%H:%M:%S')}")
      granularity = rule.slot_granularity_min.minutes
      buffer_before = rule.buffer_before_min.minutes
      buffer_after = rule.buffer_after_min.minutes

      while (current_time + buffer_before + @duration + buffer_after) <= end_time
        slots << {
          start: current_time + buffer_before,
          end: current_time + buffer_before + @duration
        }
        current_time += granularity
      end

      slots
    end

    def filter_busy_slots(slots, date)
      start_of_day = date.to_time.beginning_of_day
      end_of_day = date.to_time.end_of_day

      # Internal appointments
      busy_appointments = Booking::Appointment.active
                                             .where(professional_id: @professional.id)
                                             .where('start_datetime < ? AND end_datetime > ?', end_of_day, start_of_day)

      # Blocks
      busy_blocks = Booking::Block.where(professional_id: [nil, @professional.id])
                                 .where('start_datetime < ? AND end_datetime > ?', end_of_day, start_of_day)

      # Google Calendar
      google_busy = Integrations::GoogleCalendarService.new(@professional).busy_slots(date.beginning_of_day, date.end_of_day)

      slots.reject do |slot|
        overlapping?(slot, busy_appointments) || overlapping?(slot, busy_blocks) || overlapping_google?(slot, google_busy) || in_past?(slot)
      end
    end

    def overlapping?(slot, busy_intervals)
      busy_intervals.any? do |busy|
        slot[:start] < busy.end_datetime && slot[:end] > busy.start_datetime
      end
    end

    def overlapping_google?(slot, busy_intervals)
      busy_intervals.any? do |busy|
        slot[:start] < busy[:end] && slot[:end] > busy[:start]
      end
    end

    def in_past?(slot)
      slot[:start] < Time.current
    end
  end
end
