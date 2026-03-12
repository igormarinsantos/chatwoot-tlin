module Api
  module V1
    module ClinicScheduler
      class AppointmentsController < BaseController
        def index
          render json: @account.appointments
        end

        def update
          begin
            appointment = ::ClinicScheduler::AppointmentService.update_appointment(
              @account,
              params[:id],
              {
                expected_version: params[:expected_version],
                patch: appointment_patch_params
              }
            )
            render json: appointment.as_json, status: :ok
          rescue "VERSION_MISMATCH"
            render_version_mismatch
          rescue ::ClinicScheduler::OverlapValidator::ConflictError => e
            render_conflict("O novo horário desejado apresenta um conflito.", { conflict: e.message })
          end
        end

        private

        def appointment_patch_params
          params.require(:patch).permit(
            :start_at,
            :end_at,
            :status,
            :professional_id,
            :resource_id
          )
        end
      end
    end
  end
end
