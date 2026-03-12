class CreateClinicAgendaTables < ActiveRecord::Migration[7.0]
  def change
    # Enable btree_gist extension for tsrange EXCLUDE constraints
    enable_extension 'btree_gist' unless extension_enabled?('btree_gist')

    create_table :professionals do |t|
      t.references :account, null: false, index: true
      t.string :name, null: false
      t.boolean :active, default: true
      t.jsonb :working_hours, default: {}
      t.jsonb :buffers_default, default: {}
      t.integer :procedure_ids, array: true, default: []
      t.timestamps
    end

    create_table :resources do |t|
      t.references :account, null: false, index: true
      t.string :name, null: false
      t.string :resource_type
      t.integer :capacity, default: 1
      t.boolean :active, default: true
      t.timestamps
    end

    create_table :procedures do |t|
      t.references :account, null: false, index: true
      t.string :name, null: false
      t.integer :duration_minutes, default: 30
      t.integer :buffer_before_minutes, default: 0
      t.integer :buffer_after_minutes, default: 0
      t.boolean :requires_resource, default: false
      t.string :resource_type_required
      t.decimal :price, precision: 10, scale: 2, default: 0.0
      t.timestamps
    end

    create_table :availability_blocks do |t|
      t.references :account, null: false, index: true
      t.references :professional, null: true, index: true, foreign_key: true
      t.references :resource, null: true, index: true, foreign_key: true
      t.string :block_type, null: false # block, vacation, meeting, maintenance
      t.datetime :start_at, null: false
      t.datetime :end_at, null: false
      t.timestamps
    end

    create_table :holds do |t|
      t.references :account, null: false, index: true
      t.references :professional, null: true, index: true, foreign_key: true
      t.references :resource, null: true, index: true, foreign_key: true
      t.references :procedure, null: false, index: true, foreign_key: true
      t.jsonb :patient_ref, default: {}
      t.datetime :start_at, null: false
      t.datetime :end_at, null: false
      t.string :status, null: false, default: 'active'
      t.datetime :expires_at, null: false
      t.decimal :predicted_value, precision: 10, scale: 2, default: 0.0
      t.string :idempotency_key
      t.timestamps
    end
    add_index :holds, [:account_id, :idempotency_key], unique: true, where: "idempotency_key IS NOT NULL"

    create_table :appointments do |t|
      t.references :account, null: false, index: true
      t.references :professional, null: false, index: true, foreign_key: true
      t.references :resource, null: true, index: true, foreign_key: true
      t.references :procedure, null: false, index: true, foreign_key: true
      t.jsonb :patient_ref, default: {}
      t.datetime :start_at, null: false
      t.datetime :end_at, null: false
      t.string :status, null: false, default: 'scheduled'
      t.integer :lock_version, default: 0, null: false
      t.decimal :predicted_value, precision: 10, scale: 2, default: 0.0
      t.string :idempotency_key
      t.timestamps
    end
    add_index :appointments, [:account_id, :idempotency_key], unique: true, where: "idempotency_key IS NOT NULL"

    create_table :outbox_events do |t|
      t.references :account, null: false, index: true
      t.string :event_type, null: false
      t.jsonb :payload, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.datetime :delivered_at
      t.integer :attempts, default: 0
      t.text :last_error
      t.timestamps
    end
    
    # Optional: Apply EXCLUDE constraints for tsrange on professional overrides.
    # Note: To fully lock this across appointments AND holds via Postgres exclusively,
    # it requires a complex table or using `tsrange` natively on active holds vs appointments, 
    # but for simplicity and safety, the Advisory Locks in Ruby cover cross-table logic gracefully.
  end
end
