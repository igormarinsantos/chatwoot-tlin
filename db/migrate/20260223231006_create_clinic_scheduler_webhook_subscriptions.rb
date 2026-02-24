class CreateClinicSchedulerWebhookSubscriptions < ActiveRecord::Migration[7.1]
  def change
    create_table :clinic_scheduler_webhook_subscriptions do |t|
      t.bigint :clinic_id, null: false
      t.string :target_url, null: false
      t.jsonb :events, default: [] # e.g. ["appointment.confirmed", "reminder.d1"]

      t.timestamps
    end

    add_index :clinic_scheduler_webhook_subscriptions, :clinic_id, name: 'idx_cs_webhook_subs_on_clinic_id'
  end
end
