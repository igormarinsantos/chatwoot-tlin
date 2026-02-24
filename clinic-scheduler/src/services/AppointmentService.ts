import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import db from "../db/connection";
import { AvailabilityService } from "./AvailabilityService";
import { WebhookService } from "./WebhookService";

export class AppointmentService {
  static async createHold(clinicId: string, data: { professional_id: string, procedure_id: string, start_datetime: string }) {
    const { professional_id, procedure_id, start_datetime } = data;
    
    // 1. Verify availability
    const slots = await AvailabilityService.getAvailableSlots(clinicId, professional_id, procedure_id, DateTime.fromISO(start_datetime).toISODate()!);
    
    if (!slots.includes(DateTime.fromISO(start_datetime).toISO()!)) {
      throw new Error("Slot no longer available");
    }

    const procedure = await db("procedures").where({ id: procedure_id }).first();
    const endAt = DateTime.fromISO(start_datetime).plus({ minutes: procedure.duration_minutes }).toJSDate();

    const token = `hld_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = DateTime.now().plus({ minutes: 10 }).toJSDate();

    // 2. Create Appointment in HOLD status
    const [appointment] = await db("appointments").insert({
      clinic_id: clinicId,
      professional_id,
      procedure_id,
      patient_name: "PENDING_HOLD",
      patient_phone: "PENDING_HOLD",
      start_at: new Date(start_datetime),
      end_at: endAt,
      status: "HOLD",
      metadata: JSON.stringify({ hold_token: token })
    }).returning("*");

    // 3. Register Hold
    await db("holds").insert({
      token,
      expires_at: expiresAt,
      id: appointment.id // Link hold to appointment id
    });

    return { token, expires_at: expiresAt };
  }

  static async confirmHold(clinicId: string, token: string, patientData: { patient_name: string, patient_phone: string, metadata: any }) {
    const hold = await db("holds").where({ token }).where("expires_at", ">", new Date()).first();
    if (!hold) throw new Error("Hold expired or invalid");

    const [updated] = await db("appointments")
      .where({ id: hold.id, clinic_id: clinicId })
      .update({
        patient_name: patientData.patient_name,
        patient_phone: patientData.patient_phone,
        status: "CONFIRMED",
        metadata: JSON.stringify({ ...patientData.metadata, confirmed_at: new Date() })
      })
      .returning("*");

    await db("holds").where({ token }).update({ confirmed_at: new Date() });

    await WebhookService.trigger(clinicId, "appointment.confirmed", {
        clinic_id: clinicId,
        appointment: {
          id: updated.id,
          start_datetime: updated.start_at,
          end_datetime: updated.end_at,
          patient_phone: updated.patient_phone,
          metadata: updated.metadata
        }
    });

    return updated;
  }

  static async cancelAppointment(clinicId: string, appointmentId: string, reason: string) {
    const [updated] = await db("appointments")
      .where({ id: appointmentId, clinic_id: clinicId })
      .update({
        status: "CANCELLED",
        metadata: db.raw("metadata || ?", [JSON.stringify({ cancellation_reason: reason, cancelled_at: new Date() })])
      })
      .returning("*");

    await WebhookService.trigger(clinicId, "appointment.cancelled", {
      clinic_id: clinicId,
      appointment: {
        id: updated.id,
        start_datetime: updated.start_at,
        end_datetime: updated.end_at,
        patient_phone: updated.patient_phone,
        metadata: updated.metadata
      }
    });

    return updated;
  }

  static async rescheduleAppointment(clinicId: string, appointmentId: string, newStart: string) {
    const appointment = await db("appointments").where({ id: appointmentId, clinic_id: clinicId }).first();
    if (!appointment) throw new Error("Appointment not found");

    // Verify availability for new slot
    const slots = await AvailabilityService.getAvailableSlots(clinicId, appointment.professional_id, appointment.procedure_id, DateTime.fromISO(newStart).toISODate()!);
    
    if (!slots.includes(DateTime.fromISO(newStart).toISO()!)) {
      throw new Error("New slot not available");
    }

    const procedure = await db("procedures").where({ id: appointment.procedure_id }).first();
    const endAt = DateTime.fromISO(newStart).plus({ minutes: procedure.duration_minutes }).toJSDate();

    const [updated] = await db("appointments")
      .where({ id: appointmentId, clinic_id: clinicId })
      .update({
        start_at: new Date(newStart),
        end_at: endAt,
        status: "CONFIRMED", // Ensure it's confirmed if rescheduled
        metadata: db.raw("metadata || ?", [JSON.stringify({ rescheduled_at: new Date() })])
      })
      .returning("*");

    await WebhookService.trigger(clinicId, "appointment.rescheduled", {
      clinic_id: clinicId,
      appointment: {
        id: updated.id,
        start_datetime: updated.start_at,
        end_datetime: updated.end_at,
        patient_phone: updated.patient_phone,
        metadata: updated.metadata
      }
    });

    return updated;
  }
}
