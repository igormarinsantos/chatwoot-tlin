import { DateTime } from "luxon";
import db from "../db";
import { Appointment, Procedure, AppointmentStatus } from "../models/types";
import { v4 as uuidv4 } from "uuid";

export class AppointmentService {
  /**
   * Creates a temporary HOLD for a slot.
   */
  static async createHold(
    clinicId: string,
    professionalId: string,
    procedureId: string,
    startDatetime: string
  ) {
    const procedure = await db<Procedure>("procedures")
      .where({ id: procedureId, clinic_id: clinicId })
      .first();
    
    if (!procedure) throw new Error("Procedure not found");

    const start = DateTime.fromISO(startDatetime);
    const end = start.plus({ minutes: procedure.duration_minutes });

    // Check for overlaps (double booking prevention)
    const existing = await db<Appointment>("appointments")
      .where({ professional_id: professionalId })
      .whereIn("status", ["CONFIRMED", "HOLD"])
      .andWhere("start_datetime", "<", end.toJSDate())
      .andWhere("end_datetime", ">", start.toJSDate())
      .first();

    if (existing) throw new Error("Slot already taken");

    const hold = await db<Appointment>("appointments")
      .insert({
        id: uuidv4(),
        clinic_id: clinicId,
        professional_id: professionalId,
        procedure_id: procedureId,
        start_datetime: start.toJSDate(),
        end_datetime: end.toJSDate(),
        status: "HOLD",
        patient_phone: "PENDING", // Temporary
        metadata: JSON.stringify({ hold_expires_at: DateTime.now().plus({ minutes: 15 }).toISO() })
      })
      .returning("*");

    return hold[0];
  }

  /**
   * Confirms a HOLD or creates a direct appointment.
   */
  static async confirmAppointment(
    appointmentId: string,
    patientName: string,
    patientPhone: string,
    metadata: any
  ) {
    const appointment = await db<Appointment>("appointments")
      .where({ id: appointmentId })
      .first();

    if (!appointment) throw new Error("Appointment not found");
    if (appointment.status === "CONFIRMED") return appointment;

    const updated = await db<Appointment>("appointments")
      .where({ id: appointmentId })
      .update({
        patient_name: patientName,
        patient_phone: patientPhone,
        status: "CONFIRMED",
        metadata: JSON.stringify({
          ...JSON.parse(appointment.metadata || "{}"),
          ...metadata,
          confirmed_at: DateTime.now().toISO()
        })
      })
      .returning("*");

    return updated[0];
  }

  static async cancelAppointment(appointmentId: string) {
    const updated = await db<Appointment>("appointments")
      .where({ id: appointmentId })
      .update({ status: "CANCELLED" })
      .returning("*");
    
    return updated[0];
  }
}
