module Api
  module V1
    module ClinicScheduler
      class HoldsController < BaseController
        def index
          render json: @account.holds.where(status: 'active')
        end

        def create
          begin
            hold = ::ClinicScheduler::HoldService.create_hold(@account, hold_params.merge(idempotency_key: idempotency_key))
            render json: { 
              hold_id: hold.id, 
              expires_at: hold.expires_at, 
              status: hold.status 
            }, status: idempotency_key && hold.created_at < 1.minute.ago ? :ok : :created
          rescue ::ClinicScheduler::OverlapValidator::ConflictError => e
            render_conflict("Horário indisponível.", { conflict: e.message })
          end
        end

        def convert
          begin
            appointment = ::ClinicScheduler::HoldService.convert_hold_to_appointment(
              @account, 
              params[:id], 
              idempotency_key, 
              params[:notes]
            )
            render json: { 
              appointment_id: appointment.id, 
              status: appointment.status, 
              version: appointment.lock_version 
            }, status: idempotency_key && appointment.created_at < 1.minute.ago ? :ok : :created
          rescue ::ClinicScheduler::OverlapValidator::ConflictError => e
            render_conflict("O agendamento conflita com outro evento que acabou de ser marcado.", { conflict: e.message })
          rescue StandardError => e
            render json: { error: 'BAD_REQUEST', message: e.message }, status: :unprocessable_entity
          end
        end

        def destroy
          hold = @account.holds.find_by(id: params[:id])
          if hold && hold.status == 'active'
            hold.update!(status: 'cancelled')
          end
          head :no_content
        end

        private

        def hold_params
          params.require(:hold).permit(
            :procedure_id, 
            :professional_id, 
            :resource_id, 
            :start_at, 
            :end_at, 
            patient_ref: {}
          )
        end
      end
    end
  end
end
