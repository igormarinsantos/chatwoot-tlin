module ClinicScheduler
  class AvailabilityEngine
    def initialize(professional, date_range)
      @professional = professional
      @date_range = date_range # Expecting an Enumerable of dates or a Range
      @clinic = professional.clinic
    end

    def free_slots(procedure_duration_minutes)
      slots = []

      @date_range.each do |date|
        day_rules = @professional.availability_rules.where(day_of_week: date.wday)
        day_blocks = @professional.blocks.where(
          "start_datetime < ? AND end_datetime > ?",
          date.end_of_day, date.beginning_of_day
        )
        day_appointments = @professional.appointments.confirmed.where(
          "start_datetime < ? AND end_datetime > ?",
          date.end_of_day, date.beginning_of_day
        )

        day_rules.each do |rule|
          # Create initial slots based on rule (HH:MM)
          start_time = Time.zone.parse("#{date} #{rule.start_time}")
          end_time = Time.zone.parse("#{date} #{rule.end_time}")

          current_time = start_time
          while current_time + procedure_duration_minutes.minutes <= end_time
            slot_end = current_time + procedure_duration_minutes.minutes
            
            # Check if current_time...slot_end overlaps with any blocks or existing appointments
            overlapping = day_blocks.any? { |b| overlap?(current_time, slot_end, b.start_datetime, b.end_datetime) } ||
                          day_appointments.any? { |a| overlap?(current_time, slot_end, a.start_datetime, a.end_datetime) }

            unless overlapping
              slots << {
                start_datetime: current_time,
                end_datetime: slot_end
              }
            end

            current_time = slot_end
          end
        end
      end

      slots
    end

    private

    def overlap?(s1, e1, s2, e2)
      (s1 < e2) && (s2 < e1)
    end
  end
end
