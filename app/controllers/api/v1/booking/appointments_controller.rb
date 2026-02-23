module Api
  module V1
    module Booking
      class AppointmentsController < BaseController
        def confirm
          appointment = ::Booking::AppointmentManager.confirm_hold!(params[:hold_token])
          render json: {
            message: "Agendamento confirmado com sucesso!",
            appointment: appointment
          }
        end

        def cancel
          appointment = ::Booking::AppointmentManager.cancel_appointment!(params[:id], params[:reason])
          render json: {
            message: "Agendamento cancelado.",
            appointment: appointment
          }
        end

        def reschedule
          hold = ::Booking::AppointmentManager.reschedule_appointment!(params[:id], params[:new_start_datetime])
          render json: {
            message: "Antigo agendamento cancelado. Novo horário reservado (HOLD).",
            hold_token: hold.token,
            expires_at: hold.expires_at
          }
        end

        def receive_confirmation
          appointment = ::Booking::Appointment.find(params[:id])
          
          case params[:response].to_s
          when '1' # Confirm
            appointment.update!(status: 'CONFIRMED', notes: "Confirmado via WhatsApp")
            render json: { message: "Agendamento confirmado!" }
          when '2' # Reschedule request
            # For now, just mark it or could trigger a handoff
            render json: { message: "Pedido de reagendamento recebido. Por favor, escolha um novo horário." }
          else
            render json: { error: "Opção inválida" }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
