import { DateTime, Interval } from "luxon";
import db from "../db/knex";

export class AvailabilityService {
  /**
   * Calculates available slots for a professional on a specific date.
   */
  static async getAvailableSlots(params: {
    clinicId: string;
    professionalId: string;
    procedureId: string;
    date: string; // "YYYY-MM-DD"
  }) {
    const { clinicId, professionalId, procedureId, date } = params;

    // 1. Get clinic timezone
    const clinic = await db("clinics").where({ id: clinicId }).first();
    const timezone = clinic?.timezone || "UTC";

    // 2. Get procedure duration
    const procedure = await db("procedures").where({ id: procedureId }).first();
    const durationMinutes = procedure?.duration_minutes || 30;

    // 3. Get availability rules for the specific day of week
    const dayOfWeek = DateTime.fromISO(date, { zone: timezone }).weekday % 7; // Sunday=0, Monday=1...
    const rules = await db("availability_rules").where({
      professional_id: professionalId,
      day_of_week: dayOfWeek,
    });

    if (rules.length === 0) return [];

    // 4. Get active appointments and blocks
    const startOfDay = DateTime.fromISO(date, { zone: timezone }).startOf("day").toJSDate();
    const endOfDay = DateTime.fromISO(date, { zone: timezone }).endOf("day").toJSDate();

    const appointments = await db("appointments")
      .where({ professional_id: professionalId })
      .whereIn("status", ["HOLD", "CONFIRMED"])
      .whereBetween("start_datetime", [startOfDay, endOfDay]);

    const blocks = await db("blocks")
      .where({ professional_id: professionalId })
      .whereBetween("start_datetime", [startOfDay, endOfDay]);

    // 5. Generate slots from rules and filter by busy intervals
    const busyIntervals = [
      ...appointments.map(a => Interval.fromDateTimes(DateTime.fromJSDate(a.start_datetime), DateTime.fromJSDate(a.end_datetime))),
      ...blocks.map(b => Interval.fromDateTimes(DateTime.fromJSDate(b.start_datetime), DateTime.fromJSDate(b.end_datetime))),
    ];

    const slots: string[] = [];
    rules.forEach(rule => {
      let current = DateTime.fromISO(`${date}T${rule.start_time}`, { zone: timezone });
      const end = DateTime.fromISO(`${date}T${rule.end_time}`, { zone: timezone });

      while (current.plus({ minutes: durationMinutes }) <= end) {
        const slotInterval = Interval.after(current, { minutes: durationMinutes });
        const isBusy = busyIntervals.some(busy => busy.overlaps(slotInterval));

        if (!isBusy) {
          slots.push(current.toISO());
        }
        current = current.plus({ minutes: durationMinutes });
      }
    });

    return slots;
  }
}
