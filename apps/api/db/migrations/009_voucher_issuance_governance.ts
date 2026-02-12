import type { Knex } from "knex";

const DEFAULT_ALLOWED_TYPES = ["clothing", "furniture", "household"];

export async function up(knex: Knex): Promise<void> {
  const hasVoucherTypeColumn = await knex.schema.hasColumn("vouchers", "voucher_type");
  if (!hasVoucherTypeColumn) {
    await knex.schema.alterTable("vouchers", (table) => {
      table.text("voucher_type").notNullable().defaultTo("clothing");
      table.index(["tenant_id", "voucher_type"], "idx_vouchers__tenant_id_voucher_type");
    });
  }

  const hasTenantVoucherConfigTable = await knex.schema.hasTable("tenant_voucher_type_configs");
  if (!hasTenantVoucherConfigTable) {
    await knex.schema.createTable("tenant_voucher_type_configs", (table) => {
      table.text("tenant_id").primary();
      table
        .jsonb("allowed_voucher_types")
        .notNullable()
        .defaultTo(knex.raw(`'${JSON.stringify(DEFAULT_ALLOWED_TYPES)}'::jsonb`));
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table
        .foreign("tenant_id")
        .references("tenant_id")
        .inTable("platform.tenants")
        .onDelete("CASCADE");
    });
  }

  await knex.raw(
    `
      insert into tenant_voucher_type_configs (tenant_id, allowed_voucher_types)
      select tenant_id, ?::jsonb
      from platform.tenants
      on conflict (tenant_id) do nothing
    `,
    [JSON.stringify(DEFAULT_ALLOWED_TYPES)],
  );

  const hasVoucherAuthorizationsTable = await knex.schema.hasTable("voucher_authorizations");
  if (!hasVoucherAuthorizationsTable) {
    await knex.schema.createTable("voucher_authorizations", (table) => {
      table.uuid("id").primary();
      table.uuid("voucher_id").notNullable().unique();
      table.text("tenant_id").notNullable();
      table.text("voucher_type").notNullable();
      table.text("first_name").notNullable();
      table.text("last_name").notNullable();
      table.date("date_of_birth").notNullable();
      table.integer("household_adults").notNullable();
      table.integer("household_children").notNullable();
      table.text("issuer_mode").notNullable();
      table.text("actor_id").notNullable();
      table.uuid("partner_agency_id");
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.index(["tenant_id"], "idx_voucher_authorizations__tenant_id");
      table
        .foreign("voucher_id")
        .references("id")
        .inTable("vouchers")
        .onDelete("CASCADE");
      table
        .foreign("partner_agency_id")
        .references("id")
        .inTable("partner_agencies")
        .onDelete("SET NULL");
    });
  }

  const hasVoucherRequestsTable = await knex.schema.hasTable("voucher_requests");
  if (!hasVoucherRequestsTable) {
    await knex.schema.createTable("voucher_requests", (table) => {
      table.uuid("id").primary();
      table.text("tenant_id").notNullable();
      table.text("voucher_type").notNullable();
      table.text("first_name").notNullable();
      table.text("last_name").notNullable();
      table.date("date_of_birth").notNullable();
      table.integer("household_adults").notNullable();
      table.integer("household_children").notNullable();
      table.text("status").notNullable().defaultTo("pending");
      table.text("actor_id").notNullable();
      table.uuid("partner_agency_id");
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.index(["tenant_id"], "idx_voucher_requests__tenant_id");
      table.index(["tenant_id", "status"], "idx_voucher_requests__tenant_id_status");
      table
        .foreign("partner_agency_id")
        .references("id")
        .inTable("partner_agencies")
        .onDelete("SET NULL");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasVoucherRequestsTable = await knex.schema.hasTable("voucher_requests");
  if (hasVoucherRequestsTable) {
    await knex.schema.dropTable("voucher_requests");
  }

  const hasVoucherAuthorizationsTable = await knex.schema.hasTable("voucher_authorizations");
  if (hasVoucherAuthorizationsTable) {
    await knex.schema.dropTable("voucher_authorizations");
  }

  const hasTenantVoucherConfigTable = await knex.schema.hasTable("tenant_voucher_type_configs");
  if (hasTenantVoucherConfigTable) {
    await knex.schema.dropTable("tenant_voucher_type_configs");
  }

  const hasVoucherTypeColumn = await knex.schema.hasColumn("vouchers", "voucher_type");
  if (hasVoucherTypeColumn) {
    await knex.schema.alterTable("vouchers", (table) => {
      table.dropIndex(["tenant_id", "voucher_type"], "idx_vouchers__tenant_id_voucher_type");
      table.dropColumn("voucher_type");
    });
  }
}
