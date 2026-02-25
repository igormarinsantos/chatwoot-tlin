module Api
  module V1
    module ClinicScheduler
      class ProfessionalsController < BaseController
        def index
          render json: @account.professionals
        end

        def create
          @professional = @account.professionals.new(professional_params)
          if @professional.save
            render json: @professional, status: :created
          else
            render json: { error: @professional.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def update
          @professional = @account.professionals.find(params[:id])
          if @professional.update(professional_params)
            render json: @professional
          else
            render json: { error: @professional.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          @professional = @account.professionals.find(params[:id])
          @professional.destroy
          head :no_content
        end

        private

        def professional_params
          params.require(:professional).permit(:name, :active, :average_consultation_time, :procedure_ids => [], working_hours: {}, buffers_default: {})
        end
      end
    end
  end
end
