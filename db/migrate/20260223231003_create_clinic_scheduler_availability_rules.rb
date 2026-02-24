class CreateClinicSchedulerAvailabilityRules < ActiveRecord::Migration[7.1]
  def change
    create_table :clinic_scheduler_availability_rules do |t|
      t.bigint :professional_id, null: false
      t.integer :day_of_week, null: false # 0-6 (Sunday-Saturday)
      t.string :start_time, null: false # HH:MM
      t.string :end_time, null: false # HH:MM

      t.timestamps
    end

    add_index :clinic_scheduler_availability_rules, :professional_id, name: 'idx_cs_avail_rules_on_prof_id'
  end
end
