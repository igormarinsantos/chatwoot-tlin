module Api
  module V1
    module ClinicScheduler
      class AppointmentsController < BaseController
        def create
          # Direct confirmation for now as per MVP requirements
          appointment = clinic.appointments.new(appointment_params)
          
          if appointment.save
            ::ClinicScheduler::WebhookWorker.perform_async(appointment.id, 'appointment.confirmed')
            render json: appointment, status: :created
          else
            render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def cancel
          appointment = clinic.appointments.find(params[:id])
          if appointment.update(status: :cancelled)
            ::ClinicScheduler::WebhookWorker.perform_async(appointment.id, 'appointment.cancelled')
            render json: appointment
          else
            render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def reschedule
          appointment = clinic.appointments.find(params[:id])
          if appointment.update(appointment_params.merge(status: :rescheduled))
            ::ClinicScheduler::WebhookWorker.perform_async(appointment.id, 'appointment.rescheduled')
            render json: appointment
          else
            render json: { errors: appointment.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def appointment_params
          params.require(:appointment).permit(
            :professional_id, :procedure_id, :start_datetime, :end_datetime, metadata: {}
          )
        end
      end
    end
  end
end
