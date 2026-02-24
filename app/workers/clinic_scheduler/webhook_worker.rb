require 'rest-client'

module ClinicScheduler
  class WebhookWorker
    include Sidekiq::Worker
    sidekiq_options retry: 3

    def perform(appointment_id, event_name)
      appointment = Appointment.find(appointment_id)
      clinic = appointment.clinic
      
      subscriptions = clinic.webhook_subscriptions.where("events @> ?", [event_name].to_json)
      
      payload = {
        event: event_name,
        clinic_id: clinic.id,
        appointment: {
          id: appointment.id,
          status: appointment.status,
          start_datetime: appointment.start_datetime,
          end_datetime: appointment.end_datetime,
          patient_phone: appointment.metadata["patient_phone"]
        },
        metadata: appointment.metadata
      }

      subscriptions.each do |sub|
        begin
          RestClient.post(sub.target_url, payload.to_json, { content_type: :json, accept: :json })
        rescue StandardError => e
          Rails.logger.error "ClinicScheduler Webhook Failed to #{sub.target_url}: #{e.message}"
          # Sidekiq retry will handle it if we raise, but we might want to log failures per subscription
        end
      end
    end
  end
end
