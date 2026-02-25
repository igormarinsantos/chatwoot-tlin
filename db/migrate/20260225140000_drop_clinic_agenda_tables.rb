class DropClinicAgendaTables < ActiveRecord::Migration[7.0]
  def change
    drop_table :appointments, if_exists: true
    drop_table :holds, if_exists: true
    drop_table :availability_blocks, if_exists: true
    drop_table :outbox_events, if_exists: true
    drop_table :professional_procedures, if_exists: true
    drop_table :procedures, if_exists: true
    drop_table :resources, if_exists: true
    drop_table :professionals, if_exists: true
  end
end
