# == Schema Information
#
# Table name: captain_files
#
#  id           :bigint           not null, primary key
#  account_id   :bigint           not null
#  assistant_id :bigint           not null
#  name         :string           not null
#  description  :text
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
class Captain::File < ApplicationRecord
  self.table_name = 'captain_files'

  belongs_to :account
  belongs_to :assistant, class_name: 'Captain::Assistant'
  
  has_one_attached :file

  validates :name, presence: true
  validates :account_id, presence: true
  validates :assistant_id, presence: true
  validate :validate_file_presence

  scope :ordered, -> { order(created_at: :desc) }

  private

  def validate_file_presence
    errors.add(:file, 'must be attached') unless file.attached?
  end
end
