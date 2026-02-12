const ROLE_ALLOWLIST = ["platform_admin"] as const;

export type Role = (typeof ROLE_ALLOWLIST)[number];

export function normalizeRoles(roles: string[]): Role[] {
  const normalized = roles
    .map((role) => role.trim().toLowerCase())
    .filter((role): role is Role => ROLE_ALLOWLIST.includes(role as Role));

  return Array.from(new Set(normalized));
}

export function isRoleAllowed(role: string): role is Role {
  return ROLE_ALLOWLIST.includes(role as Role);
}
