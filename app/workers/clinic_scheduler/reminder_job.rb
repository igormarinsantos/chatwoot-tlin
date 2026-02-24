module ClinicScheduler
  class ReminderJob
    include Sidekiq::Worker

    def perform
      trigger_d1_reminders
      trigger_d0_reminders
    end

    private

    def trigger_d1_reminders
      # Appointments confirmed, starting in 24-25 hours, that haven't sent d1 reminder
      start_time = 24.hours.from_now
      end_time = 25.hours.from_now
      
      appointments = Appointment.confirmed.where(start_datetime: start_time..end_time)
      
      appointments.each do |appointment|
        next if appointment.reminders_sent["d1"]
        
        WebhookWorker.perform_async(appointment.id, 'reminder.d1')
        
        appointment.reminders_sent["d1"] = Time.current
        appointment.save
      end
    end

    def trigger_d0_reminders
      # Appointments confirmed, starting in 2-3 hours, that haven't sent d0 reminder
      start_time = 2.hours.from_now
      end_time = 3.hours.from_now
      
      appointments = Appointment.confirmed.where(start_datetime: start_time..end_time)
      
      appointments.each do |appointment|
        next if appointment.reminders_sent["d0"]
        
        WebhookWorker.perform_async(appointment.id, 'reminder.d0')
        
        appointment.reminders_sent["d0"] = Time.current
        appointment.save
      end
    end
  end
end
