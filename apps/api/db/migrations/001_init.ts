import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createSchemaIfNotExists("platform");

  await knex.schema.withSchema("platform").createTable("tenants", (table) => {
    table.text("tenant_id").primary();
    table.text("host").notNullable().unique();
    table.text("tenant_slug");
    table.text("status").notNullable().defaultTo("active");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.withSchema("platform").createTable("tenant_apps", (table) => {
    table.text("tenant_id").notNullable();
    table.text("app_key").notNullable();
    table.boolean("enabled").notNullable().defaultTo(true);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["tenant_id", "app_key"]);
    table
      .foreign("tenant_id")
      .references("tenant_id")
      .inTable("platform.tenants")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("vouchers", (table) => {
    table.uuid("id").primary();
    table.text("tenant_id").notNullable();
    table.text("status").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(["tenant_id"], "idx_vouchers__tenant_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("vouchers");
  await knex.schema.withSchema("platform").dropTableIfExists("tenant_apps");
  await knex.schema.withSchema("platform").dropTableIfExists("tenants");
}
