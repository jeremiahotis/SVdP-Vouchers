# Story 1.6: Partner Token Access (Embedded Issuance + Lookup)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform operator,
I want partner tokens to establish tenant + partner context with scoped permissions,
So that partners can issue and lookup vouchers without user accounts and without cross-tenant access.

## Acceptance Criteria

1. **Given** a request to a tenant host with a valid, active, form-specific partner token,
   **When** the token is verified,
   **Then** the request context includes `tenant_id` and `partner_agency_id` and does not require a user JWT.
2. **And** partner-token requests are limited to issuance + lookup routes; other routes are refused.
3. **And** partner-token lookup only returns vouchers issued by that partner agency; other vouchers are refused or excluded.
4. **And** audit/log events for partner-token issuance/lookup include `partner_agency_id` attribution.
5. **And** partner-token requests exceeding **20 req/min** return **HTTP 429** with `Retry-After`.

## Tasks / Subtasks

- [x] Data model
  - [x] Create `partner_agencies` (tenant-scoped) table
  - [x] Create `partner_tokens` (tenant-scoped, form-specific) table with hashed token storage
  - [x] Add `partner_agency_id` to vouchers (nullable FK)
  - [x] Add `partner_agency_id` attribution to audit events for partner-token actions
- [x] Auth middleware
  - [x] Accept partner token on embedded form requests
  - [x] Resolve token → tenant + partner agency context (no JWT required)
  - [x] Restrict partner token to issuance + lookup only
  - [x] Enforce partner scope on lookup
- [x] Rate limiting
  - [x] Implement per-token limit **20 req/min**
  - [x] Return `429` with `Retry-After`
- [x] Tests
  - [x] Token validation and context creation
  - [x] Partner issuance allowed; attribution persisted
  - [x] Partner lookup scoped to partner-issued vouchers only
  - [x] Rate limit enforcement

## Dev Notes

- Tokens are tenant-scoped and form-specific; no auto-expiry (rotate/revoke by admin only).
- Partner tokens **must not** bypass tenant isolation or refusal contract.
- Store token **hashes only**; never store raw token.
- Keep rate-limit thresholds in the single source of truth per project context.

### Project Structure Notes

- Auth/middleware: `apps/api/src/auth/`, `apps/api/src/tenancy/`
- Rate limiting: `apps/api/src/rate-limit/` (or existing middleware location)
- DB migrations: `apps/api/db/migrations/`
- Contracts/refusal reasons: `packages/contracts/`
- Tests: `tests/tenant-isolation/`, `tests/integration/`

### References

- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md` (FR40)
- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md` (Decision 1b, 9c, 13)
- Epics: `_bmad-output/planning-artifacts/epics.md`
- Handoff: `_bmad-output/implementation-artifacts/handoff-plan-2026-02-09.md`

## Dev Agent Record

### Agent Model Used

GPT-5

### Implementation Plan

- Add partner agency/token tables and partner attribution columns via migration.
- Extend audit write helper to accept partner agency attribution.
- Add schema validation test and include it in the test suite.

### Debug Log References

- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/integration/partner-token-schema.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:db`

### Completion Notes List

- Added partner agency + token schema, voucher/audit partner attribution columns.
- Added partner token schema test and wired into `test:admin`.
- Added partner token auth resolver, scope guards, and refusal reasons with integration tests.
- Added per-token rate limiting (20 req/min) with 429 + Retry-After and integration test coverage.
- Added partner lookup voucher-id enforcement, admin scope refusals, and partner issuance/lookup audit attribution.
- Added tenant-matching constraints for partner tokens and audit coverage for partner token flows.
- Added rate-limit bucket cleanup to prevent long-lived memory growth.

### File List

- `_bmad-output/implementation-artifacts/1-6-partner-token-access-embedded-issuance-lookup.md`
- `_bmad-output/implementation-artifacts/4-4-partner-form-customization.md`
- `_bmad-output/implementation-artifacts/handoff-plan-2026-02-09.md`
- `_bmad-output/implementation-artifacts/README.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/planning-artifacts/epics.md`
- `apps/api/db/migrations/008_partner_agencies_tokens.ts`
- `apps/api/src/audit/write.ts`
- `apps/api/src/auth/hook.ts`
- `apps/api/src/auth/partner-token.ts`
- `apps/api/src/auth/types.d.ts`
- `apps/api/src/rate-limit/limits.ts`
- `apps/api/src/rate-limit/partner-token.ts`
- `apps/api/src/tenancy/hook.ts`
- `apps/api/src/tenancy/refusal.ts`
- `package.json`
- `packages/contracts/src/constants/refusal-reasons.ts`
- `tests/integration/partner-token-schema.ts`
- `tests/integration/partner-token-auth.ts`

### Change Log

- 2026-02-09: Added partner agency/token schema, voucher/audit partner attribution columns, and schema validation test.
- 2026-02-09: Added partner token auth flow, refusal reasons, scope guards, and integration tests.
- 2026-02-09: Added per-token rate limiting with 429/Retry-After response and rate-limit test coverage.
- 2026-02-09: Enforced partner lookup voucher-id scoping, blocked partner tokens on admin routes, and logged partner issuance/lookup audit attribution.
- 2026-02-09: Added tenant-matching constraints for partner tokens, audit coverage assertions, and rate-limit bucket cleanup.
