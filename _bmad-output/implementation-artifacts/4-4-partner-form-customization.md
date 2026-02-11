# Story 4.4: Partner Form Customization

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a store admin,
I want partner-specific form customization,
so that each partner's embedded form matches allowed voucher types and partner messaging.

## Acceptance Criteria

1. **Given** a partner agency,
   **When** the admin configures allowed voucher types, intro text, and rules list,
   **Then** the embedded form reflects those settings in the correct positions.
2. **And** intro text renders as a `<p>` near the top of the form.
3. **And** rules render as a `<ul>` directly above the name collection field.
4. **And** allowed voucher types are enforced server-side for partner-token issuance.

## Tasks / Subtasks

- [x] Implement partner form config contract (AC: 1, 4)
  - [x] Add a shared form-config schema in `packages/contracts` with `allowed_voucher_types`, `intro_text`, `rules_list`.
  - [x] Enforce `snake_case` payload fields and strict validation (type, length, array item count).
  - [x] Reuse shared schema in API handlers and tests.

- [x] Implement tenant-scoped admin API for partner form configuration (AC: 1)
  - [x] Add store-admin routes for reading/updating partner form config (do not use platform-admin routes).
  - [x] Persist config in `partner_tokens.form_config` for the active token.
  - [x] Reject tenant/partner IDs from request body/query when token/JWT context is authoritative.

- [x] Implement sanitization and storage policy (AC: 1, 2, 3)
  - [x] Sanitize `intro_text` and each `rules_list` item as plain text, no HTML passthrough.
  - [x] Store normalized values (trimmed, empty values removed, deduplicated rules).
  - [x] Ensure rendering layer controls markup (`<p>`, `<ul><li>`) instead of stored HTML.

- [x] Implement embedded form read and render flow (AC: 1, 2, 3)
  - [x] Add token-scoped endpoint to return partner form config for embedded form usage.
  - [x] Render intro text in a single `<p>` near top of form.
  - [x] Render rules list in a `<ul>` immediately above the name collection section.
  - [x] Render only configured voucher types.

- [x] Enforce allowed voucher types in issuance path (AC: 4)
  - [x] On partner-token issuance, validate requested voucher type against token `form_config.allowed_voucher_types`.
  - [x] Return refusal envelope on disallowed type (HTTP 200 with `success:false, reason`).
  - [x] Keep refusal/error telemetry split intact.

- [x] Add coverage and QA checks (AC: 1, 2, 3, 4)
  - [x] Integration test: config persistence and retrieval for partner token.
  - [x] Integration test: disallowed voucher type is refused server-side.
  - [x] UI test (or integration-level render assertion): intro `<p>` and rules `<ul>` placement is correct.
  - [x] Regression test: partner token cannot read/write outside tenant/partner scope.

## Dev Notes

### Story Foundation

- Epic source defines this story under Epic 4 (Tenant Admin & Partner Management).
- This story extends completed Story 1.6 partner-token foundations, not a greenfield auth path.
- Current repo has partner-token auth/rate-limit middleware and schema columns; this story adds admin+embed customization flows and issuance enforcement.

### Developer Context Section

- `partner_tokens.form_config` already exists (`jsonb`) from migration `008_partner_agencies_tokens.ts`; reuse it rather than creating new persistence tables.
- Partner-token route guard exists in `apps/api/src/tenancy/hook.ts` and currently restricts partner token traffic to issuance and lookup routes.
- `apps/web` is currently minimal (`layout`, `page`, `globals`, `api-client`), so this story must define the first concrete partner admin/embed feature slices.
- Existing admin routes are platform-level (`/admin/tenants`, `/admin/tenant-apps`) and guarded by `platform_admin`; story 4.4 requires tenant store-admin capabilities and should not piggyback platform routes.

### Technical Requirements

- Form config shape must include:
  - `allowed_voucher_types: string[]`
  - `intro_text: string`
  - `rules_list: string[]`
- Data format constraints:
  - Store text as plain text only (no HTML in persisted content).
  - Keep serialized payloads as `snake_case`.
  - Dates/timestamps (if added) must be ISO-8601 UTC `Z`.
- Security and tenant isolation:
  - Do not accept tenant context from body/query.
  - Derive tenant and partner scope from JWT/host or partner token context only.
  - Keep refusal semantics for policy denials and 401/403 only for authz failures where specified.

### Architecture Compliance

- Maintain one-tenant-per-request execution.
- Keep partner token scope bounded to partner issuance/lookup behavior.
- Do not bypass tenancy helpers or request context.
- Preserve refusal contract and correlation ID behavior in new handlers.
- Keep server-side enforcement authoritative for allowed voucher types.

### Library / Framework Requirements

- Fastify v5 route schemas must be full JSON Schema objects for request/response payloads.
- Fastify v5 runtime baseline remains Node.js 20+.
- Next.js app router web surfaces should stay within existing app structure.
- PostgreSQL should remain on supported patch lines (current architecture baseline: 17.x line for deployment target).

### File Structure Requirements

- API domain additions should stay in `apps/api/src/` with feature grouping by concern.
- Contracts should live in `packages/contracts/src/` and be imported by API and tests.
- New admin/embed UI files belong under `apps/web/app/` and shared client utilities under `apps/web/lib/`.
- Integration tests should be added under `tests/integration/`.
- Tenant isolation/scope checks should be added under `tests/tenant-isolation/` when applicable.

### Testing Requirements

- Run targeted integration tests during implementation slices.
- Run full DB-backed regression in compose before story completion:
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:db`
- Add explicit tests for:
  - Form config persistence and retrieval
  - Server-side allowed-voucher-type enforcement
  - Refusal telemetry fields for policy denials
  - Token scope integrity (no cross-partner/cross-tenant leakage)

### Previous Story Intelligence

- Story 1.6 established reusable foundations:
  - Partner token resolution (`apps/api/src/auth/partner-token.ts`)
  - Partner scope/refusal enforcement (`apps/api/src/tenancy/hook.ts`)
  - Rate limiting (`apps/api/src/rate-limit/partner-token.ts`)
  - Partner attribution in audit events (`apps/api/src/audit/write.ts`)
- Reuse these paths instead of creating parallel token/auth implementations.

### Git Intelligence Summary

- Commit `c89a90e` (“Epic 1: Harden partner token access”) introduced partner token schema, auth, scope guardrails, and integration tests.
- Existing partner-token tests (`tests/integration/partner-token-auth.ts`, `tests/integration/partner-token-schema.ts`) should be extended rather than duplicated.

### Latest Tech Information

- Fastify v5 migration guidance confirms Node.js 20+ and full JSON Schema requirements for `querystring`, `params`, `body`, and `response`.
- Next.js security guidance for App Router release lines indicates frequent patching; use current patched stable in the selected major/minor line when implementing new web surfaces.
- PostgreSQL support policy currently lists 17.7 and 18.1 as supported current minors; keep deployment and CI images on supported patch lines.

### Project Context Reference

- Enforce REST-only for new APIs; avoid adding admin-ajax paths.
- Preserve nonce/capability patterns where WordPress paths still apply; for standalone API, preserve existing auth + refusal contracts.
- Keep JSON as `snake_case`, and preserve correlation/audit behavior on write and refusal paths.
- Do not expose coats in request form logic (global invariant from scope lock docs).

### Project Structure Notes

- This story is implementation-ready but depends on tenant admin management flow from Epic 4 for complete UI path continuity.
- If 4.2/4.3 endpoints are not present yet, implement minimal required partner config endpoints within this story scope and keep route naming aligned with planned Epic 4 API structure.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.4)
- `_bmad-output/planning-artifacts/voucher-shyft-prd.md` (FR40, FR31, FR32, FR0)
- `_bmad-output/planning-artifacts/voucher-shyft-architecture.md` (Decision 1b, 9c, API/tenant constraints)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (PartnerAgencyManager, PartnerEmbedForm, embedded flow + placement constraints)
- `_bmad-output/planning-artifacts/ui/system-invariants.md` (decision visibility, context integrity, progressive disclosure)
- `_bmad-output/implementation-artifacts/1-6-partner-token-access-embedded-issuance-lookup.md` (existing partner-token implementation learnings)
- `_bmad-output/implementation-artifacts/handoff-plan-2026-02-09.md` (partner token scope + admin customization handoff)
- `apps/api/db/migrations/008_partner_agencies_tokens.ts` (form_config persistence baseline)
- `apps/api/src/auth/partner-token.ts` (token resolution baseline)
- `apps/api/src/tenancy/hook.ts` (partner scope/rate-limit/refusal guardrails)
- `https://fastify.dev/docs/v5.7.x/Guides/Migration-Guide-V5/` (Fastify v5 requirements)
- `https://nextjs.org/blog/security-update-2025-12-11` (Next.js patch-line security guidance)
- `https://www.postgresql.org/support/versioning/` (supported PostgreSQL release lines)

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

- `pnpm -C packages/contracts build`
- `pnpm -C apps/api build`
- `pnpm -C apps/web build`
- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:db`

### Completion Notes List

- Added shared partner form config contract schema/normalization/validation with strict snake_case payload enforcement.
- Added partner domain services and routes for token-scoped form config read, store-admin form config read/update, and partner issuance enforcement.
- Extended tenancy guardrails to accept partner form-config read path and reject partner/tenant context override fields in request query/body.
- Added embedded partner form UI route and layout logic that renders intro in `<p>`, rules in `<ul>`, and only configured voucher types.
- Added DB-backed integration tests for config persistence/retrieval, disallowed voucher refusal, and cross-tenant/cross-partner scope protection.
- Added integration-level layout assertion for intro/rules placement and voucher type rendering.
- Updated API test image and test script wiring so new integration coverage runs in `api-test`.

### File List

- `_bmad-output/implementation-artifacts/4-4-partner-form-customization.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/src/partner/form-config.ts`
- `apps/api/src/partner/issuance.ts`
- `apps/api/src/partner/routes.ts`
- `apps/api/src/rate-limit/partner-token.ts`
- `apps/api/src/routes.ts`
- `apps/api/src/tenancy/hook.ts`
- `apps/api/src/tenancy/refusal.ts`
- `apps/web/app/embed/page.tsx`
- `apps/web/app/embed/partner-embed-client.tsx`
- `apps/web/lib/partner-embed-form.tsx`
- `apps/web/lib/partner-embed-layout.ts`
- `infra/docker/api.test.Dockerfile`
- `package.json`
- `packages/contracts/src/constants/partner-form-config.ts`
- `packages/contracts/src/constants/refusal-reasons.ts`
- `packages/contracts/src/index.ts`
- `tests/integration/partner-form-config.ts`
- `tests/integration/partner-embed-form-render.ts`

### Change Log

- 2026-02-10: Implemented partner form customization contract, API/domain logic, embedded form rendering, and full DB-backed regression coverage for AC1-AC4.
