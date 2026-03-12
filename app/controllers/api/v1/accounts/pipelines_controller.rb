class Api::V1::Accounts::PipelinesController < Api::V1::Accounts::BaseController
  before_action :fetch_pipeline, only: [:show, :update, :destroy]

  def index
    @pipelines = Current.account.pipelines.order(:position)
  end

  def show; end

  def create
    @pipeline = Current.account.pipelines.create!(permitted_payload)
  end

  def update
    @pipeline.update!(permitted_payload)
  end

  def destroy
    @pipeline.destroy!
    head :no_content
  end

  private

  def fetch_pipeline
    @pipeline = Current.account.pipelines.find(params[:id])
  end

  def permitted_payload
    params.require(:pipeline).permit(
      :name,
      :bound_attribute_key,
      :is_attribute_driven,
      :position
    )
  end
end
