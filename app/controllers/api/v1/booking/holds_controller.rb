module Api
  module V1
    module Booking
      class HoldsController < BaseController
        def create
          professional = ::Booking::Professional.find(params[:professional_id])
          procedure = ::Booking::Procedure.find(params[:procedure_id])
          
          hold = ::Booking::HoldManager.new(
            professional: professional,
            procedure: procedure,
            start_datetime: params[:desired_slot_start],
            patient_name: params[:patient_name],
            patient_phone: params[:patient_phone],
            conversation_id: params[:conversation_id]
          ).create_hold!

          render json: {
            hold_token: hold.token,
            expires_at: hold.expires_at,
            summary: "Reserva temporria de #{procedure.name} com #{professional.name} em #{hold.appointment.start_datetime.strftime('%d/%m %H:%M')}"
          }, status: :created
        end
      end
    end
  end
end
