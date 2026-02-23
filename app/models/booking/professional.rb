module Booking
  class Professional < ApplicationRecord
    has_many :availability_rules, class_name: 'Booking::AvailabilityRule', foreign_key: 'professional_id', dependent: :destroy
    has_many :blocks, class_name: 'Booking::Block', foreign_key: 'professional_id', dependent: :destroy
    has_many :appointments, class_name: 'Booking::Appointment', foreign_key: 'professional_id'

    validates :name, presence: true
    validates :slug, presence: true, uniqueness: true

    scope :active, -> { where(active: true) }
  end
end
