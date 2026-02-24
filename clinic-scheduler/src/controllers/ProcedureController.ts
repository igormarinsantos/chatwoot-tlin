import { Request, Response } from "express";
import db from "../db";
import { Procedure } from "../models/types";

export class ProcedureController {
  static async list(req: Request, res: Response) {
    try {
      const clinicId = req.params.clinicId as string;
      const procedures = await db<Procedure>("procedures").where({ clinic_id: clinicId });
      return res.json(procedures);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const clinicId = req.params.clinicId as string;
      const { name, duration_minutes } = req.body;

      const [procedure] = await db<Procedure>("procedures")
        .insert({ clinic_id: clinicId, name, duration_minutes })
        .returning("*");

      return res.status(201).json(procedure);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await db("procedures").where({ id }).del();
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
