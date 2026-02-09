import assert from "node:assert/strict";
import knex from "knex";
import config from "../../apps/api/db/knexfile";

async function run() {
  const db = knex(config);
  try {
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });

    const hasPartnerAgencies = await db.schema.hasTable("partner_agencies");
    assert.equal(hasPartnerAgencies, true, "partner_agencies table should exist");

    const hasPartnerTokens = await db.schema.hasTable("partner_tokens");
    assert.equal(hasPartnerTokens, true, "partner_tokens table should exist");

    const partnerAgencyColumns = await Promise.all([
      db.schema.hasColumn("partner_agencies", "tenant_id"),
      db.schema.hasColumn("partner_agencies", "name"),
      db.schema.hasColumn("partner_agencies", "status"),
      db.schema.hasColumn("partner_agencies", "created_at"),
      db.schema.hasColumn("partner_agencies", "updated_at"),
    ]);
    assert.ok(
      partnerAgencyColumns.every(Boolean),
      "partner_agencies should include tenant_id, name, status, created_at, updated_at",
    );

    const partnerTokenColumns = await Promise.all([
      db.schema.hasColumn("partner_tokens", "tenant_id"),
      db.schema.hasColumn("partner_tokens", "partner_agency_id"),
      db.schema.hasColumn("partner_tokens", "token_hash"),
      db.schema.hasColumn("partner_tokens", "status"),
      db.schema.hasColumn("partner_tokens", "form_config"),
      db.schema.hasColumn("partner_tokens", "created_at"),
      db.schema.hasColumn("partner_tokens", "updated_at"),
      db.schema.hasColumn("partner_tokens", "last_used_at"),
    ]);
    assert.ok(
      partnerTokenColumns.every(Boolean),
      "partner_tokens should include tenant_id, partner_agency_id, token_hash, status, form_config, created_at, updated_at, last_used_at",
    );

    const hasVoucherPartnerColumn = await db.schema.hasColumn("vouchers", "partner_agency_id");
    assert.equal(hasVoucherPartnerColumn, true, "vouchers.partner_agency_id should exist");

    const hasAuditPartnerColumn = await db.schema.hasColumn("audit_events", "partner_agency_id");
    assert.equal(hasAuditPartnerColumn, true, "audit_events.partner_agency_id should exist");
  } finally {
    await db.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
