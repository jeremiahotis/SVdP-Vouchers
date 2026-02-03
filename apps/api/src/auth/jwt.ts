import { jwtVerify, createRemoteJWKSet } from "jose";
import { z } from "zod";
import { normalizeRoles } from "./roles";

const JWKS = createRemoteJWKSet(new URL(process.env.JWT_JWKS_URL ?? ""));

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

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  });

  const parsed = claimsSchema.parse(payload);

  return {
    ...parsed,
    roles: normalizeRoles(parsed.roles),
  };
}
