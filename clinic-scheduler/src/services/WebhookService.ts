import axios from "axios";
import crypto from "crypto";
import db from "../db/knex";

export class WebhookService {
  /**
   * Dispatches a webhook to all subscribed URLs for a clinic.
   */
  static async dispatch(clinicId: string, event: string, payload: any) {
    const subscriptions = await db("webhook_subscriptions")
      .where({ clinic_id: clinicId })
      .whereRaw("event_types @> ?", [JSON.stringify([event])]);

    for (const sub of subscriptions) {
      await this.sendWithRetry(sub.url, sub.secret, {
        event,
        clinic_id: clinicId,
        ...payload
      });
    }
  }

  private static async sendWithRetry(url: string, secret: string, payload: any, attempt = 1) {
    const signature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    try {
      await axios.post(url, payload, {
        headers: {
          "X-Scheduler-Signature": signature,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      });
      console.log(`Webhook delivered to ${url} on attempt ${attempt}`);
    } catch (error) {
      console.error(`Webhook delivery failed to ${url} on attempt ${attempt}`);
      if (attempt < 5) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        setTimeout(() => this.sendWithRetry(url, secret, payload, attempt + 1), delay);
      }
    }
  }
}
