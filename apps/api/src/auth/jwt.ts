import { jwtVerify, createRemoteJWKSet } from "jose";
import { z } from "zod";
import { normalizeRoles } from "./roles.js";

function getJwks() {
  const url = process.env.JWT_JWKS_URL;
  if (!url) {
    throw new Error("JWT JWKS URL not configured");
  }

  try {
    return createRemoteJWKSet(new URL(url));
  } catch {
    throw new Error("JWT JWKS URL is invalid");
  }
}

const claimsSchema = z.object({
  sub: z.string().min(1),
  tenant_id: z.string().min(1),
  roles: z.array(z.string()).nonempty(),
});

export type AuthClaims = z.infer<typeof claimsSchema> & { roles: string[] };

export async function verifyJwt(token: string) {
  if (!process.env.JWT_ISSUER || !process.env.JWT_AUDIENCE) {
    throw new Error("JWT issuer/audience not configured");
  }

  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  });

  const parsed = claimsSchema.parse(payload);

  return {
    ...parsed,
    roles: normalizeRoles(parsed.roles),
  };
}
