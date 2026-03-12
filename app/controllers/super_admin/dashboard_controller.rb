class SuperAdmin::DashboardController < SuperAdmin::ApplicationController
  include ActionView::Helpers::NumberHelper

  def index
    @accounts_count = begin
      number_with_delimiter(Account.count)
    rescue StandardError
      '0'
    end
    @users_count = begin
      number_with_delimiter(User.count)
    rescue StandardError
      '0'
    end
    @inboxes_count = begin
      number_with_delimiter(Inbox.count)
    rescue StandardError
      '0'
    end
    @conversations_count = begin
      number_with_delimiter(Conversation.count)
    rescue StandardError
      '0'
    end

    @data = begin
      Conversation.unscoped.group_by_day(:created_at, range: 30.days.ago..Time.current).count.to_a
    rescue StandardError
      []
    end
  end
end
