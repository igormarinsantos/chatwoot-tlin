module Api
  module V1
    module Booking
      class BaseController < ApplicationController
        # For now, we simplify authentication for the clinical agent
        # In a real scenario, we would use a specific API token
        skip_before_action :verify_authenticity_token
        
        rescue_from ActiveRecord::RecordNotFound, with: :not_found
        rescue_from StandardError, with: :server_error

        private

        def not_found(exception)
          render json: { error: exception.message }, status: :not_found
        end

        def server_error(exception)
          render json: { error: exception.message }, status: :internal_server_error
        end
      end
    end
  end
end
