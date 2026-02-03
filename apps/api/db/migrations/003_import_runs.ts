import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("import_runs", (table) => {
    table.uuid("id").primary();
    table.text("tenant_id").notNullable();
    table.text("source_system").notNullable();
    table.text("source_voucher_id").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["tenant_id", "source_system", "source_voucher_id"]);
    table.index(["tenant_id"], "idx_import_runs__tenant_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("import_runs");
}
