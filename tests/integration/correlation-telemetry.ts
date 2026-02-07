import assert from "node:assert/strict";
import { Readable } from "node:stream";
import Fastify from "fastify";
import { registerRoutes } from "../../apps/api/src/routes";
import { refusal } from "../../apps/api/src/tenancy/refusal";
import { registerCorrelation } from "../../apps/api/src/observability/correlation";

type LogEntry = {
  outcome?: string;
  reason?: string;
  error_code?: string;
  correlation_id?: string;
  tenant_id?: string | null;
  actor_id?: string | null;
  request_id?: string;
};

function captureStdout() {
  const entries: LogEntry[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);

  process.stdout.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    const text = chunk.toString();
    for (const line of text.split("\n")) {
      if (!line.trim()) {
        continue;
      }
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        entries.push({
          outcome: parsed.outcome as string | undefined,
          reason: parsed.reason as string | undefined,
          error_code: parsed.error_code as string | undefined,
          correlation_id: parsed.correlation_id as string | undefined,
          tenant_id: (parsed as { tenant_id?: string | null }).tenant_id,
          actor_id: (parsed as { actor_id?: string | null }).actor_id,
          request_id: (parsed as { request_id?: string }).request_id,
        });
      } catch {
        // Ignore non-JSON log output.
      }
    }
    return originalWrite(chunk as any, ...(args as any));
  }) as typeof process.stdout.write;

  return {
    entries,
    restore() {
      process.stdout.write = originalWrite;
    },
  };
}

async function buildApp() {
  const app = Fastify({ logger: { level: "info" } });
  registerCorrelation(app);
  registerRoutes(app);

  app.get("/__test/refusal", async (request) => {
    return refusal("TENANT_NOT_FOUND", request.id);
  });

  app.get("/__test/error", async () => {
    throw new Error("boom");
  });

  app.get("/__test/array", async () => {
    return [1, 2, 3];
  });

  app.get("/__test/empty", async (_request, reply) => {
    reply.code(204).send();
  });

  app.get("/__test/stream", async (_request, reply) => {
    reply.send(Readable.from(["ok"]));
  });

  return app;
}

async function run() {
  const capture = captureStdout();
  const app = await buildApp();

  const success = await app.inject({ method: "GET", url: "/health" });
  assert.equal(success.statusCode, 200);
  const successBody = JSON.parse(success.body);
  assert.ok(successBody.correlation_id, "success responses must include correlation_id");
  assert.ok(success.headers["x-correlation-id"], "success responses must include x-correlation-id header");

  const refusalResponse = await app.inject({ method: "GET", url: "/__test/refusal" });
  assert.equal(refusalResponse.statusCode, 200);
  const refusalBody = JSON.parse(refusalResponse.body);
  assert.ok(refusalBody.correlation_id, "refusal responses must include correlation_id");
  assert.equal(refusalBody.reason, "TENANT_NOT_FOUND");
  assert.ok(refusalResponse.headers["x-correlation-id"], "refusal responses must include x-correlation-id header");

  const errorResponse = await app.inject({ method: "GET", url: "/__test/error" });
  assert.equal(errorResponse.statusCode, 500);
  const errorBody = JSON.parse(errorResponse.body);
  assert.ok(errorBody.correlation_id, "error responses must include correlation_id");
  assert.ok(errorResponse.headers["x-correlation-id"], "error responses must include x-correlation-id header");

  const arrayResponse = await app.inject({ method: "GET", url: "/__test/array" });
  assert.equal(arrayResponse.statusCode, 200);
  assert.ok(arrayResponse.headers["x-correlation-id"], "array responses must include x-correlation-id header");

  const emptyResponse = await app.inject({ method: "GET", url: "/__test/empty" });
  assert.equal(emptyResponse.statusCode, 204);
  assert.ok(emptyResponse.headers["x-correlation-id"], "empty responses must include x-correlation-id header");

  const streamResponse = await app.inject({ method: "GET", url: "/__test/stream" });
  assert.equal(streamResponse.statusCode, 200);
  assert.ok(streamResponse.headers["x-correlation-id"], "stream responses must include x-correlation-id header");

  const refusalLogged = capture.entries.some(
    (entry) =>
      entry.outcome === "refusal" &&
      entry.reason === "TENANT_NOT_FOUND" &&
      Boolean(entry.correlation_id) &&
      entry.tenant_id === null &&
      entry.actor_id === null &&
      Boolean(entry.request_id),
  );
  assert.ok(refusalLogged, "refusal logs must include outcome=refusal, reason, and context fields");

  const errorLogged = capture.entries.some(
    (entry) =>
      entry.outcome === "error" &&
      Boolean(entry.error_code) &&
      Boolean(entry.correlation_id) &&
      entry.tenant_id === null &&
      entry.actor_id === null &&
      Boolean(entry.request_id),
  );
  assert.ok(errorLogged, "error logs must include outcome=error, error_code, and context fields");

  await app.close();
  capture.restore();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
