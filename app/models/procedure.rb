class Procedure < ApplicationRecord
  belongs_to :account
  has_many :appointments, dependent: :restrict_with_error
  has_many :holds, dependent: :restrict_with_error

  validates :name, presence: true
end
