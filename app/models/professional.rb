class Professional < ApplicationRecord
  belongs_to :account
  has_many :appointments, dependent: :destroy
  has_many :holds, dependent: :destroy
  has_many :availability_blocks, dependent: :destroy

  validates :name, presence: true
end
