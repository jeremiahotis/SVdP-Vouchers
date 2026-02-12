# Story 2.1: Issue Voucher (Allowed Types + Identity Minimums)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a steward or partner agent,  
I want to issue vouchers within allowed types using minimum required identity fields,  
so that eligible requests become valid vouchers with immutable authorization snapshots.

## Acceptance Criteria

1. **Given** a steward with issuance permission in a tenant,  
   **When** they submit issuance for an allowed voucher type with minimum required identity fields,  
   **Then** the system issues a voucher and records an immutable authorization snapshot.
2. **And** initiate-only roles create a request record without issuing an active voucher, and the response indicates pending status.
3. **And** partner-token issuance succeeds for allowed types with `partner_agency_id` attribution and no user JWT required.
4. **And** disallowed voucher types are refused at the server boundary using FR0 refusal envelope semantics.
5. **And** tenant/partner scope is derived from request context (host/JWT or partner token), not from body/query overrides.

## Tasks / Subtasks

- [x] Implement issuance contract and validation
  - [x] Define/extend shared request and response schemas in `packages/contracts` (snake_case fields only).
  - [x] Validate minimum identity payload (`first_name`, `last_name`, `date_of_birth`, household counts as required by policy).
  - [x] Enforce allowed voucher type list from tenant/partner configuration at API boundary.
- [x] Implement issuance domain flow
  - [x] Add issuance service under `apps/api/src/vouchers/` (or equivalent existing voucher domain path).
  - [x] Support two outcomes: active issued voucher vs initiate-only pending request.
  - [x] Persist immutable authorization snapshot on issuance (no post-issuance mutation).
- [x] Integrate role and partner-token paths
  - [x] Enforce role gates for steward/admin issuance permissions.
  - [x] Reuse partner-token context from Story 1.6; persist `partner_agency_id` attribution when partner token is used.
  - [x] Keep refusal/error split and `correlation_id` behavior consistent with Epic 1.
- [x] Add tests
  - [x] Integration test: steward issuance success for allowed type.
  - [x] Integration test: disallowed type refusal envelope.
  - [x] Integration test: initiate-only role produces pending record (no active voucher issuance).
  - [x] Integration test: partner-token issuance success + `partner_agency_id` attribution.
  - [x] Tenant-isolation test: body/query tenant override attempts are refused.

## Dev Notes

### Story Foundation

- Epic 2 objective is issuance governance: allowed-type enforcement, duplicate policy, override controls, and voidability.
- This story establishes the core issuance write path consumed by Stories 2.2 and 2.3.
- Partner-token issuance path from Story 1.6 and partner form customization from Story 4.4 are already implemented; reuse those foundations.

### Developer Context Section

- Tenant context is authoritative from host/JWT match or partner token resolution; never accept tenant context from request body/query.
- Keep FR0 refusal envelope for business denials: `HTTP 200` with `{ success:false, reason, correlation_id }`.
- Errors remain non-200 (or structured error envelope) and must remain distinct from refusal telemetry.
- Minimum identity in UX flow is person-first and low-friction; do not expand with unbounded free-text fields.
- Coats must remain cashier-station-only and must not be introduced into issuance request payloads.

### Technical Requirements

- Maintain API payload casing as `snake_case`.
- Persist authorization snapshot as immutable issuance-time data; later status changes must not mutate historical authorization details.
- Ensure partner issuance writes include `partner_agency_id` for audit and lookup scoping.
- Use shared contracts from `packages/contracts` across API handlers and integration tests.

### Architecture Compliance

- Respect module boundaries:
  - Tenant/auth context in `apps/api/src/tenancy/` and `apps/api/src/auth/`
  - Issuance logic in `apps/api/src/vouchers/`
  - Audit logging in `apps/api/src/audit/`
- Repos/domain services remain tenant-scoped; no root-table, cross-tenant queries.
- Keep one-tenant-per-request invariant from Epic 1.

### Library / Framework Requirements

- Fastify v5 route schemas must be full JSON-schema objects.
- Runtime baseline is Node.js 20+.
- Validation remains schema-first at API boundary plus DB constraints for invariants.

### File Structure Requirements

- API: `apps/api/src/vouchers/` (issue path and supporting domain/repo files).
- Contracts: `packages/contracts/src/`.
- Integration tests: `tests/integration/`.
- Tenant isolation tests: `tests/tenant-isolation/` when scope/tenancy behavior is involved.

### Testing Requirements

- Mandatory compose-backed verification before handoff:
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin`
  - Add issuance tests to existing suite wiring so they execute in CI compose matrix.
- Add regression coverage for:
  - Allowed type enforcement
  - Initiate-only behavior
  - Partner-token issuance attribution
  - Refusal/error telemetry shape

### Previous Story Intelligence

- Story 1.6 delivered partner-token auth, scope gates, and per-token rate limiting; do not re-implement auth primitives.
- Story 4.4 delivered partner form-config allowed type enforcement for partner issuance requests; reuse shared validators where possible.
- Story 1.3 already introduced outcome logging split (`success/refusal/error`) and `correlation_id` expectations.

### Git Intelligence Summary

- Recent branch history includes partner issuance and partner form route hardening.
- CI compose workflow now runs parallel suite jobs; ensure new tests are deterministic on fresh DB containers (self-seeding migrations where needed).

### Project Context Reference

- `_bmad-output/project-context.md` is authoritative:
  - sanitize/escape patterns
  - refusal semantics
  - no coat issuance in request flow
  - mandatory compose-backed testing

### Project Structure Notes

- Keep story scope to issuance creation path only.
- Duplicate window checks and override authorization depth are expanded in Stories 2.2 and 2.3.
- Do not introduce redemption behavior in this story.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.1)
- `_bmad-output/planning-artifacts/voucher-shyft-prd.md` (FR16, FR17, FR0, FR31)
- `_bmad-output/planning-artifacts/voucher-shyft-architecture.md` (tenant context, module boundaries, refusal patterns)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (full issuance flow, minimum identity, refusal behavior)
- `_bmad-output/implementation-artifacts/1-6-partner-token-access-embedded-issuance-lookup.md`
- `_bmad-output/implementation-artifacts/4-4-partner-form-customization.md`
- `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

- `infra/scripts/compose.sh run --rm --build api-test pnpm tsx tests/integration/voucher-issuance.ts`
- `infra/scripts/compose.sh run --rm --build api-test pnpm tsx tests/integration/partner-form-config.ts`
- `infra/scripts/compose.sh run --rm --build api-test pnpm test:admin`
- `infra/scripts/compose.sh run --rm --build api-test pnpm test:db`
- `infra/scripts/compose.sh run --rm --build api-test pnpm -C apps/api build`

### Completion Notes List

- Added shared voucher issuance contract schema + payload normalization/validation for required identity minimums.
- Added issuance governance migration for `voucher_type`, tenant allowed type config, immutable `voucher_authorizations`, and `voucher_requests`.
- Implemented issuance domain service with tenant allowed-type resolution, role-based issue vs initiate-only behavior, and immutable snapshot persistence.
- Updated `/v1/vouchers` to support steward/admin and partner-token flows with refusal-envelope policy denials and tenant-context override refusal behavior.
- Added HTTP-level integration coverage for AC1/AC4 boundary behavior, including partner attribution and pending request outcomes.
- Wired new issuance integration test into `test:admin` so compose CI executes it.
- Moved issuance response JSON schemas into shared `packages/contracts` and consumed those schemas from Fastify route registration.
- Added strict context-override detection for tenant/partner keys even when empty-string values are submitted.
- Added DB-level immutability enforcement for `voucher_authorizations` with trigger-backed migration.
- Added regression coverage for body context override refusal and immutable authorization snapshot mutation attempts.

### File List

- `_bmad-output/implementation-artifacts/2-1-issue-voucher-allowed-types-identity-minimums.md`
- `apps/api/db/migrations/009_voucher_issuance_governance.ts`
- `apps/api/db/migrations/010_voucher_authorizations_immutable.ts`
- `apps/api/src/partner/issuance.ts`
- `apps/api/src/partner/routes.ts`
- `apps/api/src/vouchers/issuance.ts`
- `package.json`
- `packages/contracts/src/constants/voucher-issuance.ts`
- `packages/contracts/src/index.ts`
- `tests/integration/partner-form-config.ts`
- `tests/integration/voucher-issuance.ts`

### Change Log

- 2026-02-11: Implemented Story 2.1 issuance governance path, added HTTP boundary integration tests, and validated with full compose `test:db` suite.
- 2026-02-12: Fixed code-review findings by sharing response schemas in contracts, hardening context-override refusal checks, enforcing DB immutability for authorization snapshots, and extending integration/tenant-isolation regression coverage. Re-validated with compose `test:db`.

## Senior Developer Review (AI)

- Date: 2026-02-12
- Reviewer: Jeremiah (AI-assisted)
- Outcome: All review findings addressed and verified.
- Fixes applied:
  - Shared issuance response schemas now live in `packages/contracts` and are consumed by `/v1/vouchers` route schema.
  - Context override refusal now triggers when override keys are present in query/body even if values are empty.
  - `voucher_authorizations` rows are enforced immutable at DB boundary via trigger migration.
  - Regression tests now cover body override refusal and failed mutation of authorization snapshots.
- Verification:
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:db` passed.
