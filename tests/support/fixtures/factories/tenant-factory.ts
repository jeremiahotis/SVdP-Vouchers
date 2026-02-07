import { faker } from "@faker-js/faker";

export type TenantRecord = {
  tenant_id: string;
  host: string;
  tenant_slug: string;
  status: "active" | "disabled";
};

export type TenantAppRecord = {
  tenant_id: string;
  app_key: string;
  enabled: boolean;
};

export type MembershipRecord = {
  id: string;
  tenant_id: string;
  actor_id: string;
  role: string;
};

export const createTenant = (overrides: Partial<TenantRecord> = {}): TenantRecord => {
  return {
    tenant_id: faker.string.uuid(),
    host: `${faker.internet.domainWord()}.voucher.shyft.org`,
    tenant_slug: faker.internet.domainWord(),
    status: "active",
    ...overrides,
  };
};

export const createTenantApp = (overrides: Partial<TenantAppRecord> = {}): TenantAppRecord => {
  return {
    tenant_id: faker.string.uuid(),
    app_key: "voucher_shyft",
    enabled: true,
    ...overrides,
  };
};

export const createMembership = (overrides: Partial<MembershipRecord> = {}): MembershipRecord => {
  return {
    id: faker.string.uuid(),
    tenant_id: faker.string.uuid(),
    actor_id: faker.string.uuid(),
    role: "steward",
    ...overrides,
  };
};
