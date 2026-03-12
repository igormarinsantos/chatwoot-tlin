module Api
  module V1
    module ClinicScheduler
      class BaseController < Api::BaseController
        before_action :set_account

        private

        def set_account
          @account = Account.find(params[:clinic_id])
        end

        def idempotency_key
          request.headers['Idempotency-Key']
        end

        def render_conflict(message, details = {})
          render json: { error: 'SLOT_CONFLICT', message: message, details: details }, status: :conflict
        end

        def render_version_mismatch
          render json: { error: 'VERSION_MISMATCH', message: 'Agendamento foi alterado por outra sessão.' }, status: :conflict
        end
      end
    end
  end
end
