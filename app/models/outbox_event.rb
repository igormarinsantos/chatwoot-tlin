class OutboxEvent < ApplicationRecord
  belongs_to :account

  validates :event_type, presence: true
  validates :payload, presence: true
  validates :occurred_at, presence: true
end
