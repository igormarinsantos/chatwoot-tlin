class CreateClinicSchedulerBlocks < ActiveRecord::Migration[7.1]
  def change
    create_table :clinic_scheduler_blocks do |t|
      t.bigint :professional_id, null: false
      t.datetime :start_datetime, null: false
      t.datetime :end_datetime, null: false
      t.string :reason

      t.timestamps
    end

    add_index :clinic_scheduler_blocks, :professional_id
  end
end
