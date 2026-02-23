module Booking
  class AvailabilityRule < ApplicationRecord
    belongs_to :professional, class_name: 'Booking::Professional'

    validates :weekday, presence: true, inclusion: { in: 0..6 }
    validates :start_time, presence: true
    validates :end_time, presence: true
    validate :end_time_after_start_time

    private

    def end_time_after_start_time
      return if start_time.blank? || end_time.blank?

      if end_time <= start_time
        errors.add(:end_time, "must be after start time")
      end
    end
  end
end
