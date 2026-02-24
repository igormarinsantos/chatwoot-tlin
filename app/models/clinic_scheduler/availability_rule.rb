module ClinicScheduler
  class AvailabilityRule < ApplicationRecord
    self.table_name = "clinic_scheduler_availability_rules"

    belongs_to :professional, class_name: "ClinicScheduler::Professional"

    validates :day_of_week, presence: true, inclusion: { in: 0..6 }
    validates :start_time, presence: true, format: { with: /\A\d{2}:\d{2}\z/ }
    validates :end_time, presence: true, format: { with: /\A\d{2}:\d{2}\z/ }
  end
end
