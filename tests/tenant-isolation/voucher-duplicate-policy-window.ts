import assert from "node:assert/strict";
import knex, { type Knex } from "knex";
import { faker } from "@faker-js/faker";
import Fastify from "fastify";
import config from "../../apps/api/db/knexfile";
import { APP_KEY } from "../../apps/api/src/config/app";
import { closeDb } from "../../apps/api/src/db/client";
import { dbErrorHook, dbRequestHook, dbResponseHook } from "../../apps/api/src/db/hooks";
import { registerCorrelation } from "../../apps/api/src/observability/correlation";
import { registerRoutes } from "../../apps/api/src/routes";
import { tenantContextHook } from "../../apps/api/src/tenancy/hook";

type ActorAppParams = {
  actorId: string;
  tenantId: string;
  roles: string[];
};

type VoucherIssueBody = {
  voucher_type: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  household_adults: number;
  household_children: number;
};

type Envelope = {
  success: boolean;
  reason?: string;
  correlation_id?: string;
  data?: { voucher_id?: string };
};

function buildActorApp(params: ActorAppParams) {
  const app = Fastify({ logger: false });
  registerCorrelation(app);
  app.addHook("onRequest", dbRequestHook);
  app.addHook("onRequest", (request, _reply, done) => {
    request.authContext = {
      actorId: params.actorId,
      tenantId: params.tenantId,
      roles: params.roles,
    };
    done();
  });
  app.addHook("onRequest", tenantContextHook);
  app.addHook("onError", dbErrorHook);
  app.addHook("onResponse", dbResponseHook);
  registerRoutes(app);
  return app;
}

function parseJson<T>(body: string): T {
  return JSON.parse(body) as T;
}

function createIssuePayload(overrides: Partial<VoucherIssueBody> = {}): VoucherIssueBody {
  return {
    voucher_type: "clothing",
    first_name: "Alex",
    last_name: "Neighbor",
    date_of_birth: "1988-01-05",
    household_adults: 1,
    household_children: 2,
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

  const tenantA = faker.string.uuid();
  const hostA = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const tenantB = faker.string.uuid();
  const hostB = `${faker.internet.domainWord()}.voucher.shyft.org`;
  const actorA = faker.string.uuid();

  const cleanup: Array<() => Promise<void>> = [];

  try {
    await db.migrate.latest({ directory: "apps/api/db/migrations", loadExtensions: [".ts"] });

    await seedTenant(db, tenantA, hostA);
    await seedTenant(db, tenantB, hostB);
    cleanup.push(async () => {
      await db("platform.tenant_apps").whereIn("tenant_id", [tenantA, tenantB]).del();
      await db("platform.tenants").whereIn("tenant_id", [tenantA, tenantB]).del();
    });

    await db("memberships").insert({
      id: faker.string.uuid(),
      tenant_id: tenantA,
      actor_id: actorA,
      role: "steward",
    });
    cleanup.push(async () => {
      await db("memberships").where({ tenant_id: tenantA, actor_id: actorA }).del();
    });

    await seedDuplicateCandidate({
      db,
      tenantId: tenantB,
      voucherType: "clothing",
      firstName: "Alex",
      lastName: "Neighbor",
      dateOfBirth: "1988-01-05",
      createdAt: new Date(),
    });

    const app = buildActorApp({
      actorId: actorA,
      tenantId: tenantA,
      roles: ["steward"],
    });
    await app.ready();

    // [P0] Duplicate detection must stay tenant-scoped.
    const response = await app.inject({
      method: "POST",
      url: "/v1/vouchers",
      headers: { host: hostA },
      payload: createIssuePayload({
        first_name: "Alex",
        last_name: "Neighbor",
        date_of_birth: "1988-01-05",
      }),
    });
    assert.equal(response.statusCode, 200);

    const body = parseJson<Envelope>(response.body);
    assert.equal(body.success, true, "cross-tenant duplicate should not produce refusal in tenant A");
    assert.equal(typeof body.data?.voucher_id, "string");
    assert.equal(body.reason, undefined);

    const issuedInTenantA = await db("vouchers")
      .select("id", "tenant_id")
      .where({ id: body.data?.voucher_id, tenant_id: tenantA })
      .first();
    assert.ok(issuedInTenantA, "issuance should persist only in tenant A scope");

    const duplicateSeedStillInTenantB = await db("vouchers")
      .count<{ count: string }>("id as count")
      .where({ tenant_id: tenantB, voucher_type: "clothing" })
      .first();
    assert.ok(Number(duplicateSeedStillInTenantB?.count ?? "0") >= 1);

    await app.close();
    await cleanup.reduceRight(
      (promise, fn) => promise.then(() => fn()),
      Promise.resolve(),
    );
  } finally {
    await closeDb();
    await db.destroy();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
