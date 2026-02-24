import { DateTime, Interval } from "luxon";
import db from "../db/connection";

export class AvailabilityService {
  static async getAvailableSlots(clinicId: string, professionalId: string, procedureId: string, dateStr: string) {
    const procedure = await db("procedures").where({ id: procedureId, clinic_id: clinicId }).first();
    if (!procedure) throw new Error("Procedure not found");

    const professional = await db("professionals").where({ id: professionalId, clinic_id: clinicId }).first();
    if (!professional) throw new Error("Professional not found");

    const date = DateTime.fromISO(dateStr);
    const dayOfWeek = date.weekday % 7; // Luxon 1-7 (Mon-Sun), DB 0-6 (Sun-Sat)? Let's assume 0=Sun, 1=Mon...

    // 1. Get Weekly Rules
    const rules = await db("availability_rules").where({
      professional_id: professionalId,
      day_of_week: dayOfWeek
    });

    if (rules.length === 0) return [];

    // 2. Get Blocks & Appointments for the day
    const dayStart = date.startOf("day").toJSDate();
    const dayEnd = date.endOf("day").toJSDate();

    const blocks = await db("blocks")
      .where("professional_id", professionalId)
      .andWhere("start_at", "<", dayEnd)
      .andWhere("end_at", ">", dayStart);

    const appointments = await db("appointments")
      .where("professional_id", professionalId)
      .whereIn("status", ["HOLD", "CONFIRMED"])
      .andWhere("start_at", "<", dayEnd)
      .andWhere("end_at", ">", dayStart);

    const busyIntervals = [
      ...blocks.map(b => Interval.fromDateTimes(DateTime.fromJSDate(b.start_at), DateTime.fromJSDate(b.end_at))),
      ...appointments.map(a => Interval.fromDateTimes(DateTime.fromJSDate(a.start_at), DateTime.fromJSDate(a.end_at)))
    ];

    const slots: string[] = [];
    const duration = procedure.duration_minutes;

    for (const rule of rules) {
      const [startHour, startMin] = rule.start_time.split(":").map(Number);
      const [endHour, endMin] = rule.end_time.split(":").map(Number);

      let currentSlot = date.set({ hour: startHour, minute: startMin, second: 0, millisecond: 0 });
      const ruleEnd = date.set({ hour: endHour, minute: endMin, second: 0, millisecond: 0 });

      while (currentSlot.plus({ minutes: duration }) <= ruleEnd) {
        const slotInterval = Interval.after(currentSlot, { minutes: duration });
        
        const isBusy = busyIntervals.some(busy => busy.overlaps(slotInterval));
        
        if (!isBusy) {
          slots.push(currentSlot.toISO()!);
        }
        
        // Slot increment (here we use duration, but could be 15/30 mins)
        currentSlot = currentSlot.plus({ minutes: 30 }); 
      }
    }

    return slots;
  }
}
