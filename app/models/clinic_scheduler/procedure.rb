module ClinicScheduler
  class Procedure < ApplicationRecord
    self.table_name = "clinic_scheduler_procedures"

    belongs_to :clinic, class_name: "ClinicScheduler::Clinic"
    has_many :appointments, class_name: "ClinicScheduler::Appointment", foreign_key: "procedure_id", dependent: :destroy

    validates :name, presence: true
    validates :duration_minutes, presence: true, numericality: { greater_than: 0 }
  end
end
