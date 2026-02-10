import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Fastify from "fastify";
import { registerOpenApi } from "../../apps/api/src/openapi";
import { registerRoutes } from "../../apps/api/src/routes";

const specPath = resolve(process.cwd(), "apps/api/openapi.admin.json");
const spec = JSON.parse(readFileSync(specPath, "utf-8")) as {
  paths?: Record<string, unknown>;
};

function splitSpec(targetTag: string, fullSpec: { paths?: Record<string, unknown> }) {
  const paths: Record<string, unknown> = {};

  for (const [path, ops] of Object.entries(fullSpec.paths ?? {})) {
    const opRecord = ops as Record<string, { tags?: string[] }>;
    const hasTag = Object.values(opRecord).some((op) => op?.tags?.includes(targetTag));
    if (hasTag) {
      paths[path] = ops;
    }
  }

  return {
    ...fullSpec,
    info: {
      ...(fullSpec as { info?: Record<string, unknown> }).info,
      description:
        targetTag === "admin"
          ? "Internal. No compatibility guarantees."
          : (fullSpec as { info?: { description?: string } }).info?.description,
    },
    paths,
  };
}

async function loadGeneratedAdminSpec() {
  const app = Fastify({ logger: false });
  await registerOpenApi(app);
  registerRoutes(app);
  await app.ready();
  const generated = app.swagger() as { paths?: Record<string, unknown> };
  await app.close();
  return splitSpec("admin", generated);
}

const paths = Object.keys(spec.paths ?? {});

assert.ok(paths.includes("/admin/tenants"));
assert.ok(paths.includes("/admin/tenants/{tenant_id}"));
assert.ok(paths.includes("/admin/tenant-apps"));

type OpenApiOperation = {
  responses?: Record<string, unknown>;
};

function assertAdminResponses(operation: OpenApiOperation | undefined) {
  assert.ok(operation);
  assert.ok(operation?.responses?.["200"]);
  assert.ok(operation?.responses?.["401"]);
  assert.ok(operation?.responses?.["403"]);
}

const tenantsPath = (spec.paths?.["/admin/tenants"] ?? {}) as Record<string, OpenApiOperation>;
const tenantByIdPath = (spec.paths?.["/admin/tenants/{tenant_id}"] ?? {}) as Record<
  string,
  OpenApiOperation
>;
const tenantAppsPath = (spec.paths?.["/admin/tenant-apps"] ?? {}) as Record<
  string,
  OpenApiOperation
>;

assertAdminResponses(tenantsPath.get);
assertAdminResponses(tenantsPath.post);
assertAdminResponses(tenantByIdPath.patch);
assertAdminResponses(tenantAppsPath.post);

async function run() {
  const generatedAdminSpec = await loadGeneratedAdminSpec();
  assert.deepStrictEqual(spec, generatedAdminSpec);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
