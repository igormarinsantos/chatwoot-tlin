class Api::V1::Accounts::Captain::FilesController < Api::V1::Accounts::BaseController
  before_action :current_account
  before_action -> { check_authorization(Captain::Assistant) }

  before_action :set_current_page, only: [:index]
  before_action :set_files, except: [:create]
  before_action :set_file_record, only: [:show, :destroy]
  before_action :set_assistant, only: [:create]
  RESULTS_PER_PAGE = 25

  def index
    base_query = @files
    base_query = base_query.where(assistant_id: permitted_params[:assistant_id]) if permitted_params[:assistant_id].present?

    @files_count = base_query.count
    @files = base_query.page(@current_page).per(RESULTS_PER_PAGE)
  end

  def show; end

  def create
    return render_could_not_create_error('Missing Assistant') if @assistant.nil?

    @file_record = @assistant.captain_files.build(file_params)
    @file_record.save!
  rescue ActiveRecord::RecordInvalid => e
    render_could_not_create_error(e.record.errors.full_messages.join(', '))
  end

  def destroy
    @file_record.destroy!
    head :no_content
  end

  private

  def set_files
    @files = Current.account.captain_files.includes(:assistant, file_attachment: :blob).ordered
  end

  def set_file_record
    @file_record = @files.find(permitted_params[:id])
  end

  def set_assistant
    @assistant = Current.account.captain_assistants.find_by(id: file_params[:assistant_id])
  end

  def set_current_page
    @current_page = permitted_params[:page] || 1
  end

  def permitted_params
    params.permit(:assistant_id, :page, :id, :account_id)
  end

  def file_params
    params.require(:captain_file).permit(:name, :description, :assistant_id, :file)
  end
end
