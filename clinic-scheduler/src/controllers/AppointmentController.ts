import { Request, Response } from "express";
import { AppointmentService } from "../services/AppointmentService";
import { WebhookService } from "../services/WebhookService";

export class AppointmentController {
  static async createHold(req: Request, res: Response) {
    try {
      const { clinicId } = req.params;
      const { professional_id, procedure_id, start_datetime } = req.body;

      const hold = await AppointmentService.createHold(
        clinicId,
        professional_id,
        procedure_id,
        start_datetime
      );

      return res.status(201).json(hold);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async confirm(req: Request, res: Response) {
    try {
      const { id } = req.params; // hold id
      const { patient_name, patient_phone, metadata } = req.body;

      const appointment = await AppointmentService.confirmAppointment(
        id,
        patient_name,
        patient_phone,
        metadata
      );

      // Dispatch webhook
      await WebhookService.dispatch(appointment.clinic_id, "appointment.confirmed", {
        appointment: {
          id: appointment.id,
          start_datetime: appointment.start_datetime,
          end_datetime: appointment.end_datetime,
          patient_phone: appointment.patient_phone,
          metadata: JSON.parse(appointment.metadata)
        }
      });

      return res.json(appointment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentService.cancelAppointment(id);

      await WebhookService.dispatch(appointment.clinic_id, "appointment.cancelled", {
        appointment: {
          id: appointment.id,
          start_datetime: appointment.start_datetime,
          patient_phone: appointment.patient_phone,
          status: appointment.status
        }
      });

      return res.json(appointment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
