import assert from "node:assert/strict";
import { requirePlatformAdmin } from "../../apps/api/src/admin/guards";

process.env.ADMIN_IP_ALLOWLIST = "10.0.0.1";

const makeRequest = (ip: string) =>
  ({
    authContext: { actorId: "actor", tenantId: "tenant", roles: ["platform_admin"] },
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

assert.equal(requirePlatformAdmin(makeRequest("10.0.0.1"), reply as any), true);
reply.statusCode = 200;
assert.equal(requirePlatformAdmin(makeRequest("10.0.0.2"), reply as any), false);
assert.equal(reply.statusCode, 403);
