import assert from "node:assert/strict";
import knex from "knex";
import config from "../../apps/api/db/knexfile";

async function run() {
  const db = knex(config);

  const tenantId = "tenant_idempo";
  const voucherId = "00000000-0000-0000-0000-000000000001";
  const receiptId = "receipt_1";

  await db("redemptions").where({ tenant_id: tenantId }).del();
  await db("import_runs").where({ tenant_id: tenantId }).del();

  await db("redemptions").insert({
    id: "00000000-0000-0000-0000-000000000010",
    tenant_id: tenantId,
    voucher_id: voucherId,
    receipt_id: receiptId,
  });

  let caught = false;
  try {
    await db("redemptions").insert({
      id: "00000000-0000-0000-0000-000000000011",
      tenant_id: tenantId,
      voucher_id: voucherId,
      receipt_id: receiptId,
    });
  } catch {
    caught = true;
  }

  assert.equal(caught, true, "expected unique constraint on redemptions");

  await db("import_runs").insert({
    id: "00000000-0000-0000-0000-000000000020",
    tenant_id: tenantId,
    source_system: "legacy_wp",
    source_voucher_id: "voucher_1",
  });

  let caughtImport = false;
  try {
    await db("import_runs").insert({
      id: "00000000-0000-0000-0000-000000000021",
      tenant_id: tenantId,
      source_system: "legacy_wp",
      source_voucher_id: "voucher_1",
    });
  } catch {
    caughtImport = true;
  }

  assert.equal(caughtImport, true, "expected unique constraint on import_runs");

  await db.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
