import "fastify";
import type { Knex } from "knex";

declare module "fastify" {
  interface FastifyRequest {
    db?: Knex.Transaction;
    dbFinalized?: boolean;
  }
}
