module Api
  module V1
    module ClinicScheduler
      class ProceduresController < BaseController
        def index
          render json: @account.procedures
        end

        def create
          @procedure = @account.procedures.new(procedure_params)
          if @procedure.save
            render json: @procedure, status: :created
          else
            render json: { error: @procedure.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def update
          @procedure = @account.procedures.find(params[:id])
          if @procedure.update(procedure_params)
            render json: @procedure
          else
            render json: { error: @procedure.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          @procedure = @account.procedures.find(params[:id])
          @procedure.destroy
          head :no_content
        end

        private

        def procedure_params
          params.require(:procedure).permit(
            :name, :duration_minutes, :buffer_before_minutes, 
            :buffer_after_minutes, :requires_resource, :resource_type_required
          )
        end
      end
    end
  end
end
