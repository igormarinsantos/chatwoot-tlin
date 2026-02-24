import { Request, Response } from "express";
import { AvailabilityService } from "../services/AvailabilityService";
import { AppointmentService } from "../services/AppointmentService";
import { WebhookService } from "../services/WebhookService";
import db from "../db/knex";

export class ClinicController {
  static async getAvailability(req: Request, res: Response) {
    try {
      const { clinicId } = req.params;
      const { professional_id, procedure_id, date } = req.query;
      
      const slots = await AvailabilityService.getAvailableSlots({
        clinicId,
        professionalId: professional_id as string,
        procedureId: procedure_id as string,
        date: date as string,
      });

      res.json(slots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createHold(req: Request, res: Response) {
    try {
      const { clinicId } = req.params;
      const { professional_id, procedure_id, start_datetime } = req.body;

      const hold = await AppointmentService.createHold({
        clinicId,
        professionalId: professional_id,
        procedureId: procedure_id,
        startDatetime: start_datetime,
      });

      res.status(201).json(hold);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async confirmHold(req: Request, res: Response) {
    try {
      const { clinicId, token } = req.params;
      const { patient_name, patient_phone, metadata } = req.body;

      const appointment = await AppointmentService.confirmHold(token, {
        patientName: patient_name,
        patientPhone: patient_phone,
        metadata: { ...metadata, clinic_id: clinicId },
      });

      // Dispatch webhook
      await WebhookService.dispatch(clinicId, "appointment.confirmed", { appointment });

      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancelAppointment(req: Request, res: Response) {
    try {
      const { clinicId, id } = req.params;
      const appointment = await AppointmentService.cancelAppointment(id);

      if (appointment) {
        await WebhookService.dispatch(clinicId, "appointment.cancelled", { appointment });
      }

      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async subscribeWebhook(req: Request, res: Response) {
    try {
      const { clinicId } = req.params;
      const { url, event_types, secret } = req.body;

      const [subscription] = await db("webhook_subscriptions").insert({
        clinic_id: clinicId,
        url,
        event_types: JSON.stringify(event_types),
        secret,
      }).returning("*");

      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
