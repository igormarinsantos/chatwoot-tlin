class CreateClinicSchedulerProcedures < ActiveRecord::Migration[7.1]
  def change
    create_table :clinic_scheduler_procedures do |t|
      t.bigint :clinic_id, null: false
      t.string :name, null: false
      t.integer :duration_minutes, null: false
      t.decimal :price, precision: 10, scale: 2

      t.timestamps
    end

    add_index :clinic_scheduler_procedures, :clinic_id
  end
end
