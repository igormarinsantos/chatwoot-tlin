module Booking
  class Procedure < ApplicationRecord
    has_many :appointments, class_name: 'Booking::Appointment', foreign_key: 'procedure_id'

    validates :name, presence: true
    validates :duration_min, presence: true, numericality: { greater_than: 0 }

    scope :active, -> { where(active: true) }
  end
end
