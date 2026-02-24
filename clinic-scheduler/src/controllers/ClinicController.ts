import { Request, Response } from "express";
import { AvailabilityService } from "../services/AvailabilityService";
import { AppointmentService } from "../services/AppointmentService";
import db from "../db/connection";

export class ClinicController {
  static async getAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { professional_id, procedure_id, date } = req.query;
      
      const slots = await AvailabilityService.getAvailableSlots(
        id as string, 
        professional_id as string, 
        procedure_id as string, 
        date as string
      );
      
      res.json({ slots });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async createHold(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { professional_id, procedure_id, start_datetime } = req.body;
      
      const hold = await AppointmentService.createHold(id as string, {
        professional_id,
        procedure_id,
        start_datetime
      });
      
      res.status(201).json(hold);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async confirmHold(req: Request, res: Response) {
    try {
      const { id, token } = req.params;
      const { patient_name, patient_phone, metadata } = req.body;
      
      const appointment = await AppointmentService.confirmHold(id as string, token as string, {
        patient_name,
        patient_phone,
        metadata
      });
      
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancelAppointment(req: Request, res: Response) {
    try {
      const { id, appointmentId } = req.params;
      const { reason } = req.body;
      
      const appointment = await AppointmentService.cancelAppointment(id as string, appointmentId as string, reason);
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async rescheduleAppointment(req: Request, res: Response) {
    try {
      const { id, appointmentId } = req.params;
      const { new_start_datetime } = req.body;
      
      const appointment = await AppointmentService.rescheduleAppointment(id as string, appointmentId as string, new_start_datetime);
      res.json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async subscribeWebhook(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { event, url } = req.body;
      
      const secret = `whsec_${Math.random().toString(36).substring(2, 15)}`;
      
      const [subscription] = await db("webhook_subscriptions").insert({
        clinic_id: id as string,
        event,
        url,
        secret
      }).returning("*");
      
      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
