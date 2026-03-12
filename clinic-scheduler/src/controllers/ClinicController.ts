import { Request, Response } from "express";
import db from "../db";
import { Clinic } from "../models/types";

export class ClinicController {
  static async get(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const clinic = await db<Clinic>("clinics").where({ id }).first();
      
      if (!clinic) {
        // Handle "auto-create" for the default clinic if it doesn't exist
        if (id === "default-clinic" || id === "1") {
          const [newClinic] = await db<Clinic>("clinics")
            .insert({ name: "Clínica Tlin", timezone: "America/Sao_Paulo" })
            .returning("*");
          return res.json(newClinic);
        }
        return res.status(404).json({ error: "Clinic not found" });
      }

      return res.json(clinic);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { name, operating_hours, timezone } = req.body;

      const [updated] = await db<Clinic>("clinics")
        .where({ id })
        .update({ 
          name, 
          operating_hours: typeof operating_hours === 'string' ? operating_hours : JSON.stringify(operating_hours), 
          timezone,
          updated_at: new Date()
        } as any)
        .returning("*");

      return res.json(updated);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
