import { faker } from "@faker-js/faker";

export type VoucherIssueBody = {
  voucher_type: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  household_adults: number;
  household_children: number;
};

export type VoucherOverrideRequestBody = VoucherIssueBody & {
  override_reason: string;
  duplicate_reference_voucher_id: string;
};

export function createVoucherIssueBody(overrides: Partial<VoucherIssueBody> = {}): VoucherIssueBody {
  return {
    voucher_type: "clothing",
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    date_of_birth: "1988-01-05",
    household_adults: 1,
    household_children: 1,
    ...overrides,
  };
}

export function createVoucherOverrideRequestBody(
  overrides: Partial<VoucherOverrideRequestBody> = {},
): VoucherOverrideRequestBody {
  return {
    ...createVoucherIssueBody(),
    override_reason: "Approved exception with documented policy reason",
    duplicate_reference_voucher_id: faker.string.uuid(),
    ...overrides,
  };
}
