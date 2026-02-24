module ClinicScheduler
  class Block < ApplicationRecord
    self.table_name = "clinic_scheduler_blocks"

    belongs_to :professional, class_name: "ClinicScheduler::Professional"

    validates :start_datetime, presence: true
    validates :end_datetime, presence: true
    validate :end_after_start

    private

    def end_after_start
      return if end_datetime.blank? || start_datetime.blank?
      errors.add(:end_datetime, "must be after start_datetime") if end_datetime <= start_datetime
    end
  end
 end
