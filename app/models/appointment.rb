class Appointment < ApplicationRecord
  belongs_to :account
  belongs_to :professional
  belongs_to :resource, optional: true
  belongs_to :procedure

  validates :start_at, presence: true
  validates :end_at, presence: true
  validates :status, presence: true, inclusion: { in: %w[scheduled confirmed completed cancelled no_show rescheduled] }
  
  # Note: `lock_version` handles optimistic locking automatically via ActiveRecord
end
