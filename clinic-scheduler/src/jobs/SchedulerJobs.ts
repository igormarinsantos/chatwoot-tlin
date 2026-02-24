import cron from "node-cron";
import db from "../db/knex";
import { DateTime } from "luxon";
import { WebhookService } from "../services/WebhookService";

export class SchedulerJobs {
  static init() {
    // 1. Hold Expirator (Every minute)
    cron.schedule("* * * * *", async () => {
      console.log("[Jobs] Checking expired holds...");
      const expiredHolds = await db("holds")
        .where("status", "ACTIVE")
        .where("expires_at", "<", new Date());

      for (const hold of expiredHolds) {
        await db("holds").where({ id: hold.id }).update({ status: "EXPIRED" });
        await db("appointments").where({ id: hold.appointment_id, status: "HOLD" }).update({ status: "CANCELLED" });
        
        const appointment = await db("appointments").where({ id: hold.appointment_id }).first();
        await WebhookService.dispatch(hold.clinic_id, "hold.expired", appointment);
      }
    });

    // 2. Webhook Retrier (Every minute)
    cron.schedule("* * * * *", async () => {
      console.log("[Jobs] Retrying failed webhooks...");
      await WebhookService.retryFailedWebhooks();
    });

    // 3. Reminders D-1 and D-0 (Every 5 minutes)
    cron.schedule("*/5 * * * *", async () => {
      console.log("[Jobs] Triggering reminders...");
      await this.triggerReminders();
    });
  }

  private static async triggerReminders() {
    const clinics = await db("clinics");

    for (const clinic of clinics) {
      const timezone = clinic.timezone || "America/Sao_Paulo";
      const now = DateTime.now().setZone(timezone);

      // --- D-1 Reminder ---
      // Tomorrow (start and end)
      const tomorrowStart = now.plus({ days: 1 }).startOf("day");
      const tomorrowEnd = tomorrowStart.endOf("day");

      const d1Appointments = await db("appointments")
        .where({ clinic_id: clinic.id, status: "CONFIRMED" })
        .where("start_datetime", ">=", tomorrowStart.toJSDate())
        .where("start_datetime", "<=", tomorrowEnd.toJSDate())
        .whereRaw("NOT (metadata->'reminders'->>'d1_sent_at' IS NOT NULL)");

      for (const app of d1Appointments) {
        await WebhookService.dispatch(clinic.id, "reminder.d1", app);
        const updatedMetadata = { 
          ...app.metadata, 
          reminders: { ...app.metadata.reminders, d1_sent_at: DateTime.now().toISO() } 
        };
        await db("appointments").where({ id: app.id }).update({ metadata: updatedMetadata });
      }

      // --- D-0 Reminder ---
      const d0Hours = parseInt(process.env.REMINDER_D0_HOURS || "2");
      const d0Threshold = now.plus({ hours: d0Hours });

      const d0Appointments = await db("appointments")
        .where({ clinic_id: clinic.id, status: "CONFIRMED" })
        .where("start_datetime", ">=", now.toJSDate())
        .where("start_datetime", "<=", d0Threshold.toJSDate())
        .whereRaw("NOT (metadata->'reminders'->>'d0_sent_at' IS NOT NULL)");

      for (const app of d0Appointments) {
        await WebhookService.dispatch(clinic.id, "reminder.d0", app);
        const updatedMetadata = { 
          ...app.metadata, 
          reminders: { ...app.metadata.reminders, d0_sent_at: DateTime.now().toISO() } 
        };
        await db("appointments").where({ id: app.id }).update({ metadata: updatedMetadata });
      }
    }
  }
}
