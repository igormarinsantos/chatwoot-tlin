module ClinicScheduler
  class AvailabilityService
    def self.get_slots(account, params)
      from_time = params[:from].to_datetime
      to_time = params[:to].to_datetime
      
      professional_id = params[:professional_id]
      resource_id = params[:resource_id]
      
      prof = account.professionals.find_by(id: professional_id) if professional_id
      duration = prof&.average_consultation_time || params[:duration_minutes]&.to_i || 30
      granularity = params[:granularity_minutes]&.to_i || 15

      available_slots = []
      current_time = from_time

      # Query Blocks
      blocks = account.availability_blocks
      blocks = blocks.where(professional_id: [nil, professional_id]) if professional_id
      blocks = blocks.where(resource_id: [nil, resource_id]) if resource_id

      holds = account.holds.where(status: 'active').where("start_at < ? AND end_at > ?", to_time, from_time)
      appts = account.appointments.where(status: %w[scheduled confirmed rescheduled]).where("start_at < ? AND end_at > ?", to_time, from_time)

      while current_time + duration.minutes <= to_time
        slot_end = current_time + duration.minutes

        # Working hours / breaks check
        day_string = current_time.strftime("%A").downcase
        float_start = current_time.hour + (current_time.min / 60.0)
        float_end = slot_end.hour + (slot_end.min / 60.0)

        # 1. Is within Working Hours?
        working_blocks = blocks.select do |b| 
          b.block_type == 'working_hours' && 
          (b.day_of_week == 'all' || b.day_of_week == day_string) 
        end
        
        is_within_working = working_blocks.any? do |w|
          w_start = parse_time(w.start_time)
          w_end = parse_time(w.end_time)
          w_start && w_end && float_start >= w_start && float_end <= w_end
        end

        if is_within_working
          # 2. Does it overlap any Break?
          break_blocks = blocks.select do |b| 
            b.block_type == 'break' && 
            (b.day_of_week == 'all' || b.day_of_week == day_string) 
          end

          overlaps_break = break_blocks.any? do |br|
            br_start = parse_time(br.start_time)
            br_end = parse_time(br.end_time)
            br_start && br_end && float_start < br_end && float_end > br_start
          end

          unless overlaps_break
            # 3. Check physical blocks, Holds and Appts
            overlaps_phys_block = blocks.any? do |b|
              b.start_at && b.end_at && b.start_at < slot_end && b.end_at > current_time
            end

            overlap_hold = holds.any? do |h|
              (h.professional_id.to_s == professional_id.to_s || (resource_id && h.resource_id.to_s == resource_id.to_s)) && 
              (current_time < h.end_at && slot_end > h.start_at)
            end

            overlap_appt = appts.any? do |a|
              (a.professional_id.to_s == professional_id.to_s || (resource_id && a.resource_id.to_s == resource_id.to_s)) &&
              (current_time < a.end_at && slot_end > a.start_at)
            end

            unless overlaps_phys_block || overlap_hold || overlap_appt
              available_slots << {
                start_at: current_time.iso8601,
                end_at: slot_end.iso8601,
                professional_id: professional_id,
                resource_id: resource_id
              }
            end
          end
        end

        break if params[:limit] && available_slots.length >= params[:limit].to_i

        current_time += granularity.minutes
      end

      available_slots
    end

    def self.parse_time(time_str)
      return nil unless time_str.present?
      h, m = time_str.split(':').map(&:to_f)
      h + (m / 60.0)
    end
  end
end
