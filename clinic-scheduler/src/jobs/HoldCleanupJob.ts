import cron from "node-cron";
import db from "../db/connection";
import { WebhookService } from "../services/WebhookService";

export class HoldCleanupJob {
  static init() {
    // Run every minute
    cron.schedule("* * * * *", () => {
      this.cleanupExpiredHolds();
    });
    console.log("Hold Cleanup Job initialized");
  }

  private static async cleanupExpiredHolds() {
    const expiredHolds = await db("holds")
      .where("expires_at", "<", new Date())
      .andWhere("confirmed_at", null);

    for (const hold of expiredHolds) {
      const appointment = await db("appointments").where({ id: hold.id }).first();
      
      if (appointment && appointment.status === "HOLD") {
        await db("appointments").where({ id: appointment.id }).update({
          status: "CANCELLED",
          metadata: db.raw("metadata || ?", [JSON.stringify({ reason: "hold_expired", expired_at: new Date() })])
        });

        await WebhookService.trigger(appointment.clinic_id, "hold.expired", {
          clinic_id: appointment.clinic_id,
          appointment: {
            id: appointment.id,
            start_datetime: appointment.start_at,
            end_datetime: appointment.end_at,
            patient_phone: appointment.patient_phone,
            metadata: appointment.metadata
          }
        });
      }

      // Delete hold record after processing
      await db("holds").where({ id: hold.id }).delete();
    }
  }
}
