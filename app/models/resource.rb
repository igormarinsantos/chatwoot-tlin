class Resource < ApplicationRecord
  belongs_to :account
  has_many :appointments, dependent: :nullify
  has_many :holds, dependent: :nullify
  has_many :availability_blocks, dependent: :destroy

  validates :name, presence: true
end
