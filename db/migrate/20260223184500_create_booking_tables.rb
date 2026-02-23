class CreateBookingTables < ActiveRecord::Migration[7.0]
  def change
    create_table :booking_procedures do |t|
      t.string :name, null: false
      t.integer :duration_min, default: 30, null: false
      t.decimal :price, precision: 10, scale: 2
      t.boolean :requires_triage, default: false
      t.boolean :active, default: true
      t.timestamps
    end

    create_table :booking_professionals do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.text :specialties, array: true, default: []
      t.text :procedures, array: true, default: []
      t.integer :default_duration, default: 30
      t.boolean :active, default: true
      t.string :google_calendar_id
      t.timestamps
    end
    add_index :booking_professionals, :slug, unique: true

    create_table :booking_availability_rules do |t|
      t.references :professional, null: false, index: { name: 'index_booking_av_rules_on_professional_id' }
      t.integer :weekday, null: false # 0-6 (Sunday-Saturday)
      t.time :start_time, null: false
      t.time :end_time, null: false
      t.integer :slot_granularity_min, default: 10
      t.integer :buffer_before_min, default: 0
      t.integer :buffer_after_min, default: 0
      t.timestamps
    end

    create_table :booking_blocks do |t|
      t.references :professional, index: { name: 'index_booking_blocks_on_professional_id' }
      t.datetime :start_datetime, null: false
      t.datetime :end_datetime, null: false
      t.string :reason
      t.timestamps
    end

    create_table :booking_appointments do |t|
      t.references :professional, null: false, index: { name: 'index_booking_appointments_on_professional_id' }
      t.references :procedure, null: false, index: { name: 'index_booking_appointments_on_procedure_id' }
      t.string :patient_name, null: false
      t.string :patient_phone, null: false
      t.datetime :start_datetime, null: false
      t.datetime :end_datetime, null: false
      t.string :status, default: 'HOLD', null: false # HOLD, CONFIRMED, CANCELLED, NO_SHOW
      t.string :channel
      t.bigint :chatwoot_conversation_id
      t.text :notes
      t.timestamps
    end
    add_index :booking_appointments, :status

    create_table :booking_holds do |t|
      t.references :appointment, null: false, index: { name: 'index_booking_holds_on_appointment_id' }
      t.datetime :expires_at, null: false
      t.string :token, null: false
      t.timestamps
    end
    add_index :booking_holds, :token, unique: true
  end
end
