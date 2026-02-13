import assert from "node:assert/strict";
import knex from "knex";
import { faker } from "@faker-js/faker";
import config from "../../apps/api/db/knexfile";
import { PARTNER_TOKEN_HEADER, hashPartnerToken } from "../../apps/api/src/auth/partner-token";
import { closeDb } from "../../apps/api/src/db/client";
import { REFUSAL_REASONS } from "../../packages/contracts/src/constants/refusal-reasons";
import {
  createVoucherOverrideRequestBody,
} from "../support/fixtures/factories/voucher-override-factory";
import {
  buildActorApp,
  buildPartnerApp,
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
    status?: string;
    voucher_type?: string;
  };
};

async function run() {
  const db = knex(config);
  const originalPolicyAction = process.env.VOUCHER_DUPLICATE_POLICY_ACTION;

  const tenantId = faker.string.uuid();
  const host = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const authorizedActorId = faker.string.uuid();
  const unauthorizedActorId = faker.string.uuid();
  const partnerAgencyId = faker.string.uuid();
  const partnerTokenId = faker.string.uuid();
  const partnerToken = `partner-token-${faker.string.alphanumeric(24)}`;

  try {
    process.env.VOUCHER_DUPLICATE_POLICY_ACTION = "warning";
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });

    await seedTenant(db, tenantId, host);

    await db("memberships").insert([
      {
        id: faker.string.uuid(),
        tenant_id: tenantId,
        actor_id: authorizedActorId,
        role: "store_admin",
      },
      {
        id: faker.string.uuid(),
        tenant_id: tenantId,
        actor_id: unauthorizedActorId,
        role: "steward_initiate_only",
      },
    ]);

    await db("partner_agencies").insert({
      id: partnerAgencyId,
      tenant_id: tenantId,
      name: "Override Policy Partner",
      status: "active",
    });

    await db("partner_tokens").insert({
      id: partnerTokenId,
      tenant_id: tenantId,
      partner_agency_id: partnerAgencyId,
      token_hash: hashPartnerToken(partnerToken),
      status: "active",
      form_config: {
        allowed_voucher_types: ["clothing"],
        intro_text: "",
        rules_list: [],
      },
    });

    const duplicateVoucherId = await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Taylor",
      lastName: "Override",
      dateOfBirth: "1989-02-14",
      createdAt: new Date(),
    });

    const authorizedApp = buildActorApp({
      actorId: authorizedActorId,
      tenantId,
      roles: ["store_admin"],
    });
    await authorizedApp.ready();

    const unauthorizedApp = buildActorApp({
      actorId: unauthorizedActorId,
      tenantId,
      roles: ["steward_initiate_only"],
    });
    await unauthorizedApp.ready();

    const partnerApp = buildPartnerApp();
    await partnerApp.ready();

    // [P0] Authorized override path should issue voucher and persist audit reason (warning mode).
    const authorizedResponse = await authorizedApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: duplicateVoucherId,
      }),
    });

    assert.equal(authorizedResponse.statusCode, 200);
    const authorizedBody = parseJson<Envelope>(authorizedResponse.body);
    assert.equal(authorizedBody.success, true);
    assert.equal(typeof authorizedBody.data?.voucher_id, "string");

    const overrideAudit = await db("audit_events")
      .select("event_type", "reason", "correlation_id")
      .where({
        tenant_id: tenantId,
        actor_id: authorizedActorId,
        event_type: "voucher.issuance.override",
      })
      .orderBy("created_at", "desc")
      .first();

    assert.ok(overrideAudit, "expected voucher.issuance.override audit event");
    assert.equal(overrideAudit.reason, "Approved exception with documented policy reason");
    assert.equal(typeof overrideAudit.correlation_id, "string");

    process.env.VOUCHER_DUPLICATE_POLICY_ACTION = "refusal";
    const refusalDuplicateVoucherId = await seedDuplicateCandidate({
      db,
      tenantId,
      voucherType: "clothing",
      firstName: "Jordan",
      lastName: "Refusal",
      dateOfBirth: "1991-03-20",
      createdAt: new Date(),
    });

    // [P0] Authorized override path should also issue voucher when duplicate outcome is refusal.
    const refusalOverrideResponse = await authorizedApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createVoucherOverrideRequestBody({
        first_name: "Jordan",
        last_name: "Refusal",
        date_of_birth: "1991-03-20",
        duplicate_reference_voucher_id: refusalDuplicateVoucherId,
      }),
    });

    assert.equal(refusalOverrideResponse.statusCode, 200);
    const refusalOverrideBody = parseJson<Envelope>(refusalOverrideResponse.body);
    assert.equal(refusalOverrideBody.success, true);
    assert.equal(typeof refusalOverrideBody.data?.voucher_id, "string");

    const refusalOverrideAudit = await db("audit_events")
      .select("event_type", "reason", "correlation_id", "metadata")
      .where({
        tenant_id: tenantId,
        actor_id: authorizedActorId,
        event_type: "voucher.issuance.override",
      })
      .whereRaw("metadata->>'duplicate_reference_voucher_id' = ?", [refusalDuplicateVoucherId])
      .first();

    assert.ok(refusalOverrideAudit, "expected voucher.issuance.override audit event for refusal mode");
    assert.equal(refusalOverrideAudit.reason, "Approved exception with documented policy reason");
    assert.equal(refusalOverrideAudit.metadata?.duplicate_outcome, "refusal");
    assert.equal(typeof refusalOverrideAudit.correlation_id, "string");

    process.env.VOUCHER_DUPLICATE_POLICY_ACTION = "warning";

    // [P1] Missing override reason should be refused with FR0 envelope semantics.
    const missingReasonResponse = await authorizedApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: duplicateVoucherId,
        override_reason: "   ",
      }),
    });

    assert.equal(missingReasonResponse.statusCode, 200);
    const missingReasonBody = parseJson<Envelope>(missingReasonResponse.body);
    assert.equal(missingReasonBody.success, false);
    assert.equal(missingReasonBody.reason, REFUSAL_REASONS.notAuthorizedForAction);
    assert.equal(typeof missingReasonBody.correlation_id, "string");

    // [P1] Unauthorized JWT role should be refused.
    const unauthorizedResponse = await unauthorizedApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: duplicateVoucherId,
      }),
    });

    assert.equal(unauthorizedResponse.statusCode, 200);
    const unauthorizedBody = parseJson<Envelope>(unauthorizedResponse.body);
    assert.equal(unauthorizedBody.success, false);
    assert.equal(unauthorizedBody.reason, REFUSAL_REASONS.notAuthorizedForAction);
    assert.equal(typeof unauthorizedBody.correlation_id, "string");

    // [P1] Partner-token override should be refused.
    const partnerOverrideResponse = await partnerApp.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: {
        host,
        [PARTNER_TOKEN_HEADER]: partnerToken,
      },
      payload: createVoucherOverrideRequestBody({
        first_name: "Taylor",
        last_name: "Override",
        date_of_birth: "1989-02-14",
        duplicate_reference_voucher_id: duplicateVoucherId,
      }),
    });

    assert.equal(partnerOverrideResponse.statusCode, 200);
    const partnerOverrideBody = parseJson<Envelope>(partnerOverrideResponse.body);
    assert.equal(partnerOverrideBody.success, false);
    assert.equal(partnerOverrideBody.reason, REFUSAL_REASONS.notAuthorizedForAction);
    assert.equal(typeof partnerOverrideBody.correlation_id, "string");

    await partnerApp.close();
    await unauthorizedApp.close();
    await authorizedApp.close();
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
