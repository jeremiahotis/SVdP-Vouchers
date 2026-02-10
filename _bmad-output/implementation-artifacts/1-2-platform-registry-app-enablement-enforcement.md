# Story 1.2: Platform Registry + App Enablement Enforcement

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform admin,
I want authoritative tenant/app enablement enforced at the API boundary,
so that disabled tenants cannot access VoucherShyft and enablement is auditable.

## Acceptance Criteria

1. **Given** `platform.tenants` and `platform.tenant_apps`,
   **When** app enablement is evaluated on every tenant-scoped request (all routes except `/admin` and `/health`),
   **Then** disabled tenants return HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` and internal logs record `APP_DISABLED`.
2. **And** platform admin endpoints for tenant/app provisioning require 401/403 on access denial (not refusals).
3. **And** OpenAPI includes admin routes and is generated from the same Fastify route schemas used for validation.
4. **And** CI drift check runs in the repo (no deployment required).

## Tasks / Subtasks

- [x] Implement app enablement check
  - [x] Query `platform.tenant_apps` for current tenant and app enabled
  - [x] Return external `TENANT_NOT_FOUND` refusal while logging `APP_DISABLED`
- [x] Add platform admin route auth rules
  - [x] Admin routes use 401/403 for access denial (not refusal envelope)
- [x] OpenAPI generation
  - [x] Ensure admin routes are included in OpenAPI output
  - [x] Add CI check to fail on OpenAPI drift

## Dev Notes

- External refusal must be indistinguishable from unknown host to prevent enumeration.
- Admin endpoints are not user-facing; use standard 401/403 semantics.
- OpenAPI generation is required for later contracts and CI drift enforcement.

### Project Structure Notes

- App enablement: `apps/api/src/tenancy/enablement/`
- Admin routes: `apps/api/src/admin/` (or equivalent)
- OpenAPI: Fastify schema-driven generation

### References

- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic definitions: `_bmad-output/planning-artifacts/epics.md`

### Technical Requirements (Latest Versions)

- Fastify v5 requires Node.js 20+; target Node 20 LTS or later. citeturn0search1turn1search0
- OpenAPI must be generated from route schemas for drift detection. citeturn2search0

## Dev Agent Record

### Agent Model Used

GPT-5

### Implementation Plan

- Log APP_DISABLED when app enablement is false while returning TENANT_NOT_FOUND.
- Add OpenAPI admin route coverage test and include in admin test run.
- Confirm admin guard semantics remain 401/403.

### Debug Log References

N/A

### Completion Notes List

- Added APP_DISABLED logging on enablement refusal.
- Ensured admin routes are not intercepted by tenant refusal hook (401/403 preserved).
- Added 401/403 responses to admin PATCH OpenAPI schema.
- Added OpenAPI admin drift check by regenerating spec in test.
- Expanded OpenAPI admin route coverage to include PATCH route.
- Tests run: `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:db`.

### File List

- `_bmad-output/implementation-artifacts/1-2-platform-registry-app-enablement-enforcement.md`
- `apps/api/src/admin/routes.ts`
- `apps/api/src/tenancy/hook.ts`
- `AGENTS.md`
- `.gitignore`
- `package.json`
- `tests/integration/openapi-admin-routes.ts`
- `tests/tenant-isolation/host-based-tenant-refusal.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-02-05: Preserved admin 401/403 behavior, added OpenAPI drift check, updated schema/test coverage, and enforced mandatory testing rule.
