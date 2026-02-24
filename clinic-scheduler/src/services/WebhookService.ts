import axios from "axios";
import crypto from "crypto";
import db from "../db";
import { WebhookSubscription } from "../models/types";

export class WebhookService {
  /**
   * Dispatches a webhook event to all subscribed URLs for a clinic.
   */
  static async dispatch(clinicId: string, event: string, payload: any) {
    const subscriptions = await db<WebhookSubscription>("webhook_subscriptions")
      .where({ clinic_id: clinicId });

    for (const sub of subscriptions) {
      if (sub.event_types.includes(event)) {
        this.send(sub.url, sub.secret, event, payload).catch(err => {
          console.error(`Webhook delivery failed to ${sub.url}`, err);
          // TODO: Implement retry logic or log to DB
        });
      }
    }
  }

  static async send(url: string, secret: string, event: string, payload: any) {
    const body = JSON.stringify({
      event,
      clinic_id: payload.clinic_id,
      timestamp: new Date().toISOString(),
      ...payload
    });

    const signature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-Scheduler-Signature": signature,
        "X-Scheduler-Event": event
      },
      timeout: 5000
    });
  }
}
