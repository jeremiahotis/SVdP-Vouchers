import Fastify from "fastify";
import { registerOpenApi } from "./openapi.js";
import { registerRoutes } from "./routes.js";
import { authHook } from "./auth/hook.js";
import { tenantContextHook } from "./tenancy/hook.js";

const app = Fastify({ logger: true });

await registerOpenApi(app);
app.addHook("onRequest", authHook);
app.addHook("onRequest", tenantContextHook);
registerRoutes(app);

const port = Number(process.env.PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
