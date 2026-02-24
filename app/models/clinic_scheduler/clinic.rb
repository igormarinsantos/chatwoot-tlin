module ClinicScheduler
  class Clinic < ApplicationRecord
    self.table_name = "clinic_scheduler_clinics"

    has_many :professionals, class_name: "ClinicScheduler::Professional", foreign_key: "clinic_id", dependent: :destroy
    has_many :procedures, class_name: "ClinicScheduler::Procedure", foreign_key: "clinic_id", dependent: :destroy
    has_many :appointments, class_name: "ClinicScheduler::Appointment", foreign_key: "clinic_id", dependent: :destroy
    has_many :webhook_subscriptions, class_name: "ClinicScheduler::WebhookSubscription", foreign_key: "clinic_id", dependent: :destroy

    validates :name, presence: true
    validates :timezone, presence: true
  end
end
