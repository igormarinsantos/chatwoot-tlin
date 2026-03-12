import { Request, Response } from "express";
import db from "../db";
import { Professional } from "../models/types";

export class ProfessionalController {
  static async list(req: Request, res: Response) {
    try {
      const clinicId = req.params.clinicId as string;
      const professionals = await db<Professional>("professionals").where({ clinic_id: clinicId });
      
      // Fetch linked procedures for each professional
      const enrichedProfessionals = await Promise.all(professionals.map(async (prof) => {
        const procedures = await db("professional_procedures")
          .join("procedures", "professional_procedures.procedure_id", "procedures.id")
          .where("professional_procedures.professional_id", prof.id)
          .select("procedures.*");
        return { ...prof, procedures };
      }));

      return res.json(enrichedProfessionals);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const clinicId = req.params.clinicId as string;
      const { name, procedure_ids } = req.body;

      const [professional] = await db<Professional>("professionals")
        .insert({ clinic_id: clinicId, name })
        .returning("*");

      if (procedure_ids && procedure_ids.length > 0) {
        const associations = procedure_ids.map((procId: string) => ({
          professional_id: professional.id,
          procedure_id: procId
        }));
        await db("professional_procedures").insert(associations);
      }

      return res.status(201).json(professional);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async updateProcedures(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { procedure_ids } = req.body;

      await db.transaction(async (trx) => {
        await trx("professional_procedures").where({ professional_id: id }).del();
        if (procedure_ids && procedure_ids.length > 0) {
          const associations = procedure_ids.map((procId: string) => ({
            professional_id: id,
            procedure_id: procId
          }));
          await trx("professional_procedures").insert(associations);
        }
      });

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await db("professionals").where({ id }).del();
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
