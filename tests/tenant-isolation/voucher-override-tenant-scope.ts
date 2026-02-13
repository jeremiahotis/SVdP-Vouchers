import assert from "node:assert/strict";
import knex from "knex";
import { faker } from "@faker-js/faker";
import config from "../../apps/api/db/knexfile";
import { closeDb } from "../../apps/api/src/db/client";
import { REFUSAL_REASONS } from "../../packages/contracts/src/constants/refusal-reasons";
import { createVoucherOverrideRequestBody } from "../support/fixtures/factories/voucher-override-factory";
import {
  buildActorApp,
  parseJson,
  seedDuplicateCandidate,
  seedTenant,
} from "../support/helpers/voucher-integration-harness";

type Envelope = {
  success: boolean;
  reason?: string;
  correlation_id?: string;
  data?: {
    voucher_id?: string;
  };
};

async function run() {
  const db = knex(config);
  const originalPolicyAction = process.env.VOUCHER_DUPLICATE_POLICY_ACTION;

  const tenantA = faker.string.uuid();
  const hostA = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const tenantB = faker.string.uuid();
  const hostB = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const actorA = faker.string.uuid();

  try {
    process.env.VOUCHER_DUPLICATE_POLICY_ACTION = "warning";
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });

    await seedTenant(db, tenantA, hostA);
    await seedTenant(db, tenantB, hostB);

    await db("memberships").insert({
      id: faker.string.uuid(),
      tenant_id: tenantA,
      actor_id: actorA,
      role: "store_admin",
    });

    await seedDuplicateCandidate({
      db,
      tenantId: tenantA,
      voucherType: "clothing",
      firstName: "Taylor",
      lastName: "Override",
      dateOfBirth: "1989-02-14",
      createdAt: new Date(),
    });

    const tenantBDuplicateVoucherId = await seedDuplicateCandidate({
      db,
      tenantId: tenantB,
      voucherType: "clothing",
      firstName: "Taylor",
      lastName: "Override",
      dateOfBirth: "1989-02-14",
      createdAt: new Date(),
    });

    const app = buildActorApp({
      actorId: actorA,
      tenantId: tenantA,
      roles: ["store_admin"],
    });
    await app.ready();

    // [P0] Override reference must remain tenant-scoped and not accept cross-tenant voucher references.
    const response = await app.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host: hostA },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: tenantBDuplicateVoucherId,
      }),
    });

    assert.equal(response.statusCode, 200);
    const body = parseJson<Envelope>(response.body);
    assert.equal(body.success, false);
    assert.equal(body.reason, REFUSAL_REASONS.notAuthorizedForAction);
    assert.equal(typeof body.correlation_id, "string");
    assert.equal(body.data?.voucher_id, undefined);

    await app.close();
  } finally {
    if (typeof originalPolicyAction === "undefined") {
      delete process.env.VOUCHER_DUPLICATE_POLICY_ACTION;
    } else {
      process.env.VOUCHER_DUPLICATE_POLICY_ACTION = originalPolicyAction;
    }
    await closeDb();
    await db.destroy();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
