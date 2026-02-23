module Booking
  class BookingHold < ApplicationRecord
    belongs_to :appointment, class_name: 'Booking::Appointment'

    validates :token, presence: true, uniqueness: true
    validates :expires_at, presence: true

    scope :active, -> { where('expires_at > ?', Time.current) }

    def expired?
      expires_at <= Time.current
    end
  end
end
