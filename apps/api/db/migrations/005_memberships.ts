import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("memberships", (table) => {
    table.uuid("id").primary();
    table.text("tenant_id").notNullable();
    table.text("actor_id").notNullable();
    table.text("role").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["tenant_id", "actor_id", "role"]);
    table.index(["tenant_id"], "idx_memberships__tenant_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("memberships");
}
