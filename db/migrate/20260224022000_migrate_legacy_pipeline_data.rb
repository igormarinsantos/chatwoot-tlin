class MigrateLegacyPipelineData < ActiveRecord::Migration[7.1]
  def up
    Account.find_each do |account|
      attr_def = account.custom_attribute_definitions.find_by(
        attribute_key: 'pipeline_stage',
        attribute_model: 'contact_attribute'
      )

      if attr_def
        account.pipelines.find_or_create_by!(bound_attribute_key: 'pipeline_stage') do |p|
          p.name = 'CRM'
          p.is_attribute_driven = true
        end
      end
    end
  end

  def down
    # Optionally remove the migration markers if needed
  end
end
