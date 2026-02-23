module Booking
  class NotificationJob < ApplicationJob
    queue_as :default

    def perform(type: 'D-1')
      target_date = case type
                    when 'D-1' then Date.tomorrow
                    when 'D-0' then Date.today
                    end

      return unless target_date

      appointments = Booking::Appointment.confirmed.where("DATE(start_datetime) = ?", target_date)
      
      appointments.find_each do |appointment|
        send_reminder(appointment, type)
      end
    end

    private

    def send_reminder(appointment, type)
      return unless appointment.chatwoot_conversation_id

      conversation = Conversation.find_by(id: appointment.chatwoot_conversation_id)
      return unless conversation

      message_params = {
        content: reminder_content(appointment, type),
        message_type: :outgoing,
        private: false,
        account_id: conversation.account_id,
        inbox_id: conversation.inbox_id
      }

      conversation.messages.create!(message_params)
    rescue StandardError => e
      Rails.logger.error "Failed to send booking reminder for appointment #{appointment.id}: #{e.message}"
    end

    def reminder_content(appointment, type)
      time_str = appointment.start_datetime.strftime("%H:%M")
      date_str = appointment.start_datetime.strftime("%d/%m")
      
      if type == 'D-1'
        "Oi #{appointment.patient_name}! Passando para lembrar que voc tem um agendamento amanh (#{date_str})  às #{time_str} com o(a) #{appointment.professional.name}. Voc confirma?"
      else
        "Oi #{appointment.patient_name}! Seu agendamento  hoje às #{time_str}. Nos vemos em breve!"
      end
    end
  end
end
