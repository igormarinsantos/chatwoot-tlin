class CreateClinicSchedulerProfessionals < ActiveRecord::Migration[7.1]
  def change
    create_table :clinic_scheduler_professionals do |t|
      t.bigint :clinic_id, null: false
      t.string :name, null: false
      t.text :bio
      t.string :avatar_url

      t.timestamps
    end

    add_index :clinic_scheduler_professionals, :clinic_id
  end
end
