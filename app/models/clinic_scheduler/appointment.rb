module ClinicScheduler
  class Appointment < ApplicationRecord
    self.table_name = "clinic_scheduler_appointments"

    belongs_to :clinic, class_name: "ClinicScheduler::Clinic"
    belongs_to :professional, class_name: "ClinicScheduler::Professional"
    belongs_to :procedure, class_name: "ClinicScheduler::Procedure"

    enum status: { confirmed: 0, cancelled: 1, rescheduled: 2 }

    validates :start_datetime, presence: true
    validates :end_datetime, presence: true
    validate :end_after_start

    # Metadata accessors (Chatwoot integration)
    def chatwoot_contact_id
      metadata["chatwoot_contact_id"]
    end

    def chatwoot_conversation_id
      metadata["chatwoot_conversation_id"]
    end

    private

    def end_after_start
      return if end_datetime.blank? || start_datetime.blank?
      errors.add(:end_datetime, "must be after start_datetime") if end_datetime <= start_datetime
    end
  end
end
