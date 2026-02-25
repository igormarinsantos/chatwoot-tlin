module Api
  module V1
    module ClinicScheduler
      class ResourcesController < BaseController
        def index
          render json: @account.resources
        end

        def create
          @resource = @account.resources.new(resource_params)
          if @resource.save
            render json: @resource, status: :created
          else
            render json: { error: @resource.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def update
          @resource = @account.resources.find(params[:id])
          if @resource.update(resource_params)
            render json: @resource
          else
            render json: { error: @resource.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          @resource = @account.resources.find(params[:id])
          @resource.destroy
          head :no_content
        end

        private

        def resource_params
          params.require(:resource).permit(:name, :resource_type, :capacity, :active)
        end
      end
    end
  end
end
