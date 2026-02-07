import type { FastifyReply, FastifyRequest } from "fastify";
import { getDb } from "./client.js";

export async function dbRequestHook(request: FastifyRequest) {
  request.db = await getDb().transaction();
  request.dbFinalized = false;
}

export async function dbResponseHook(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  if (!request.db || request.dbFinalized) {
    return;
  }

  request.dbFinalized = true;
  try {
    await request.db.commit();
  } catch (err) {
    request.log.error({ err }, "db_commit_failed");
  }
}

export async function dbErrorHook(
  request: FastifyRequest,
  _reply: FastifyReply,
  _error: Error,
) {
  if (!request.db || request.dbFinalized) {
    return;
  }

  request.dbFinalized = true;
  try {
    await request.db.rollback();
  } catch (err) {
    request.log.error({ err }, "db_rollback_failed");
  }
}
