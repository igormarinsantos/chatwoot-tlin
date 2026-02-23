module Booking
  class Appointment < ApplicationRecord
    belongs_to :professional, class_name: 'Booking::Professional'
    belongs_to :procedure, class_name: 'Booking::Procedure'
    has_one :booking_hold, class_name: 'Booking::BookingHold', foreign_key: 'appointment_id', dependent: :destroy

    STATUSES = %w[HOLD CONFIRMED CANCELLED NO_SHOW].freeze

    validates :patient_name, presence: true
    validates :patient_phone, presence: true
    validates :start_datetime, presence: true
    validates :end_datetime, presence: true
    validates :status, presence: true, inclusion: { in: STATUSES }
    validate :end_datetime_after_start_datetime

    scope :confirmed, -> { where(status: 'CONFIRMED') }
    scope :held, -> { where(status: 'HOLD') }
    scope :active, -> { where(status: ['HOLD', 'CONFIRMED']) }

    private

    def end_datetime_after_start_datetime
      return if start_datetime.blank? || end_datetime.blank?

      if end_datetime <= start_datetime
        errors.add(:end_datetime, "must be after start datetime")
      end
    end
  end
end
