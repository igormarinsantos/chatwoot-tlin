module ClinicScheduler
  class AvailabilityService
    def self.get_slots(account, params)
      from_time = params[:from].to_datetime
      to_time = params[:to].to_datetime
      duration = params[:duration_minutes]&.to_i || 30
      granularity = params[:granularity_minutes]&.to_i || 15

      professional_id = params[:professional_id]
      resource_id = params[:resource_id]

      # Note: A true production slot-finder maps all disjoint intervals and iterates
      # through them. This implementation is an MVP scanning the 15-minute grids:
      
      available_slots = []
      current_time = from_time

      # Pre-load constraints for performance
      blocks = account.availability_blocks.where("start_at < ? AND end_at > ?", to_time, from_time)
      holds = account.holds.where(status: 'active').where("start_at < ? AND end_at > ?", to_time, from_time)
      appts = account.appointments.where(status: %w[scheduled confirmed rescheduled]).where("start_at < ? AND end_at > ?", to_time, from_time)

      while current_time + duration.minutes <= to_time
        slot_end = current_time + duration.minutes

        # We assume slot is valid unless we find an overlap
        # Check professional specific blocks and overlaps
        
        # Checking blocks overlay
        overlap_block = blocks.any? do |b|
          matches_prof = b.professional_id.nil? || b.professional_id.to_s == professional_id.to_s
          matches_res = b.resource_id.nil? || b.resource_id.to_s == resource_id.to_s
          
          (matches_prof || matches_res) && (current_time < b.end_at && slot_end > b.start_at)
        end

        overlap_hold = holds.any? do |h|
          (h.professional_id.to_s == professional_id.to_s || (resource_id && h.resource_id.to_s == resource_id.to_s)) && 
          (current_time < h.end_at && slot_end > h.start_at)
        end

        overlap_appt = appts.any? do |a|
          (a.professional_id.to_s == professional_id.to_s || (resource_id && a.resource_id.to_s == resource_id.to_s)) &&
          (current_time < a.end_at && slot_end > a.start_at)
        end

        unless overlap_block || overlap_hold || overlap_appt
          available_slots << {
            start_at: current_time.iso8601,
            end_at: slot_end.iso8601,
            professional_id: professional_id,
            resource_id: resource_id
          }
        end
        
        break if params[:limit] && available_slots.length >= params[:limit].to_i

        current_time += granularity.minutes
      end

      available_slots
    end
  end
end
