import axios from "axios";
import crypto from "crypto";
import db from "../db/connection";

export class WebhookService {
  static async trigger(clinicId: string, event: string, payload: any) {
    const subscriptions = await db("webhook_subscriptions").where({
      clinic_id: clinicId,
      event
    });

    for (const sub of subscriptions) {
      this.dispatch(sub.url, sub.secret, event, payload);
    }
  }

  private static async dispatch(url: string, secret: string, event: string, payload: any) {
    const data = {
      event,
      timestamp: new Date().toISOString(),
      ...payload
    };

    const signature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(data))
      .digest("hex");

    try {
      await axios.post(url, data, {
        headers: {
          "X-Scheduler-Signature": signature,
          "Content-Type": "application/json"
        },
        timeout: 5000
      });
      console.log(`Webhook ${event} sent to ${url}`);
    } catch (error: any) {
      console.error(`Failed to send webhook to ${url}: ${error.message}`);
      // Simple retry logic could be added here or move to a background job
    }
  }
}
