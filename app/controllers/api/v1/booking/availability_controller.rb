module Api
  module V1
    module Booking
      class AvailabilityController < BaseController
        def index
          professional = ::Booking::Professional.find(params[:professional_id])
          procedure = ::Booking::Procedure.find(params[:procedure_id])
          date_from = params[:date_from] || Date.today
          date_to = params[:date_to] || 7.days.from_now.to_date

          slots = ::Booking::SlotGenerator.new(
            professional: professional,
            procedure: procedure,
            date_from: date_from,
            date_to: date_to
          ).call

          # Return top 10 suggestions (or as specified)
          render json: {
            professional: professional.name,
            procedure: procedure.name,
            slots: slots.first(10)
          }
        end
      end
    end
  end
end
