module ClinicScheduler
  class HoldService
    def self.create_hold(account, params)
      key = params[:idempotency_key]
      
      if key.present?
        existing_hold = account.holds.find_by(idempotency_key: key)
        return existing_hold if existing_hold
      end

      start_at = params[:start_at].to_datetime
      end_at = params[:end_at].to_datetime
      professional_id = params[:professional_id]
      resource_id = params[:resource_id]

      hold = nil

      ActiveRecord::Base.transaction do
        # Validate overlap natively with advisory locks
        ClinicScheduler::OverlapValidator.check_overlap!(
          account, 
          professional_id, 
          resource_id, 
          start_at, 
          end_at
        )

        hold = account.holds.create!(
          professional_id: professional_id,
          resource_id: resource_id,
          procedure_id: params[:procedure_id],
          patient_ref: params[:patient_ref],
          start_at: start_at,
          end_at: end_at,
          status: 'active',
          expires_at: 15.minutes.from_now,
          idempotency_key: key
        )

        account.outbox_events.create!(
          event_type: 'hold_created',
          payload: hold.as_json,
          occurred_at: Time.current
        )
      end

      hold
    end

    def self.convert_hold_to_appointment(account, hold_id, idempotency_key = nil, notes = nil)
      if idempotency_key.present?
        existing_appt = account.appointments.find_by(idempotency_key: idempotency_key)
        return existing_appt if existing_appt
      end

      hold = account.holds.find(hold_id)
      raise "Hold is not active" unless hold.status == 'active'
      raise "Hold expired" if hold.expires_at < Time.current

      appointment = nil

      ActiveRecord::Base.transaction do
        # Re-lock and validate to be absolutely sure
        ClinicScheduler::OverlapValidator.check_overlap!(
          account, 
          hold.professional_id, 
          hold.resource_id, 
          hold.start_at, 
          hold.end_at,
          ignore_hold_id: hold.id
        )

        appointment = account.appointments.create!(
          professional_id: hold.professional_id,
          resource_id: hold.resource_id,
          procedure_id: hold.procedure_id,
          patient_ref: hold.patient_ref.merge(notes: notes),
          start_at: hold.start_at,
          end_at: hold.end_at,
          status: 'confirmed',
          idempotency_key: idempotency_key
        )

        hold.update!(status: 'converted')

        account.outbox_events.create!(
          event_type: 'hold_converted',
          payload: { hold_id: hold.id, appointment_id: appointment.id },
          occurred_at: Time.current
        )

        account.outbox_events.create!(
          event_type: 'appointment_created',
          payload: appointment.as_json,
          occurred_at: Time.current
        )
      end

      appointment
    end
  end
end
