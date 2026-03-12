import cron from "node-cron";
import { DateTime } from "luxon";
import db from "../db";
import { Appointment, Clinic } from "../models/types";
import { WebhookService } from "../services/WebhookService";

export class ReminderJob {
  static start() {
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      console.log("Running reminder job...");
      await this.processReminders();
    });
  }

  static async processReminders() {
    const clinics = await db<Clinic>("clinics").select("*");

    for (const clinic of clinics) {
      const now = DateTime.now().setZone(clinic.timezone);
      
      // 1. D-1 Reminders (Consults tomorrow)
      const tomorrowStart = now.plus({ days: 1 }).startOf("day");
      const tomorrowEnd = now.plus({ days: 1 }).endOf("day");

      const d1Appointments = await db<Appointment>("appointments")
        .where({ clinic_id: clinic.id, status: "CONFIRMED" })
        .andWhere("start_datetime", ">=", tomorrowStart.toJSDate())
        .andWhere("start_datetime", "<=", tomorrowEnd.toJSDate());

      for (const appt of d1Appointments) {
        const metadata = JSON.parse(appt.metadata || "{}");
        if (!metadata.reminder?.d1_sent_at) {
          await this.triggerReminder(appt, "reminder.d1", clinic.timezone);
        }
      }

      // 2. D-0 Reminders (Consults today in ex: 2 hours)
      const twoHoursFromNow = now.plus({ hours: 2 });
      const twoHoursFifteenFromNow = now.plus({ hours: 2, minutes: 15 });

      const d0Appointments = await db<Appointment>("appointments")
        .where({ clinic_id: clinic.id, status: "CONFIRMED" })
        .andWhere("start_datetime", ">=", twoHoursFromNow.toJSDate())
        .andWhere("start_datetime", "<=", twoHoursFifteenFromNow.toJSDate());

      for (const appt of d0Appointments) {
        const metadata = JSON.parse(appt.metadata || "{}");
        if (!metadata.reminder?.d0_sent_at) {
          await this.triggerReminder(appt, "reminder.d0", clinic.timezone);
        }
      }
    }
  }

  static async triggerReminder(appointment: Appointment, event: string, timezone: string) {
    const metadata = JSON.parse(appointment.metadata || "{}");
    const reminderData = metadata.reminder || {};
    
    reminderData[`${event.split(".")[1]}_sent_at`] = DateTime.now().setZone(timezone).toISO();

    await db<Appointment>("appointments")
      .where({ id: appointment.id })
      .update({
        metadata: JSON.stringify({
          ...metadata,
          reminder: reminderData
        })
      });

    await WebhookService.dispatch(appointment.clinic_id, event, {
      appointment: {
        id: appointment.id,
        start_datetime: appointment.start_datetime,
        end_datetime: appointment.end_datetime,
        patient_phone: appointment.patient_phone,
        metadata: JSON.parse(appointment.metadata)
      }
    });
  }
}
