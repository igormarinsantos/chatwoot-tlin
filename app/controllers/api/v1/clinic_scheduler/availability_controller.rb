module Api
  module V1
    module ClinicScheduler
      class AvailabilityController < BaseController
        def show
          slots = ::ClinicScheduler::AvailabilityService.get_slots(@account, params)
          
          render json: {
            clinic_id: @account.id,
            timezone: @account.timezone || 'UTC', # Ensure account model has timezone or fallback
            procedure_id: params[:procedure_id],
            slots: slots
          }, status: :ok
        end
      end
    end
  end
end
