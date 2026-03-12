class Hold < ApplicationRecord
  belongs_to :account
  belongs_to :professional, optional: true
  belongs_to :resource, optional: true
  belongs_to :procedure

  validates :start_at, presence: true
  validates :end_at, presence: true
  validates :status, presence: true, inclusion: { in: %w[active expired cancelled converted] }
  validates :expires_at, presence: true

  # Optimistic check on overlap during creation
  # Actual strict safety is checked in services via Advisory Locks.
end
