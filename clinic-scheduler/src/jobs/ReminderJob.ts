import cron from "node-cron";
import { DateTime } from "luxon";
import db from "../db/knex";
import { WebhookService } from "../services/WebhookService";

export class ReminderJob {
  static init() {
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      console.log("Running ReminderJob...");
      await this.processD1Reminders();
      await this.processD0Reminders();
    });
  }

  private static async processD1Reminders() {
    const tomorrowStart = DateTime.now().plus({ days: 1 }).startOf("day").toJSDate();
    const tomorrowEnd = DateTime.now().plus({ days: 1 }).endOf("day").toJSDate();

    const appointments = await db("appointments")
      .where({ status: "CONFIRMED" })
      .whereBetween("start_datetime", [tomorrowStart, tomorrowEnd])
      .whereRaw("(metadata->'reminders'->>'d1_sent_at') IS NULL");

    for (const appt of appointments) {
      await WebhookService.dispatch(appt.clinic_id, "reminder.d1", { appointment: appt });
      
      // Mark as sent
      const metadata = appt.metadata || {};
      const reminders = metadata.reminders || {};
      reminders.d1_sent_at = DateTime.now().toISO();
      metadata.reminders = reminders;

      await db("appointments").where({ id: appt.id }).update({ metadata });
    }
  }

  private static async processD0Reminders() {
    const now = DateTime.now();
    const twoHoursFromNow = now.plus({ hours: 2 }).toJSDate();
    const threeHoursFromNow = now.plus({ hours: 3 }).toJSDate(); // Window of 1h to avoid missing

    const appointments = await db("appointments")
      .where({ status: "CONFIRMED" })
      .whereBetween("start_datetime", [twoHoursFromNow, threeHoursFromNow])
      .whereRaw("(metadata->'reminders'->>'d0_sent_at') IS NULL");

    for (const appt of appointments) {
      await WebhookService.dispatch(appt.clinic_id, "reminder.d0", { appointment: appt });

      // Mark as sent
      const metadata = appt.metadata || {};
      const reminders = metadata.reminders || {};
      reminders.d0_sent_at = DateTime.now().toISO();
      metadata.reminders = reminders;

      await db("appointments").where({ id: appt.id }).update({ metadata });
    }
  }
}
