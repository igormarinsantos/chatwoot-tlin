module Api
  module V1
    module Booking
      class ProfessionalsController < BaseController
        def index
          @professionals = ::Booking::Professional.active
          render json: @professionals
        end

        def show
          @professional = ::Booking::Professional.find(params[:id])
          render json: @professional
        end

        def create
          @professional = ::Booking::Professional.create!(professional_params)
          render json: @professional, status: :created
        end

        private

        def professional_params
          params.require(:professional).permit(:name, :slug, :default_duration, :active, :google_calendar_id, specialties: [], procedures: [])
        end
      end
    end
  end
end
