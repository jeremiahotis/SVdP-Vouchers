import assert from "node:assert/strict";
import { requirePlatformAdmin } from "../../apps/api/src/admin/guards";

const makeRequest = (roles: string[] | null, ip = "127.0.0.1") =>
  ({
    authContext: roles ? { actorId: "actor", tenantId: "tenant", roles } : undefined,
    ip,
    id: "corr",
  }) as any;

const reply = {
  statusCode: 200,
  payload: null as any,
  code(status: number) {
    this.statusCode = status;
    return this;
  },
  send(payload: any) {
    this.payload = payload;
  },
};

// Unauthenticated
assert.equal(requirePlatformAdmin(makeRequest(null), reply as any), false);
assert.equal(reply.statusCode, 401);

// Forbidden
reply.statusCode = 200;
reply.payload = null;
assert.equal(requirePlatformAdmin(makeRequest(["steward"]), reply as any), false);
assert.equal(reply.statusCode, 403);

// Allowed
reply.statusCode = 200;
reply.payload = null;
assert.equal(requirePlatformAdmin(makeRequest(["platform_admin"]), reply as any), true);
