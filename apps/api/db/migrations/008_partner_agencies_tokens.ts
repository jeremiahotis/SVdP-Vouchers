import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasPartnerAgencies = await knex.schema.hasTable("partner_agencies");
  if (!hasPartnerAgencies) {
    await knex.schema.createTable("partner_agencies", (table) => {
      table.uuid("id").primary();
      table.text("tenant_id").notNullable();
      table.text("name").notNullable();
      table.text("status").notNullable().defaultTo("active");
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.index(["tenant_id"], "idx_partner_agencies__tenant_id");
      table.unique(["id", "tenant_id"], "uq_partner_agencies__id_tenant_id");
      table
        .foreign("tenant_id")
        .references("tenant_id")
        .inTable("platform.tenants")
        .onDelete("CASCADE");
    });
  }

  const hasPartnerTokens = await knex.schema.hasTable("partner_tokens");
  if (!hasPartnerTokens) {
    await knex.schema.createTable("partner_tokens", (table) => {
      table.uuid("id").primary();
      table.text("tenant_id").notNullable();
      table.uuid("partner_agency_id").notNullable();
      table.text("token_hash").notNullable().unique();
      table.text("status").notNullable().defaultTo("active");
      table
        .jsonb("form_config")
        .notNullable()
        .defaultTo(knex.raw("'{}'::jsonb"));
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp("last_used_at", { useTz: true });
      table.index(["tenant_id"], "idx_partner_tokens__tenant_id");
      table.index(["partner_agency_id"], "idx_partner_tokens__partner_agency_id");
      table
        .foreign("tenant_id")
        .references("tenant_id")
        .inTable("platform.tenants")
        .onDelete("CASCADE");
      table
        .foreign(["partner_agency_id", "tenant_id"])
        .references(["id", "tenant_id"])
        .inTable("partner_agencies")
        .onDelete("CASCADE");
    });
  }

  const hasVoucherPartnerColumn = await knex.schema.hasColumn("vouchers", "partner_agency_id");
  if (!hasVoucherPartnerColumn) {
    await knex.schema.alterTable("vouchers", (table) => {
      table.uuid("partner_agency_id");
      table.index(["partner_agency_id"], "idx_vouchers__partner_agency_id");
      table
        .foreign("partner_agency_id")
        .references("id")
        .inTable("partner_agencies")
        .onDelete("SET NULL");
    });
  }

  const hasAuditPartnerColumn = await knex.schema.hasColumn("audit_events", "partner_agency_id");
  if (!hasAuditPartnerColumn) {
    await knex.schema.alterTable("audit_events", (table) => {
      table.uuid("partner_agency_id");
      table.index(["partner_agency_id"], "idx_audit_events__partner_agency_id");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasAuditPartnerColumn = await knex.schema.hasColumn("audit_events", "partner_agency_id");
  if (hasAuditPartnerColumn) {
    await knex.schema.alterTable("audit_events", (table) => {
      table.dropIndex(["partner_agency_id"], "idx_audit_events__partner_agency_id");
      table.dropColumn("partner_agency_id");
    });
  }

  const hasVoucherPartnerColumn = await knex.schema.hasColumn("vouchers", "partner_agency_id");
  if (hasVoucherPartnerColumn) {
    await knex.schema.alterTable("vouchers", (table) => {
      table.dropIndex(["partner_agency_id"], "idx_vouchers__partner_agency_id");
      table.dropColumn("partner_agency_id");
    });
  }

  const hasPartnerTokens = await knex.schema.hasTable("partner_tokens");
  if (hasPartnerTokens) {
    await knex.schema.dropTable("partner_tokens");
  }

  const hasPartnerAgencies = await knex.schema.hasTable("partner_agencies");
  if (hasPartnerAgencies) {
    await knex.schema.dropTable("partner_agencies");
  }
}
