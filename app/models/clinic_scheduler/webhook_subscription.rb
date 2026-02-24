module ClinicScheduler
  class WebhookSubscription < ApplicationRecord
    self.table_name = "clinic_scheduler_webhook_subscriptions"

    belongs_to :clinic, class_name: "ClinicScheduler::Clinic"

    validates :target_url, presence: true, format: { with: URI::DEFAULT_PARSER.make_regexp }
    validates :events, presence: true
  end
end
