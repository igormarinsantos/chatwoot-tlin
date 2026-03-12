class CreatePipelines < ActiveRecord::Migration[7.1]
  def change
    create_table :pipelines do |t|
      t.string :name, null: false
      t.references :account, null: false, foreign_key: true
      t.string :bound_attribute_key, null: false
      t.boolean :is_attribute_driven, default: true
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :pipelines, [:account_id, :bound_attribute_key], unique: true
  end
end
