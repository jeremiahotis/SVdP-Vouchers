import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("redemptions", (table) => {
    table.uuid("id").primary();
    table.text("tenant_id").notNullable();
    table.uuid("voucher_id").notNullable();
    table.text("receipt_id");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["tenant_id", "voucher_id"]);
    table.unique(["tenant_id", "receipt_id"]);
    table.index(["tenant_id"], "idx_redemptions__tenant_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("redemptions");
}
