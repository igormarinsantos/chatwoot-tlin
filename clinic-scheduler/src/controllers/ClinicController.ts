import { Request, Response } from "express";
import { AvailabilityService } from "../services/AvailabilityService";
import db from "../db/knex";

export class ClinicController {
  static async getAvailability(req: Request, res: Response) {
    try {
      const { clinicId } = req.params as { clinicId: string };
      const { professional_id, procedure_id, from, to } = req.query as { professional_id: string, procedure_id: string, from: string, to: string };

      if (!professional_id || !procedure_id || !from || !to) {
        return res.status(400).json({ error: "Missing parameters" });
      }

      const result = await AvailabilityService.getSlots(
        clinicId,
        professional_id,
        procedure_id,
        from,
        to
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async subscribeWebhook(req: Request, res: Response) {
    try {
      const { clinicId } = req.params as { clinicId: string };
      const { url, secret, event_types, enabled } = req.body;

      const [subscription] = await db("webhook_subscriptions").insert({
        clinic_id: clinicId,
        url,
        secret,
        event_types,
        enabled: enabled ?? true
      }).returning("*");

      res.status(201).json({ subscription });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
