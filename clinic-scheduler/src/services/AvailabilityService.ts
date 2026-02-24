import { DateTime, Interval } from "luxon";
import db from "../db";
import { AvailabilityRule, Block, Appointment, Procedure } from "../models/types";

export class AvailabilityService {
  /**
   * Calculates available slots for a professional on a specific date range.
   */
  static async getAvailableSlots(
    clinicId: string,
    professionalId: string,
    procedureId: string,
    from: DateTime,
    to: DateTime
  ) {
    // 1. Fetch Procedure duration
    const procedure = await db<Procedure>("procedures")
      .where({ id: procedureId, clinic_id: clinicId })
      .first();
    
    if (!procedure) throw new Error("Procedure not found");

    // 2. Fetch Availability Rules
    const rules = await db<AvailabilityRule>("availability_rules")
      .where({ professional_id: professionalId });

    // 3. Fetch Blocks in the range
    const blocks = await db<Block>("blocks")
      .where("professional_id", professionalId)
      .andWhere("start_datetime", "<", to.toJSDate())
      .andWhere("end_datetime", ">", from.toJSDate());

    // 4. Fetch existing Appointments (CONFIRMED or HOLD)
    const appointments = await db<Appointment>("appointments")
      .where({ professional_id: professionalId })
      .whereIn("status", ["CONFIRMED", "HOLD"])
      .andWhere("start_datetime", "<", to.toJSDate())
      .andWhere("end_datetime", ">", from.toJSDate());

    const availableSlots: { start: string; end: string }[] = [];

    // Iterate day by day in the range
    let currentDay = from.startOf("day");
    while (currentDay <= to) {
      const dayOfWeek = currentDay.weekday % 7; // Luxon 1-7 (Mon-Sun) -> 0-6 (Sun-Sat) ? 
      // Actually Luxon: 1 (Mon) to 7 (Sun). 
      // My migration said 0-6 (Sun-Sat). Let's adjust:
      const dbDayOfWeek = currentDay.weekday === 7 ? 0 : currentDay.weekday;

      const dayRules = rules.filter(r => r.day_of_week === dbDayOfWeek);

      for (const rule of dayRules) {
        const [startH, startM] = rule.start_time.split(":").map(Number);
        const [endH, endM] = rule.end_time.split(":").map(Number);

        let slotStart = currentDay.set({ hour: startH, minute: startM });
        const dayEnd = currentDay.set({ hour: endH, minute: endM });

        while (slotStart.plus({ minutes: procedure.duration_minutes }) <= dayEnd) {
          const slotEnd = slotStart.plus({ minutes: procedure.duration_minutes });
          const slotInterval = Interval.fromDateTimes(slotStart, slotEnd);

          // Check if slot overlaps with any blocks
          const isBlocked = blocks.some(b => 
            Interval.fromDateTimes(DateTime.fromJSDate(b.start_datetime), DateTime.fromJSDate(b.end_datetime))
              .overlaps(slotInterval)
          );

          // Check if slot overlaps with any appointments
          const isBooked = appointments.some(a => 
            Interval.fromDateTimes(DateTime.fromJSDate(a.start_datetime), DateTime.fromJSDate(a.end_datetime))
              .overlaps(slotInterval)
          );

          if (!isBlocked && !isBooked) {
            availableSlots.push({
              start: slotStart.toISO()!,
              end: slotEnd.toISO()!
            });
          }

          // Advance by procedure duration (or a smaller step like 15-30m if we want sliding slots)
          // For MVP, we'll advance by the duration to have discrete blocks.
          slotStart = slotEnd;
        }
      }

      currentDay = currentDay.plus({ days: 1 });
    }

    return availableSlots;
  }
}
