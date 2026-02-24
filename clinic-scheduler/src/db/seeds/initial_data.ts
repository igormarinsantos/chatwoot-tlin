import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("availability_rules").del();
  await knex("procedures").del();
  await knex("professionals").del();
  await knex("clinics").del();

  // Inserts seed entries
  const [clinic] = await knex("clinics").insert({
    name: "Tlin Clinic",
    timezone: "America/Sao_Paulo"
  }).returning("*");

  const [professional] = await knex("professionals").insert({
    clinic_id: clinic.id,
    name: "Dr. Igor Marin",
    active: true
  }).returning("*");

  const [procedure] = await knex("procedures").insert({
    clinic_id: clinic.id,
    name: "Consulta Geral",
    duration_min: 30,
    active: true
  }).returning("*");

  await knex("availability_rules").insert([
    {
      clinic_id: clinic.id,
      professional_id: professional.id,
      weekday: 1, // Monday
      start_time: "09:00",
      end_time: "18:00",
      slot_granularity_min: 30
    },
    {
      clinic_id: clinic.id,
      professional_id: professional.id,
      weekday: 2, // Tuesday
      start_time: "09:00",
      end_time: "18:00",
      slot_granularity_min: 30
    },
    {
      clinic_id: clinic.id,
      professional_id: professional.id,
      weekday: 3, // Wednesday
      start_time: "09:00",
      end_time: "18:00",
      slot_granularity_min: 30
    },
    {
      clinic_id: clinic.id,
      professional_id: professional.id,
      weekday: 4, // Thursday
      start_time: "09:00",
      end_time: "18:00",
      slot_granularity_min: 30
    },
    {
      clinic_id: clinic.id,
      professional_id: professional.id,
      weekday: 5, // Friday
      start_time: "09:00",
      end_time: "18:00",
      slot_granularity_min: 30
    }
  ]);
}
