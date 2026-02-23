module Booking
  class AppointmentManager
    def self.confirm_hold!(token)
      hold = Booking::BookingHold.find_by!(token: token)
      
      if hold.expired?
        raise StandardError, "This reservation has expired. Please try again."
      end

      ActiveRecord::Base.transaction do
        appointment = hold.appointment
        appointment.update!(status: 'CONFIRMED')
        hold.destroy!
        
        # Phase 5: Google Calendar integration
        Integrations::GoogleCalendarService.new(appointment.professional).create_event(appointment)
        
        appointment
      end
    end

    def self.cancel_appointment!(appointment_id, reason = nil)
      appointment = Booking::Appointment.find(appointment_id)
      appointment.update!(status: 'CANCELLED', notes: reason)
      
      # Phase 5: Google Calendar cancellation
      # Note: In a real implementation we would store the google_event_id in the appointment
      # integrations = Integrations::GoogleCalendarService.new(appointment.professional)
      # integrations.delete_event(appointment.google_event_id)
      
      appointment
    end

    def self.reschedule_appointment!(appointment_id, new_start_datetime)
      appointment = Booking::Appointment.find(appointment_id)
      
      ActiveRecord::Base.transaction do
        # 1. Cancel old one
        appointment.update!(status: 'CANCELLED', notes: "Rescheduled to #{new_start_datetime}")
        
        # 2. Return a new hold for the new time
        Booking::HoldManager.new(
          professional: appointment.professional,
          procedure: appointment.procedure,
          start_datetime: new_start_datetime,
          patient_name: appointment.patient_name,
          patient_phone: appointment.patient_phone,
          conversation_id: appointment.chatwoot_conversation_id
        ).create_hold!
      end
    end
  end
end
