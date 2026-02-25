module ClinicScheduler
  class AppointmentService
    def self.update_appointment(account, appointment_id, params)
      appointment = account.appointments.find(appointment_id)
      
      expected_version = params[:expected_version]
      if expected_version.present? && appointment.lock_version != expected_version.to_i
        raise "VERSION_MISMATCH"
      end

      # Determine if dates or professionals are changing, requiring an overlap check
      start_at = (params[:patch][:start_at] || appointment.start_at).to_datetime
      end_at = (params[:patch][:end_at] || appointment.end_at).to_datetime
      professional_id = params[:patch][:professional_id] || appointment.professional_id
      resource_id = params[:patch].key?(:resource_id) ? params[:patch][:resource_id] : appointment.resource_id

      needs_overlap_check = (
        start_at != appointment.start_at ||
        end_at != appointment.end_at ||
        professional_id != appointment.professional_id ||
        resource_id != appointment.resource_id
      )

      ActiveRecord::Base.transaction do
        if needs_overlap_check
          ClinicScheduler::OverlapValidator.check_overlap!(
            account, 
            professional_id, 
            resource_id, 
            start_at, 
            end_at,
            ignore_appointment_id: appointment.id
          )
        end

        appointment.update!(params[:patch].merge(lock_version: appointment.lock_version + 1))

        account.outbox_events.create!(
          event_type: 'appointment_updated',
          payload: appointment.as_json,
          occurred_at: Time.current
        )
      end

      appointment
    end

    def self.cancel_appointment(account, appointment_id)
      appointment = account.appointments.find(appointment_id)
      
      ActiveRecord::Base.transaction do
        appointment.update!(status: 'cancelled', lock_version: appointment.lock_version + 1)
        
        account.outbox_events.create!(
          event_type: 'appointment_cancelled',
          payload: appointment.as_json,
          occurred_at: Time.current
        )
      end
      
      appointment
    end
  end
end
