class Pipeline < ApplicationRecord
  belongs_to :account

  validates :name, presence: true
  validates :bound_attribute_key, presence: true, uniqueness: { scope: :account_id }

  def stages
    attribute_definition&.attribute_values || []
  end

  def attribute_definition
    account.custom_attribute_definitions.find_by(
      attribute_key: bound_attribute_key,
      attribute_model: 'contact_attribute'
    )
  end
end
