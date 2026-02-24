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
    table.boolean("active").defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("procedures", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.string("name").notNullable();
    table.integer("duration_min").notNullable();
    table.boolean("active").defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("availability_rules", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
    table.integer("weekday").notNullable(); // 0-6
    table.time("start_time").notNullable();
    table.time("end_time").notNullable();
    table.integer("slot_granularity_min").defaultTo(15);
    table.integer("buffer_before_min").defaultTo(0);
    table.integer("buffer_after_min").defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("blocks", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE").nullable();
    table.timestamp("start_datetime").notNullable();
    table.timestamp("end_datetime").notNullable();
    table.string("reason");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("appointments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
    table.uuid("procedure_id").references("id").inTable("procedures").onDelete("CASCADE");
    table.string("patient_name").notNullable();
    table.string("patient_phone").notNullable();
    table.timestamp("start_datetime").notNullable();
    table.timestamp("end_datetime").notNullable();
    table.string("status").defaultTo("CONFIRMED"); // HOLD | CONFIRMED | CANCELLED | NO_SHOW
    table.jsonb("metadata").defaultTo("{}");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("holds", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.uuid("appointment_id").references("id").inTable("appointments").onDelete("CASCADE").nullable();
    table.string("token").unique().notNullable();
    table.timestamp("expires_at").notNullable();
    table.string("status").defaultTo("ACTIVE"); // ACTIVE | EXPIRED | CONVERTED
    table.timestamps(true, true);
  });

  await knex.schema.createTable("webhook_subscriptions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("clinic_id").references("id").inTable("clinics").onDelete("CASCADE");
    table.string("url").notNullable();
    table.string("secret").notNullable();
    table.specificType("event_types", "text[]").notNullable();
    table.boolean("enabled").defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("webhook_delivery_logs", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("subscription_id").references("id").inTable("webhook_subscriptions").onDelete("CASCADE");
    table.string("event_type").notNullable();
    table.jsonb("payload").notNullable();
    table.string("status").defaultTo("PENDING"); // PENDING | SENT | FAILED
    table.integer("attempts").defaultTo(0);
    table.text("last_error");
    table.timestamp("next_retry_at");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("webhook_delivery_logs");
  await knex.schema.dropTableIfExists("webhook_subscriptions");
  await knex.schema.dropTableIfExists("holds");
  await knex.schema.dropTableIfExists("appointments");
  await knex.schema.dropTableIfExists("blocks");
  await knex.schema.dropTableIfExists("availability_rules");
  await knex.schema.dropTableIfExists("procedures");
  await knex.schema.dropTableIfExists("professionals");
  await knex.schema.dropTableIfExists("clinics");
}
