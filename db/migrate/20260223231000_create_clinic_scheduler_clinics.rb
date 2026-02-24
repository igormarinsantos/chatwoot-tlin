class CreateClinicSchedulerClinics < ActiveRecord::Migration[7.1]
  def change
    create_table :clinic_scheduler_clinics do |t|
      t.string :name, null: false
      t.string :timezone, default: 'UTC'
      t.jsonb :custom_attributes, default: {}

      t.timestamps
    end
  end
end
