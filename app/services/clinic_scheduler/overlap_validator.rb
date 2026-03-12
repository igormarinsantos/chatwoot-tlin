module ClinicScheduler
  class OverlapValidator
    class ConflictError < StandardError; end

    def self.check_overlap!(account, professional_id, resource_id, start_at, end_at, ignore_hold_id: nil, ignore_appointment_id: nil)
      prof_lock_key = Zlib.crc32("clinic_#{account.id}_prof_#{professional_id}")
      ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(#{prof_lock_key})")
      
      if resource_id.present?
        res_lock_key = Zlib.crc32("clinic_#{account.id}_res_#{resource_id}")
        ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(#{res_lock_key})")
      end

      # 2. Check Availability Blocks
      # Physical overrides where start_at/end_at are present
      blocks_query = account.availability_blocks.where(
        "start_at < ? AND end_at > ?", end_at, start_at
      )
      
      if resource_id.present?
        blocks = blocks_query.where("professional_id = ? OR resource_id = ?", professional_id, resource_id)
      else
        blocks = blocks_query.where(professional_id: professional_id)
      end

      raise ConflictError, "SLOT_CONFLICT_BLOCK" if blocks.exists?

      # 2.1 Check Recurring Breaks
      day_string = start_at.strftime("%A").downcase
      float_start = start_at.hour + (start_at.min / 60.0)
      float_end = end_at.hour + (end_at.min / 60.0)

      recurring_blocks_query = account.availability_blocks.where(block_type: 'break')
      if resource_id.present?
        recurring_blocks = recurring_blocks_query.where("professional_id = ? OR resource_id = ?", professional_id, resource_id)
      else
        recurring_blocks = recurring_blocks_query.where(professional_id: professional_id)
      end

      overlaps_break = recurring_blocks.any? do |br|
        (br.day_of_week == 'all' || br.day_of_week == day_string) &&
        (br_start = parse_time(br.start_time)) &&
        (br_end = parse_time(br.end_time)) &&
        float_start < br_end && float_end > br_start
      end

      raise ConflictError, "SLOT_CONFLICT_RECURRING_BREAK" if overlaps_break

      # 3. Check Active Holds
      holds_query = account.holds.where(status: 'active').where("start_at < ? AND end_at > ?", end_at, start_at)
      holds_query = holds_query.where.not(id: ignore_hold_id) if ignore_hold_id
      
      if resource_id.present?
        holds = holds_query.where("professional_id = ? OR resource_id = ?", professional_id, resource_id)
      else
        holds = holds_query.where(professional_id: professional_id)
      end

      raise ConflictError, "SLOT_CONFLICT_HOLD" if holds.exists?

      # 4. Check Scheduled/Confirmed Appointments
      appts_query = account.appointments.where(status: %w[scheduled confirmed rescheduled]).where("start_at < ? AND end_at > ?", end_at, start_at)
      appts_query = appts_query.where.not(id: ignore_appointment_id) if ignore_appointment_id
      
      if resource_id.present?
        appts = appts_query.where("professional_id = ? OR resource_id = ?", professional_id, resource_id)
      else
        appts = appts_query.where(professional_id: professional_id)
      end

      raise ConflictError, "SLOT_CONFLICT_APPOINTMENT" if appts.exists?
      
      true
    end

    def self.parse_time(time_str)
      return nil unless time_str.present?
      h, m = time_str.split(':').map(&:to_f)
      h + (m / 60.0)
    end
  end
end
