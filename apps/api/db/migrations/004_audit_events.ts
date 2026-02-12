import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("audit_events", (table) => {
    table.uuid("id");
    table.text("tenant_id");
    table.text("actor_id").notNullable();
    table.text("event_type").notNullable();
    table.text("entity_id");
    table.text("reason");
    table.jsonb("metadata");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(["tenant_id"], "idx_audit_events__tenant_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_events");
}
