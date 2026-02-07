import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("audit_events", (table) => {
    table.uuid("id").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("audit_events", (table) => {
    table.uuid("id").nullable().alter();
  });
}
