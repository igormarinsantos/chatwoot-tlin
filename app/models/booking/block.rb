module Booking
  class Block < ApplicationRecord
    belongs_to :professional, class_name: 'Booking::Professional', optional: true

    validates :start_datetime, presence: true
    validates :end_datetime, presence: true
    validate :end_datetime_after_start_datetime

    private

    def end_datetime_after_start_datetime
      return if start_datetime.blank? || end_datetime.blank?

      if end_datetime <= start_datetime
        errors.add(:end_datetime, "must be after start datetime")
      end
    end
  end
end
