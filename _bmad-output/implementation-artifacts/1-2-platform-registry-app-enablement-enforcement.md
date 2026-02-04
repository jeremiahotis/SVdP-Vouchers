# Story 1.2: Platform Registry + App Enablement Enforcement

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform admin,
I want authoritative tenant/app enablement enforced at the API boundary,
so that disabled tenants cannot access VoucherShyft and enablement is auditable.

## Acceptance Criteria

1. **Given** `platform.tenants` and `platform.tenant_apps`,
   **When** app enablement is evaluated on every request,
   **Then** disabled tenants return HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` and internal logs record `APP_DISABLED`.
2. **And** platform admin endpoints for tenant/app provisioning require 401/403 on access denial (not refusals).
3. **And** OpenAPI includes admin routes and is generated from the same Fastify route schemas used for validation.
4. **And** CI drift check runs in the repo (no deployment required).

## Tasks / Subtasks

- [ ] Implement app enablement check
  - [ ] Query `platform.tenant_apps` for current tenant and app enabled
  - [ ] Return external `TENANT_NOT_FOUND` refusal while logging `APP_DISABLED`
- [ ] Add platform admin route auth rules
  - [ ] Admin routes use 401/403 for access denial (not refusal envelope)
- [ ] OpenAPI generation
  - [ ] Ensure admin routes are included in OpenAPI output
  - [ ] Add CI check to fail on OpenAPI drift

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

### Debug Log References

N/A

### Completion Notes List

- Story scaffolded for enablement enforcement and OpenAPI drift checks.

### File List

- `_bmad-output/implementation-artifacts/1-2-platform-registry-app-enablement-enforcement.md`
