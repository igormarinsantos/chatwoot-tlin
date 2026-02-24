module Api
  module V1
    module ClinicScheduler
      class BaseController < Api::V1::BaseController
        private

        def clinic
          @clinic ||= ::ClinicScheduler::Clinic.find(params[:clinic_id] || params[:id])
        end
      end
    end
  end
end
