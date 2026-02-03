import Fastify from "fastify";
import { registerOpenApi } from "./openapi";
import { registerRoutes } from "./routes";
import { authHook } from "./auth/hook";
import { tenantContextHook } from "./tenancy/hook";

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
