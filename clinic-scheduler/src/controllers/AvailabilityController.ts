import { Request, Response } from "express";
import { DateTime } from "luxon";
import { AvailabilityService } from "../services/AvailabilityService";
import db from "../db";
import { Clinic } from "../models/types";

export class AvailabilityController {
  static async getAvailability(req: Request, res: Response) {
    try {
      const { clinicId } = req.params;
      const { professional_id, procedure_id, from, to } = req.query;

      if (!professional_id || !procedure_id || !from || !to) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const clinic = await db<Clinic>("clinics").where({ id: clinicId }).first();
      if (!clinic) return res.status(404).json({ error: "Clinic not found" });

      const fromDate = DateTime.fromISO(from as string, { zone: clinic.timezone });
      const toDate = DateTime.fromISO(to as string, { zone: clinic.timezone });

      const slots = await AvailabilityService.getAvailableSlots(
        clinicId,
        professional_id as string,
        procedure_id as string,
        fromDate,
        toDate
      );

      return res.json({ slots });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
