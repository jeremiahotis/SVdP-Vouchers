import assert from "node:assert/strict";
import knex, { type Knex } from "knex";
import { faker } from "@faker-js/faker";
import config from "../../apps/api/db/knexfile";
import { APP_KEY } from "../../apps/api/src/config/app";
import { closeDb } from "../../apps/api/src/db/client";
import { evaluateDuplicatePolicy } from "../../apps/api/src/vouchers/duplicate/policy";

type VoucherIssueBody = {
  voucher_type: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  household_adults: number;
  household_children: number;
};

function createIssuePayload(overrides: Partial<VoucherIssueBody> = {}): VoucherIssueBody {
  return {
    voucher_type: "clothing",
    first_name: "Boundary",
    last_name: "Case",
    date_of_birth: "1986-03-01",
    household_adults: 1,
    household_children: 0,
    ...overrides,
  };
}

async function seedTenant(db: Knex, tenantId: string, host: string) {
  await db("platform.tenants")
    .insert({ tenant_id: tenantId, host, tenant_slug: host.split(".")[0], status: "active" })
    .onConflict("tenant_id")
    .merge({ host, status: "active", updated_at: db.fn.now() });

  await db("platform.tenant_apps")
    .insert({ tenant_id: tenantId, app_key: APP_KEY, enabled: true })
    .onConflict(["tenant_id", "app_key"])
    .merge({ enabled: true, updated_at: db.fn.now() });
}

async function seedDuplicateCandidate(params: {
  db: Knex;
  tenantId: string;
  voucherType: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  createdAt: Date;
}) {
  const voucherId = faker.string.uuid();
  const authorizationId = faker.string.uuid();

  await params.db("vouchers").insert({
    id: voucherId,
    tenant_id: params.tenantId,
    status: "active",
    voucher_type: params.voucherType,
    created_at: params.createdAt,
    updated_at: params.createdAt,
  });

  await params.db("voucher_authorizations").insert({
    id: authorizationId,
    voucher_id: voucherId,
    tenant_id: params.tenantId,
    voucher_type: params.voucherType,
    first_name: params.firstName,
    last_name: params.lastName,
    date_of_birth: params.dateOfBirth,
    household_adults: 1,
    household_children: 0,
    issuer_mode: "auth",
    actor_id: faker.string.uuid(),
    created_at: params.createdAt,
  });
}

async function run() {
  const db = knex(config);
  const tenantId = faker.string.uuid();
  const host = `${faker.internet.domainWord()}.voucher.shyft.org`;

  try {
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });
    await seedTenant(db, tenantId, host);

    const anchorNow = new Date("2026-02-12T12:00:00.000Z");
    const exactWindowStart = new Date(anchorNow.getTime() - 90 * 24 * 60 * 60 * 1000);
    const justOutsideWindow = new Date(exactWindowStart.getTime() - 1);

    await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Boundary",
      lastName: "Case",
      dateOfBirth: "1986-03-01",
      createdAt: exactWindowStart,
    });

    const inclusiveBoundary = await evaluateDuplicatePolicy({
      db,
      tenantId,
      voucherType: "clothing",
      payload: createIssuePayload(),
      now: anchorNow,
      policyWindowDays: 90,
      policyAction: "refusal",
    });
    assert.equal(inclusiveBoundary.outcome, "refusal");

    await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Outside",
      lastName: "Case",
      dateOfBirth: "1982-07-14",
      createdAt: justOutsideWindow,
    });

    const outsideBoundary = await evaluateDuplicatePolicy({
      db,
      tenantId,
      voucherType: "clothing",
      payload: createIssuePayload({
        first_name: "Outside",
        last_name: "Case",
        date_of_birth: "1982-07-14",
      }),
      now: anchorNow,
      policyWindowDays: 90,
      policyAction: "refusal",
    });
    assert.equal(outsideBoundary.outcome, "no_match");
  } finally {
    await db("platform.tenant_apps").where({ tenant_id: tenantId }).del();
    await db("platform.tenants").where({ tenant_id: tenantId }).del();
    await closeDb();
    await db.destroy();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
