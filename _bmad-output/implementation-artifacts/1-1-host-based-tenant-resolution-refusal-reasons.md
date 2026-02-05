# Story 1.1: Host-Based Tenant Resolution + Refusal Reasons

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform operator,
I want tenant context derived only from host + JWT and explicit refusal reasons,
so that tenant isolation is enforceable without enumeration.

## Acceptance Criteria

1. **Given** a request to a tenant host matching `{tenant_slug}.voucher.{root_domain}`,
   **When** the host matches `platform.tenants.host` exactly and JWT tenant claim matches the resolved `tenant_id`,
   **Then** the request executes in that tenant context and no tenant IDs are accepted from body/query.
2. **And** unknown host returns HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` with correlation_id.
3. **And** host/JWT mismatch returns HTTP 200 refusal `{ success:false, reason:"TENANT_CONTEXT_MISMATCH" }`.
4. **And** non-membership returns HTTP 200 refusal `{ success:false, reason:"NOT_A_MEMBER" }`.
5. **And** unknown host refusal does not differ in message shape or status from disabled-app refusal; tests verify identical external envelope/reason.
6. **And** a tenant isolation test case is added covering the three refusal reasons.

## Tasks / Subtasks

- [x] Implement tenant resolution middleware
  - [x] Resolve tenant from host header only (exact match to `platform.tenants.host`)
  - [x] Verify JWT tenant claim matches resolved tenant_id
  - [x] Reject any tenant_id in body/query
- [x] Implement refusal envelope helpers
  - [x] `TENANT_NOT_FOUND`, `TENANT_CONTEXT_MISMATCH`, `NOT_A_MEMBER` with HTTP 200
  - [x] Include `correlation_id` in all responses
- [x] Add tenant isolation tests
  - [x] Unknown host → `TENANT_NOT_FOUND`
  - [x] Host/JWT mismatch → `TENANT_CONTEXT_MISMATCH`
  - [x] Not a member → `NOT_A_MEMBER`
  - [x] Envelope shape identical for unknown host vs app-disabled

## Dev Notes

- Tenant context must be derived only from host + JWT claim match; no tenant from input.
- Refusal vs error semantics are contract-level and must be enforced at the API boundary.
- Tests must prevent cross-tenant enumeration by ensuring identical external refusal shape.

### Project Structure Notes

- Tenant resolution: `apps/api/src/tenancy/`
- Auth/JWT: `apps/api/src/auth/`
- Refusal helpers: shared contracts in `packages/contracts/`
- Tests: `tests/tenant-isolation/`

### References

- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic definitions: `_bmad-output/planning-artifacts/epics.md`
- Project context: `_bmad-output/project-context.md`

### Technical Requirements (Latest Versions)

- Next.js 16.x is the required major line; use the latest 16.x patch for scaffolded apps. citeturn2search1turn2search2
- Fastify v5 requires Node.js 20+; runtime must target Node 20 or later. citeturn0search1turn1search0

## Dev Agent Record

### Agent Model Used

GPT-5

### Implementation Plan

- Enforce tenant context via hook (host/JWT match, reject tenant_id in input, membership check).
- Extend refusal reason constants and helper.
- Add isolation test coverage for refusal reasons and envelope parity.

### Debug Log References

N/A

### Completion Notes List

- Implemented tenant_id query/body rejection and membership refusal in tenancy hook; added membership lookup helper and NOT_A_MEMBER refusal constant.
- Added host-based tenant refusal isolation test and tenant factory.
- Updated Postgres config to read POSTGRES_PORT for local docker testing.
- Hardened tenant context to require authContext/tenant claim, added request-scoped DB transaction hooks, and expanded tenant isolation tests for missing auth/claim.
- Tests run (this update): `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant`, `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:db`.

### File List

- `_bmad-output/implementation-artifacts/1-1-host-based-tenant-resolution-refusal-reasons.md`
- `_bmad-output/atdd-checklist-1-1-host-based-tenant-resolution-refusal-reasons.md`
- `.env`
- `AGENTS.md`
- `apps/api/db/knexfile.ts`
- `apps/api/src/db/hooks.ts`
- `apps/api/src/db/types.d.ts`
- `apps/api/src/main.ts`
- `apps/api/src/platform/tenants.ts`
- `apps/api/src/tenancy/hook.ts`
- `apps/api/src/tenancy/membership.ts`
- `apps/api/src/tenancy/refusal.ts`
- `apps/api/src/tenancy/resolve.ts`
- `package.json`
- `packages/contracts/src/constants/refusal-reasons.ts`
- `tests/support/fixtures/factories/tenant-factory.ts`
- `tests/tenant-isolation/host-based-tenant-refusal.ts`
- `.DS_Store`
- `.codex/config.toml`
- `.codex/log/codex-tui.log`
- `.codex/rules/default.rules`
- `.codex/version.json`
- `_bmad-output/.DS_Store`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `infra/docker/api.test.Dockerfile`
- `infra/docker/docker-compose.yml`

### Change Log

- 2026-02-05: Implemented tenancy refusal enforcement (NOT_A_MEMBER, tenant_id rejection), added tenant isolation tests, updated Postgres port handling.
- 2026-02-05: Required authContext/tenant claim for tenant context, added request-scoped DB transaction hooks, expanded tenant isolation tests, and updated tenancy resolution to accept DB overrides.
- 2026-02-05: Added dockerized api-test runner, documented docker-only test guidance, and aligned local Postgres env with compose defaults.
