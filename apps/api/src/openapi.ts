import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";

export async function registerOpenApi(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "VoucherShyft API",
        version: "v1",
      },
    },
  });
}
