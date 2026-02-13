import { faker } from "@faker-js/faker";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import type { Knex } from "knex";
import { authHook } from "../../../apps/api/src/auth/hook";
import { APP_KEY } from "../../../apps/api/src/config/app";
import { dbErrorHook, dbRequestHook, dbResponseHook } from "../../../apps/api/src/db/hooks";
import { registerCorrelation } from "../../../apps/api/src/observability/correlation";
import { registerRoutes } from "../../../apps/api/src/routes";
import { tenantContextHook } from "../../../apps/api/src/tenancy/hook";

export type ActorAppParams = {
  actorId: string;
  tenantId: string;
  roles: string[];
};

export function buildPartnerApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  registerCorrelation(app);
  app.addHook("onRequest", dbRequestHook);
  app.addHook("onRequest", authHook);
  app.addHook("onRequest", tenantContextHook);
  app.addHook("onError", dbErrorHook);
  app.addHook("onResponse", dbResponseHook);
  registerRoutes(app);
  return app;
}

export function buildActorApp(params: ActorAppParams): FastifyInstance {
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

export function parseJson<T>(body: string): T {
  return JSON.parse(body) as T;
}

export async function seedTenant(db: Knex, tenantId: string, host: string): Promise<void> {
  await db("platform.tenants")
    .insert({ tenant_id: tenantId, host, tenant_slug: host.split(".")[0], status: "active" })
    .onConflict("tenant_id")
    .merge({ host, status: "active", updated_at: db.fn.now() });

  await db("platform.tenant_apps")
    .insert({ tenant_id: tenantId, app_key: APP_KEY, enabled: true })
    .onConflict(["tenant_id", "app_key"])
    .merge({ enabled: true, updated_at: db.fn.now() });
}

export async function seedDuplicateCandidate(params: {
  db: Knex;
  tenantId: string;
  voucherType: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  createdAt: Date;
}): Promise<string> {
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

  return voucherId;
}
