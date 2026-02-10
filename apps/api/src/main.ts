import { randomUUID } from "crypto";
import Fastify from "fastify";
import { registerOpenApi } from "./openapi.js";
import { registerRoutes } from "./routes.js";
import { authHook } from "./auth/hook.js";
import { tenantContextHook } from "./tenancy/hook.js";
import { dbErrorHook, dbRequestHook, dbResponseHook } from "./db/hooks.js";
import { registerCorrelation } from "./observability/correlation.js";

const app = Fastify({ logger: true, genReqId: () => randomUUID() });

await registerOpenApi(app);
registerCorrelation(app);
app.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
    correlation_id: String(request.id),
  });
});
app.addHook("onRequest", dbRequestHook);
app.addHook("onRequest", authHook);
app.addHook("onRequest", tenantContextHook);
app.addHook("onError", dbErrorHook);
app.addHook("onResponse", dbResponseHook);
registerRoutes(app);

const port = Number(process.env.PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
