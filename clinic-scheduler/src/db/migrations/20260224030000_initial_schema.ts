import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("clinics", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.string("timezone").defaultTo("America/Sao_Paulo");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("professionals", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.string("name").notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("procedures", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.string("name").notNullable();
    table.integer("duration_minutes").notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("availability_rules", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
    table.integer("day_of_week").notNullable(); // 0-6 (Sunday-Saturday)
    table.string("start_time").notNullable(); // HH:mm
    table.string("end_time").notNullable();   // HH:mm
    table.timestamps(true, true);
  });

  await knex.schema.createTable("blocks", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
    table.datetime("start_datetime").notNullable();
    table.datetime("end_datetime").notNullable();
    table.string("reason");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("appointments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("SET NULL");
    table.uuid("procedure_id").references("id").inTable("procedures").onDelete("SET NULL");
    table.string("patient_name");
    table.string("patient_phone").notNullable();
    table.datetime("start_datetime").notNullable();
    table.datetime("end_datetime").notNullable();
    table.string("status").defaultTo("HOLD"); // HOLD, CONFIRMED, CANCELLED, NO_SHOW
    table.jsonb("metadata").defaultTo("{}");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("webhook_subscriptions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.string("url").notNullable();
    table.string("secret").notNullable();
    table.jsonb("event_types").notNullable(); // Array of strings
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("webhook_subscriptions");
  await knex.schema.dropTableIfExists("appointments");
  await knex.schema.dropTableIfExists("blocks");
  await knex.schema.dropTableIfExists("availability_rules");
  await knex.schema.dropTableIfExists("procedures");
  await knex.schema.dropTableIfExists("professionals");
  await knex.schema.dropTableIfExists("clinics");
}
