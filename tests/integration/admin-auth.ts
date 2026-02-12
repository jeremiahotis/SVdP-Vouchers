import assert from "node:assert/strict";
import { normalizeRoles } from "../../apps/api/src/auth/roles";

const roles = normalizeRoles([" PLATFORM_ADMIN ", "unknown", "platform_admin"]);

assert.equal(roles.length, 1);
assert.equal(roles[0], "platform_admin");
