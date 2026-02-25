class AvailabilityBlock < ApplicationRecord
  belongs_to :account
  belongs_to :professional, optional: true
  belongs_to :resource, optional: true

  validates :block_type, presence: true, inclusion: { in: %w[block vacation meeting maintenance] }
  validates :start_at, presence: true
  validates :end_at, presence: true
  
  validate :end_after_start

  private

  def end_after_start
    return if start_at.blank? || end_at.blank?
    errors.add(:end_at, "must be after the start time") if end_at <= start_at
  end
end
