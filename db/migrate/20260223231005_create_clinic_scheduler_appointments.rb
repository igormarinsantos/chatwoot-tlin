class CreateClinicSchedulerAppointments < ActiveRecord::Migration[7.1]
  def change
    create_table :clinic_scheduler_appointments do |t|
      t.bigint :clinic_id, null: false
      t.bigint :professional_id, null: false
      t.bigint :procedure_id, null: false
      t.datetime :start_datetime, null: false
      t.datetime :end_datetime, null: false
      t.integer :status, default: 0 # 0: confirmed, 1: cancelled, 2: rescheduled
      t.jsonb :metadata, default: {}
      t.jsonb :reminders_sent, default: {}

      t.timestamps
    end

    add_index :clinic_scheduler_appointments, :clinic_id
    add_index :clinic_scheduler_appointments, :professional_id
    add_index :clinic_scheduler_appointments, :procedure_id
    add_index :clinic_scheduler_appointments, :start_datetime
  end
end
