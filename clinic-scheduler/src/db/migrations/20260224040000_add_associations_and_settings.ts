import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add operating_hours to clinics
  await knex.schema.alterTable("clinics", (table) => {
    table.jsonb("operating_hours").defaultTo(JSON.stringify({
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: null, close: null },
      sunday: { open: null, close: null }
    }));
  });

  // Create junction table for Professionals and Procedures
  await knex.schema.createTable("professional_procedures", (table) => {
    table.uuid("professional_id").references("id").inTable("professionals").onDelete("CASCADE");
    table.uuid("procedure_id").references("id").inTable("procedures").onDelete("CASCADE");
    table.primary(["professional_id", "procedure_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("professional_procedures");
  await knex.schema.alterTable("clinics", (table) => {
    table.dropColumn("operating_hours");
  });
}
