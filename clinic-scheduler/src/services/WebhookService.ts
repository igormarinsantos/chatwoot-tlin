import axios from "axios";
import crypto from "crypto";
import db from "../db/knex";
import { v4 as uuidv4 } from "uuid";

export class WebhookService {
  static async dispatch(clinicId: string, eventType: string, appointment: any) {
    const subscriptions = await db("webhook_subscriptions")
      .where({ clinic_id: clinicId, enabled: true })
      .whereRaw("? = ANY(event_types)", [eventType]);

    const payload = {
      event: eventType,
      clinic_id: clinicId,
      appointment,
      created_at: new Date().toISOString()
    };

    for (const sub of subscriptions) {
      const deliveryId = uuidv4();
      const body = JSON.stringify(payload);
      const signature = crypto
        .createHmac("sha256", sub.secret)
        .update(body)
        .digest("hex");

      // Log delivery attempt
      const [logId] = await db("webhook_delivery_logs").insert({
        subscription_id: sub.id,
        event_type: eventType,
        payload: payload,
        status: "PENDING",
        attempts: 0
      }).returning("id");

      this.sendRequest(sub.url, body, signature, eventType, deliveryId, logId.id);
    }
  }

  private static async sendRequest(url: string, body: string, signature: string, eventType: string, deliveryId: string, logId: string) {
    try {
      await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-Event-Type": eventType,
          "X-Delivery-Id": deliveryId
        },
        timeout: 5000
      });

      await db("webhook_delivery_logs").where({ id: logId }).update({
        status: "SENT",
        attempts: db.raw("attempts + 1"),
        updated_at: new Date()
      });
    } catch (error: any) {
      const nextRetry = this.calculateNextRetry(1); // First failure
      await db("webhook_delivery_logs").where({ id: logId }).update({
        status: "FAILED",
        attempts: db.raw("attempts + 1"),
        last_error: error.message,
        next_retry_at: nextRetry,
        updated_at: new Date()
      });
    }
  }

  static calculateNextRetry(attempts: number): Date | null {
    const backoffs = [1, 5, 15, 60, 360]; // minutes
    if (attempts > backoffs.length) return null;
    return new Date(Date.now() + backoffs[attempts - 1] * 60000);
  }

  static async retryFailedWebhooks() {
    const pendingLogs = await db("webhook_delivery_logs")
      .join("webhook_subscriptions", "webhook_delivery_logs.subscription_id", "webhook_subscriptions.id")
      .where("webhook_delivery_logs.status", "FAILED")
      .where("webhook_delivery_logs.attempts", "<", 6)
      .where("webhook_delivery_logs.next_retry_at", "<=", new Date())
      .select("webhook_delivery_logs.*", "webhook_subscriptions.url", "webhook_subscriptions.secret");

    for (const log of pendingLogs) {
      const body = JSON.stringify(log.payload);
      const signature = crypto
        .createHmac("sha256", log.secret)
        .update(body)
        .digest("hex");
      const deliveryId = uuidv4();

      try {
        await axios.post(log.url, body, {
          headers: {
            "Content-Type": "application/json",
            "X-Signature": signature,
            "X-Event-Type": log.event_type,
            "X-Delivery-Id": deliveryId
          },
          timeout: 5000
        });

        await db("webhook_delivery_logs").where({ id: log.id }).update({
          status: "SENT",
          attempts: db.raw("attempts + 1"),
          updated_at: new Date()
        });
      } catch (error: any) {
        const nextRetry = this.calculateNextRetry(log.attempts + 1);
        await db("webhook_delivery_logs").where({ id: log.id }).update({
          attempts: db.raw("attempts + 1"),
          last_error: error.message,
          next_retry_at: nextRetry,
          updated_at: new Date()
        });
      }
    }
  }
}
