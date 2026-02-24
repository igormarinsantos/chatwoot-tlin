import { Request, Response } from "express";
import db from "../db";
import { v4 as uuidv4 } from "uuid";

export class WebhookController {
  static async subscribe(req: Request, res: Response) {
    try {
      const { clinicId } = req.params;
      const { url, secret, event_types } = req.body;

      if (!url || !secret || !event_types) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const subscription = await db("webhook_subscriptions")
        .insert({
          id: uuidv4(),
          clinic_id: clinicId,
          url,
          secret,
          event_types: JSON.stringify(event_types)
        })
        .returning("*");

      return res.status(201).json(subscription[0]);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async list(req: Request, res: Response) {
    const { clinicId } = req.params;
    const subs = await db("webhook_subscriptions").where({ clinic_id: clinicId });
    return res.json(subs);
  }
}
