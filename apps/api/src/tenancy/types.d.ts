import "fastify";
import type { TenantContext } from "./context.js";

declare module "fastify" {
  interface FastifyRequest {
    tenantContext?: TenantContext;
  }
}
