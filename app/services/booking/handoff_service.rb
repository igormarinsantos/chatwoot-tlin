module Booking
  class HandoffService
    def initialize(appointment_id: nil, patient_data: {})
      @appointment = Booking::Appointment.find_by(id: appointment_id) if appointment_id
      @patient_data = patient_data
    end

    def generate_summary
      {
        patient_name: @appointment&.patient_name || @patient_data[:name],
        phone: @appointment&.patient_phone || @patient_data[:phone],
        procedure: @appointment&.procedure&.name || @patient_data[:procedure],
        preferred_days: @patient_data[:preferred_days],
        suggested_slots: @patient_data[:suggested_slots],
        objection: @patient_data[:objection],
        last_messages_summary: @patient_data[:last_messages_summary]
      }.compact
    end

    def formatted_summary
      summary = generate_summary
      <<~SUMMARY
        [ RESUMO PARA HANDOFF HUMANO ]
        Nome: #{summary[:patient_name]}
        Telefone: #{summary[:phone]}
        Procedimento: #{summary[:procedure]}
        Preferncia: #{summary[:preferred_days]}
        Horrios Sugeridos: #{summary[:suggested_slots]}
        Objeo: #{summary[:objection]}
        Resumo da Conversa: #{summary[:last_messages_summary]}
      SUMMARY
    end
  end
end
