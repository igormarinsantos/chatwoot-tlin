import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import db from "../db/knex";

export class AppointmentService {
  /**
   * Creates a temporary hold for a slot.
   */
  static async createHold(params: {
    clinicId: string;
    professionalId: string;
    procedureId: string;
    startDatetime: string;
  }) {
    const { clinicId, professionalId, procedureId, startDatetime } = params;

    const procedure = await db("procedures").where({ id: procedureId }).first();
    const duration = procedure?.duration_minutes || 30;
    const endDatetime = DateTime.fromISO(startDatetime).plus({ minutes: duration }).toJSDate();

    // Create appointment with HOLD status
    const [appointment] = await db("appointments").insert({
      id: uuidv4(),
      clinic_id: clinicId,
      professional_id: professionalId,
      procedure_id: procedureId,
      patient_name: "HOLD", // Temporary
      patient_phone: "HOLD", // Temporary
      start_datetime: DateTime.fromISO(startDatetime).toJSDate(),
      end_datetime: endDatetime,
      status: "HOLD",
      metadata: { hold_expires_at: DateTime.now().plus({ minutes: 15 }).toISO() }
    }).returning("*");

    return appointment;
  }

  /**
   * Confirms a hold and converts it into a CONFIRMED appointment.
   */
  static async confirmHold(token: string, data: {
    patientName: string;
    patientPhone: string;
    metadata: any;
  }) {
    const { patientName, patientPhone, metadata } = data;

    const [appointment] = await db("appointments")
      .where({ id: token, status: "HOLD" })
      .update({
        patient_name: patientName,
        patient_phone: patientPhone,
        status: "CONFIRMED",
        metadata: { ...metadata, confirmed_at: DateTime.now().toISO() },
        updated_at: db.fn.now()
      })
      .returning("*");

    if (!appointment) throw new Error("Hold not found or already confirmed/expired");

    return appointment;
  }

  static async cancelAppointment(id: string) {
    const [appointment] = await db("appointments")
      .where({ id })
      .update({ status: "CANCELLED", updated_at: db.fn.now() })
      .returning("*");
    
    return appointment;
  }
}
