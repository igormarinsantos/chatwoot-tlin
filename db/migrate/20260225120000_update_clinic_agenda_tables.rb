class UpdateClinicAgendaTables < ActiveRecord::Migration[7.0]
  def change
    # Add recurrence to availability blocks
    add_column :availability_blocks, :day_of_week, :string
    add_column :availability_blocks, :start_time, :string
    add_column :availability_blocks, :end_time, :string
    change_column_null :availability_blocks, :start_at, true
    change_column_null :availability_blocks, :end_at, true

    # Add average consultation time to Professional
    add_column :professionals, :average_consultation_time, :integer, default: 30
  end
end
