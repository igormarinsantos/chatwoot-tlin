module ClinicScheduler
  class Professional < ApplicationRecord
    self.table_name = "clinic_scheduler_professionals"

    belongs_to :clinic, class_name: "ClinicScheduler::Clinic"
    has_many :availability_rules, class_name: "ClinicScheduler::AvailabilityRule", foreign_key: "professional_id", dependent: :destroy
    has_many :blocks, class_name: "ClinicScheduler::Block", foreign_key: "professional_id", dependent: :destroy
    has_many :appointments, class_name: "ClinicScheduler::Appointment", foreign_key: "professional_id", dependent: :destroy

    validates :name, presence: true
  end
end
