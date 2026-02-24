import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("clinics", (table) => {
      table.uuid("id").primary().defaultTo(knex.fn.uuid());
      table.string("name").notNullable();
      table.string("timezone").notNullable().defaultTo("UTC");
      table.timestamps(true, true);
    })
    .createTable("professionals", (table) => {
      table.uuid("id").primary().defaultTo(knex.fn.uuid());
      table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
      table.string("name").notNullable();
      table.timestamps(true, true);
    })
    .createTable("procedures", (table) => {
      table.uuid("id").primary().defaultTo(knex.fn.uuid());
      table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
      table.string("name").notNullable();
      table.integer("duration_minutes").notNullable().defaultTo(30);
      table.timestamps(true, true);
    })
    .createTable("availability_rules", (table) => {
      table.uuid("id").primary().defaultTo(knex.fn.uuid());
      table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
      table.integer("day_of_week").notNullable(); // 0-6 (Sunday-Saturday)
      table.string("start_time").notNullable(); // "HH:mm"
      table.string("end_time").notNullable(); // "HH:mm"
      table.timestamps(true, true);
    })
    .createTable("blocks", (table) => {
      table.uuid("id").primary().defaultTo(knex.fn.uuid());
      table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
      table.datetime("start_datetime").notNullable();
      table.datetime("end_datetime").notNullable();
      table.string("reason").nullable();
      table.timestamps(true, true);
    })
    .createTable("appointments", (table) => {
      table.uuid("id").primary().defaultTo(knex.fn.uuid());
      table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
      table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
      table.uuid("procedure_id").references("id").inTable("procedures").onDelete("CASCADE");
      table.string("patient_name").notNullable();
      table.string("patient_phone").notNullable();
      table.datetime("start_datetime").notNullable();
      table.datetime("end_datetime").notNullable();
      table.enum("status", ["HOLD", "CONFIRMED", "CANCELLED", "NO_SHOW"]).defaultTo("HOLD");
      table.jsonb("metadata").nullable();
      table.timestamps(true, true);
    })
    .createTable("webhook_subscriptions", (table) => {
      table.uuid("id").primary().defaultTo(knex.fn.uuid());
      table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
      table.string("url").notNullable();
      table.jsonb("event_types").notNullable(); // e.g. ["appointment.confirmed", ...]
      table.string("secret").notNullable();
      table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTableIfExists("webhook_subscriptions")
    .dropTableIfExists("appointments")
    .dropTableIfExists("blocks")
    .dropTableIfExists("availability_rules")
    .dropTableIfExists("procedures")
    .dropTableIfExists("professionals")
    .dropTableIfExists("clinics");
}
