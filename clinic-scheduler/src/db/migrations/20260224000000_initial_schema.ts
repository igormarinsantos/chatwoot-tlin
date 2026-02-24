import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Clinics
  await knex.schema.createTable("clinics", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.string("timezone").notNullable().defaultTo("UTC");
    table.timestamps(true, true);
  });

  // Professionals
  await knex.schema.createTable("professionals", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.string("name").notNullable();
    table.timestamps(true, true);
  });

  // Procedures
  await knex.schema.createTable("procedures", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.string("name").notNullable();
    table.integer("duration_minutes").notNullable();
    table.timestamps(true, true);
  });

  // AvailabilityRules
  await knex.schema.createTable("availability_rules", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
    table.integer("day_of_week").notNullable(); // 0-6
    table.time("start_time").notNullable();
    table.time("end_time").notNullable();
    table.timestamps(true, true);
  });

  // Blocks
  await knex.schema.createTable("blocks", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
    table.datetime("start_at").notNullable();
    table.datetime("end_at").notNullable();
    table.string("reason");
    table.timestamps(true, true);
  });

  // Appointments
  await knex.schema.createTable("appointments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
    table.uuid("procedure_id").references("id").inTable("procedures").onDelete("CASCADE");
    table.string("patient_name").notNullable();
    table.string("patient_phone").notNullable();
    table.datetime("start_at").notNullable();
    table.datetime("end_at").notNullable();
    table.string("status").notNullable().defaultTo("HOLD"); // HOLD, CONFIRMED, CANCELLED, NO_SHOW
    table.jsonb("metadata").notNullable().defaultTo("{}");
    table.timestamps(true, true);
  });

  // Holds
  await knex.schema.createTable("holds", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("token").unique().notNullable();
    table.datetime("expires_at").notNullable();
    table.datetime("confirmed_at");
    table.timestamps(true, true);
  });

  // WebhookSubscriptions
  await knex.schema.createTable("webhook_subscriptions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.string("event").notNullable();
    table.string("url").notNullable();
    table.string("secret").notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("webhook_subscriptions");
  await knex.schema.dropTableIfExists("holds");
  await knex.schema.dropTableIfExists("appointments");
  await knex.schema.dropTableIfExists("blocks");
  await knex.schema.dropTableIfExists("availability_rules");
  await knex.schema.dropTableIfExists("procedures");
  await knex.schema.dropTableIfExists("professionals");
  await knex.schema.dropTableIfExists("clinics");
}
