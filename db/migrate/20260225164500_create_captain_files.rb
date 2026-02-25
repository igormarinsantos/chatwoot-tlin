class CreateCaptainFiles < ActiveRecord::Migration[7.0]
  def change
    create_table :captain_files do |t|
      t.references :account, null: false, index: true
      t.references :assistant, null: false, index: true
      t.string :name, null: false
      t.text :description

      t.timestamps
    end
  end
end
