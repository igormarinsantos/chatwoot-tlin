module Api
  module V1
    module ClinicScheduler
      class AvailabilityBlocksController < BaseController
        def index
          render json: @account.availability_blocks
        end

        def create
          if params[:blocks].present? && params[:blocks].is_a?(Array)
            entity_id = params[:entity_id]
            entity_type = params[:entity_type]
            
            # Wipe previous blocks for the entity type (professional or resource)
            if entity_type == 'professional'
              @account.availability_blocks.where(professional_id: entity_id).destroy_all
            elsif entity_type == 'resource'
              @account.availability_blocks.where(resource_id: entity_id).destroy_all
            end
            
            blocks = params[:blocks].map do |b|
              {
                account_id: @account.id,
                professional_id: entity_type == 'professional' ? entity_id : nil,
                resource_id: entity_type == 'resource' ? entity_id : nil,
                block_type: b[:block_type] || b[:type],
                start_at: b[:start_time] || b[:start_at],
                end_at: b[:end_time] || b[:end_at],
                created_at: Time.current,
                updated_at: Time.current
              }
            end
            
            AvailabilityBlock.insert_all!(blocks) unless blocks.empty?
            
            render json: { success: true, message: "Blocks successfully synced." }, status: :created
          else
            @block = @account.availability_blocks.new(block_params)
            if @block.save
              render json: @block, status: :created
            else
              render json: { error: @block.errors.full_messages.join(', ') }, status: :unprocessable_entity
            end
          end
        end

        def update
          @block = @account.availability_blocks.find(params[:id])
          if @block.update(block_params)
            render json: @block
          else
            render json: { error: @block.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end

        def destroy
          @block = @account.availability_blocks.find(params[:id])
          @block.destroy
          head :no_content
        end

        private

        def block_params
          params.require(:availability_block).permit(:professional_id, :resource_id, :block_type, :start_at, :end_at)
        end
      end
    end
  end
end
