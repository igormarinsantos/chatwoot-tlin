module ClinicScheduler
  class OverlapValidator
    class ConflictError < StandardError; end

    def self.check_overlap!(account, professional_id, resource_id, start_at, end_at, ignore_hold_id: nil, ignore_appointment_id: nil)
      # 1. Advisory Lock to prevent concurrent race conditions in this transaction
      # Using Postgres transaction-level advisory locks ensures the lock auto-releases on commit/rollback
      prof_lock_key = Zlib.crc32("clinic_#{account.id}_prof_#{professional_id}")
      ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(#{prof_lock_key})")
      
      if resource_id.present?
        res_lock_key = Zlib.crc32("clinic_#{account.id}_res_#{resource_id}")
        ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(#{res_lock_key})")
      end

      # 2. Check Availability Blocks (blocks, meetings, etc)
      # Note: We do not check "working_hours" here; that is usually enforced on the frontend or a separate validation.
      # This engine strictly checks for physical overlaps in the agenda slots.
      blocks_query = account.availability_blocks.where(
        "start_at < ? AND end_at > ?", end_at, start_at
      )
      
      if resource_id.present?
        blocks = blocks_query.where("professional_id = ? OR resource_id = ?", professional_id, resource_id)
      else
        blocks = blocks_query.where(professional_id: professional_id)
      end

      raise ConflictError, "SLOT_CONFLICT_BLOCK" if blocks.exists?

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
  end
end
