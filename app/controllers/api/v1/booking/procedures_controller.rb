module Api
  module V1
    module Booking
      class ProceduresController < BaseController
        def index
          @procedures = ::Booking::Procedure.active
          render json: @procedures
        end

        def create
          @procedure = ::Booking::Procedure.create!(procedure_params)
          render json: @procedure, status: :created
        end

        private

        def procedure_params
          params.require(:procedure).permit(:name, :duration_min, :price, :requires_triage, :active)
        end
      end
    end
  end
end
