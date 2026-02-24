import cron from "node-cron";
import { DateTime } from "luxon";
import db from "../db/connection";
import { WebhookService } from "../services/WebhookService";

export class ReminderJob {
  static init() {
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", () => {
      this.processReminders();
    });
    console.log("Reminder Job initialized");
  }

  private static async processReminders() {
    const now = DateTime.now();

    // D-1 Reminders: Tomorrow
    const tomorrowStart = now.plus({ days: 1 }).startOf("day");
    const tomorrowEnd = now.plus({ days: 1 }).endOf("day");

    const d1Appointments = await db("appointments")
      .where({ status: "CONFIRMED" })
      .where("start_at", ">=", tomorrowStart.toJSDate())
      .where("start_at", "<=", tomorrowEnd.toJSDate())
      .whereRaw("(metadata->>'reminder_d1_sent_at') IS NULL");

    for (const app of d1Appointments) {
      await this.sendReminder(app, "reminder.d1", "reminder_d1_sent_at");
    }

    // D-0 Reminders: Same day, 2 hours ahead (example)
    const d0Start = now.plus({ hours: 1 });
    const d0End = now.plus({ hours: 3 });

    const d0Appointments = await db("appointments")
      .where({ status: "CONFIRMED" })
      .where("start_at", ">=", d0Start.toJSDate())
      .where("start_at", "<=", d0End.toJSDate())
      .whereRaw("(metadata->>'reminder_d0_sent_at') IS NULL");

    for (const app of d0Appointments) {
      await this.sendReminder(app, "reminder.d0", "reminder_d0_sent_at");
    }
  }

  private static async sendReminder(app: any, event: string, metadataKey: string) {
    await WebhookService.trigger(app.clinic_id, event, {
      clinic_id: app.clinic_id,
      appointment: {
        id: app.id,
        start_datetime: app.start_at,
        end_datetime: app.end_at,
        patient_phone: app.patient_phone,
        metadata: app.metadata
      }
    });

    // Update metadata to prevent duplicate reminders
    const updatedMetadata = { ...app.metadata, [metadataKey]: new Date().toISOString() };
    await db("appointments").where({ id: app.id }).update({
      metadata: JSON.stringify(updatedMetadata)
    });
  }
}
