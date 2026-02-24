import { DateTime, Interval } from "luxon";
import db from "../db/knex";

interface Slot {
  start: string;
  end: string;
}

export class AvailabilityService {
  static async getSlots(
    clinicId: string,
    professionalId: string,
    procedureId: string,
    from: string,
    to: string
  ): Promise<{ slots: Slot[], next_available_date: string | null }> {
    const fromDate = DateTime.fromISO(from);
    const toDate = DateTime.fromISO(to);

    // 1. Get Clinic Timezone
    const clinic = await db("clinics").where({ id: clinicId }).first();
    const timezone = clinic?.timezone || "America/Sao_Paulo";

    // 2. Get Procedure Duration
    const procedure = await db("procedures").where({ id: procedureId }).first();
    if (!procedure) throw new Error("Procedure not found");
    const durationMin = procedure.duration_min;

    // 3. Get Availability Rules
    const rules = await db("availability_rules").where({ professional_id: professionalId, clinic_id: clinicId });

    // 4. Get Blocks and Appointments
    const blocks = await db("blocks")
      .where({ professional_id: professionalId, clinic_id: clinicId })
      .orWhere({ professional_id: null, clinic_id: clinicId })
      .where("start_datetime", "<", toDate.toISO())
      .where("end_datetime", ">", fromDate.toISO());

    const appointments = await db("appointments")
      .where({ professional_id: professionalId, clinic_id: clinicId })
      .whereIn("status", ["CONFIRMED", "HOLD"])
      .where("start_datetime", "<", toDate.toISO())
      .where("end_datetime", ">", fromDate.toISO());

    const slots: Slot[] = [];
    let currentDay = fromDate.startOf("day");

    // Loop through days from 'from' to 'to'
    while (currentDay <= toDate) {
      const dayOfWeek = currentDay.weekday % 7; // Luxon weekday is 1-7 (Mon-Sun), DB is 0-6
      const dayRules = rules.filter(r => r.weekday === (dayOfWeek === 0 ? 0 : dayOfWeek)); // Adjusting for 0 = Sunday if needed, but let's assume 0-6 matches standard

      for (const rule of dayRules) {
        const [startH, startM] = rule.start_time.split(":").map(Number);
        const [endH, endM] = rule.end_time.split(":").map(Number);

        let currentSlotStart = currentDay.set({ hour: startH, minute: startM }).setZone(timezone);
        const dayEnd = currentDay.set({ hour: endH, minute: endM }).setZone(timezone);

        const slotGranularity = rule.slot_granularity_min || 15;
        const bufferBefore = rule.buffer_before_min || 0;
        const bufferAfter = rule.buffer_after_min || 0;

        while (currentSlotStart.plus({ minutes: durationMin + bufferAfter }) <= dayEnd) {
          const slotEnd = currentSlotStart.plus({ minutes: durationMin });
          const slotInterval = Interval.fromDateTimes(
            currentSlotStart.minus({ minutes: bufferBefore }),
            slotEnd.plus({ minutes: bufferAfter })
          );

          // Check for conflicts with blocks
          const hasBlockConflict = blocks.some(b => {
             const blockInterval = Interval.fromDateTimes(DateTime.fromJSDate(b.start_datetime), DateTime.fromJSDate(b.end_datetime));
             return slotInterval.overlaps(blockInterval);
          });

          // Check for conflicts with appointments
          const hasAppointmentConflict = appointments.some(a => {
            const appInterval = Interval.fromDateTimes(DateTime.fromJSDate(a.start_datetime), DateTime.fromJSDate(a.end_datetime));
            return slotInterval.overlaps(appInterval);
          });

          if (!hasBlockConflict && !hasAppointmentConflict && currentSlotStart >= fromDate) {
            slots.push({
              start: currentSlotStart.toISO()!,
              end: slotEnd.toISO()!
            });
          }

          currentSlotStart = currentSlotStart.plus({ minutes: slotGranularity });
        }
      }
      currentDay = currentDay.plus({ days: 1 });
    }

    return {
      slots,
      next_available_date: slots.length === 0 ? null : null // Simplification: in a real scenarios we'd search further
    };
  }
}
