import { Request, Response } from "express";
import db from "../db/knex";
import { DateTime } from "luxon";
import { WebhookService } from "../services/WebhookService";

export class AppointmentController {
  static async create(req: Request, res: Response) {
    try {
      const { clinicId } = req.params as { clinicId: string };
      const { professional_id, procedure_id, start_datetime, patient_name, patient_phone, metadata } = req.body;

      const procedure = await db("procedures").where({ id: procedure_id }).first();
      if (!procedure) return res.status(404).json({ error: "Procedure not found" });

      const start = DateTime.fromISO(start_datetime);
      const end = start.plus({ minutes: procedure.duration_min });

      const [appointment] = await db("appointments").insert({
        clinic_id: clinicId,
        professional_id,
        procedure_id,
        patient_name,
        patient_phone,
        start_datetime: start.toISO(),
        end_datetime: end.toISO(),
        metadata: metadata || {},
        status: "CONFIRMED"
      }).returning("*");

      await WebhookService.dispatch(clinicId, "appointment.confirmed", appointment);

      res.status(201).json({ appointment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createHold(req: Request, res: Response) {
    try {
      const { clinicId } = req.params as { clinicId: string };
      const { professional_id, procedure_id, slot_start, patient_name, patient_phone, metadata } = req.body;

      const procedure = await db("procedures").where({ id: procedure_id }).first();
      const start = DateTime.fromISO(slot_start);
      const end = start.plus({ minutes: procedure.duration_min });

      const [appointment] = await db("appointments").insert({
        clinic_id: clinicId,
        professional_id,
        procedure_id,
        patient_name,
        patient_phone,
        start_datetime: start.toISO(),
        end_datetime: end.toISO(),
        metadata: metadata || {},
        status: "HOLD"
      }).returning("*");

      const token = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = DateTime.now().plus({ minutes: 10 }).toISO();

      const [hold] = await db("holds").insert({
        clinic_id: clinicId,
        appointment_id: appointment.id,
        token,
        expires_at: expiresAt,
        status: "ACTIVE"
      }).returning("*");

      res.status(201).json({ 
        hold_token: token, 
        expires_at: expiresAt,
        appointment_preview: appointment
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async confirmHold(req: Request, res: Response) {
    try {
      const { clinicId, token } = req.params as { clinicId: string, token: string };
      const hold = await db("holds").where({ clinic_id: clinicId, token, status: "ACTIVE" }).first();

      if (!hold || DateTime.fromJSDate(hold.expires_at) < DateTime.now()) {
        return res.status(400).json({ error: "Hold expired or invalid" });
      }

      const [appointment] = await db("appointments")
        .where({ id: hold.appointment_id })
        .update({ status: "CONFIRMED" })
        .returning("*");

      await db("holds").where({ id: hold.id }).update({ status: "CONVERTED" });

      await WebhookService.dispatch(clinicId, "appointment.confirmed", appointment);

      res.json({ appointment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async cancel(req: Request, res: Response) {
    try {
      const { clinicId, id } = req.params as { clinicId: string, id: string };
      const { reason } = req.body;

      const [appointment] = await db("appointments")
        .where({ id, clinic_id: clinicId })
        .update({ status: "CANCELLED", metadata: db.raw("metadata || ?", [JSON.stringify({ cancel_reason: reason })]) })
        .returning("*");

      await WebhookService.dispatch(clinicId, "appointment.cancelled", appointment);

      res.json({ appointment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async reschedule(req: Request, res: Response) {
    try {
      const { clinicId, id } = req.params as { clinicId: string, id: string };
      const { new_start_datetime } = req.body;

      const oldApp = await db("appointments").where({ id, clinic_id: clinicId }).first();
      const procedure = await db("procedures").where({ id: oldApp.procedure_id }).first();

      const start = DateTime.fromISO(new_start_datetime);
      const end = start.plus({ minutes: procedure.duration_min });

      const [appointment] = await db("appointments")
        .where({ id, clinic_id: clinicId })
        .update({ 
          start_datetime: start.toISO(), 
          end_datetime: end.toISO(),
          status: "CONFIRMED"
        })
        .returning("*");

      await WebhookService.dispatch(clinicId, "appointment.rescheduled", appointment);

      res.json({ appointment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
