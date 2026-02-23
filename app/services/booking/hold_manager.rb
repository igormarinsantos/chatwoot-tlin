module Booking
  class HoldManager
    def initialize(professional:, procedure:, start_datetime:, patient_name:, patient_phone:, conversation_id: nil)
      @professional = professional
      @procedure = procedure
      @start_datetime = start_datetime
      @patient_name = patient_name
      @patient_phone = patient_phone
      @conversation_id = conversation_id
    end

    def create_hold!
      ActiveRecord::Base.transaction do
        appointment = Booking::Appointment.create!(
          professional: @professional,
          procedure: @procedure,
          patient_name: @patient_name,
          patient_phone: @patient_phone,
          start_datetime: @start_datetime,
          end_datetime: @start_datetime + @procedure.duration_min.minutes,
          status: 'HOLD',
          chatwoot_conversation_id: @conversation_id
        )

        hold = Booking::BookingHold.create!(
          appointment: appointment,
          expires_at: 10.minutes.from_now,
          token: SecureRandom.hex(16)
        )

        hold
      end
    end

    def self.cleanup_expired_holds!
      Booking::BookingHold.where('expires_at <= ?', Time.current).find_each do |hold|
        ActiveRecord::Base.transaction do
          appointment = hold.appointment
          appointment.update!(status: 'CANCELLED', notes: "Hold expired at #{hold.expires_at}")
          hold.destroy!
        end
      end
    end
  end
end
