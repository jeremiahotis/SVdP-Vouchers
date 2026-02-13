# Story 2.3: Authorized Override with Reason Audit

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an authorized steward or admin,  
I want to override duplicate refusals with a reason,  
so that policy exceptions are allowed but auditable.

## Acceptance Criteria

1. **Given** a duplicate refusal/warning eligible for override,  
   **When** an authorized role submits an override with a required reason,  
   **Then** issuance proceeds and the override reason is captured in append-only audit events.
2. **And** unauthorized users or partner tokens attempting an override are refused with FR0 envelope semantics.
3. **And** override attempts always retain tenant scope and correlation_id telemetry.
4. **And** override behavior is explicit in API responses (authorized proceed vs refusal outcome).

## Tasks / Subtasks

- [x] Implement override request contract
  - [x] Define override payload (`override_reason` and any required duplicate reference metadata).
  - [x] Enforce required reason validation (non-empty, bounded length, sanitized).
  - [x] Reuse refusal reason constants for unauthorized/invalid override attempts.
- [x] Implement authorization and domain flow
  - [x] Add override gate in issuance path for duplicate outcomes.
  - [x] Authorize only allowed tenant roles (explicit role list in code, not implicit).
  - [x] Block partner-token override attempts by default.
- [x] Implement audit logging requirements
  - [x] Write append-only audit event for successful overrides with actor, tenant, reason, correlation_id.
  - [x] Log refusal outcomes for unauthorized attempts without creating successful issuance.
  - [x] Preserve partner attribution if override path later expands (currently refused for partner tokens).
- [x] Add tests
  - [x] Integration test: authorized override with reason issues voucher.
  - [x] Integration test: missing reason is refused.
  - [x] Integration test: unauthorized JWT role refused.
  - [x] Integration test: partner-token override refused.
  - [x] Audit test: override reason is persisted in append-only audit event.

## Dev Notes

### Story Foundation

- Story 2.2 provides duplicate detection outcomes; this story controls the exception path.
- Core governance goal: make override possible but never silent or unaudited.
- This story must not dilute tenant isolation or role enforcement from Epic 1.

### Developer Context Section

- Override is a privileged action and must be explicit, reason-backed, and observable.
- Reason capture is mandatory for successful override issuance.
- Unauthorized override attempts are business refusals (FR0), not generic server errors.
- Keep override UX alignment: confirmation/override modal requires reason and shows active tenant/issuer context.

### Technical Requirements

- Explicit role allowlist for overrides (tenant-scoped role checks).
- Reason field constraints:
  - required
  - trimmed plain text
  - max length enforced at validation boundary
- Override audit event fields must include:
  - `event_type`
  - `actor_id`
  - `tenant_id`
  - `reason`
  - `correlation_id`
  - timestamp

### Architecture Compliance

- Keep authorization layering:
  - route middleware for baseline auth/tenant context
  - domain service as final authority for override eligibility
- Keep append-only audit model; no update-in-place history records.
- Maintain refusal vs error telemetry split from Story 1.3.

### Library / Framework Requirements

- Fastify schema definitions for override payload and response envelopes.
- Shared refusal/audit constants from `packages/contracts`.
- Use existing Knex/Postgres persistence patterns.

### File Structure Requirements

- Override domain code in `apps/api/src/vouchers/overrides/` (or existing vouchers domain path).
- Issuance integration updates in `apps/api/src/vouchers/`.
- Audit behavior in `apps/api/src/audit/`.
- Tests in `tests/integration/` and `tests/tenant-isolation/` as applicable.

### Testing Requirements

- Required compose suite checks before handoff:
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin`
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant`
- Add test assertions for:
  - successful override issuance with persisted reason
  - unauthorized refusal without issuance side effects
  - partner-token refusal path
  - correlation-aware refusal telemetry

### Previous Story Intelligence

- Story 1.4 established append-only audit write expectations.
- Story 1.6 scoped partner tokens to issuance + lookup own vouchers only; override remains disallowed.
- Story 2.2 defines the duplicate detector; avoid duplicating duplicate logic in override handler.

### Git Intelligence Summary

- Recent work concentrated on route-level boundary tests and refusal envelopes; follow same boundary-first testing pattern.
- CI compose matrix is now strict; ensure new tests run reliably in isolated jobs.

### Project Context Reference

- `_bmad-output/project-context.md` remains canonical for:
  - sanitization
  - refusal semantics
  - strict tenant/capability checks
  - mandatory testing discipline

### Project Structure Notes

- Keep scope focused on override authorization + auditing.
- Do not bundle void behavior into this story (void is Story 2.4).

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.3)
- `_bmad-output/planning-artifacts/voucher-shyft-prd.md` (FR22, FR23, FR24, FR0)
- `_bmad-output/planning-artifacts/voucher-shyft-architecture.md` (auth/tenant layering, audit patterns)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (override path and modal constraints)
- `_bmad-output/implementation-artifacts/2-2-duplicate-detection-policy-window.md`
- `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/integration/voucher-override-with-reason.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/tenant-isolation/voucher-override-tenant-scope.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test sh -lc 'pnpm tsx tests/integration/voucher-override-with-reason.ts && echo override_integration_passed && pnpm tsx tests/tenant-isolation/voucher-override-tenant-scope.ts && echo override_tenant_scope_passed'`

### Completion Notes List

- Added override fields to the issuance contract with schema and validation support for `override_reason` and `duplicate_reference_voucher_id`.
- Implemented explicit override authorization allowlist (`store_admin`, `steward`, `platform_admin`) and blocked all partner-token override attempts.
- Added duplicate warning override gate that requires sanitized non-empty reason and a tenant-scoped duplicate reference ID matching the duplicate-policy match.
- Added append-only audit behavior for successful overrides (`voucher.issuance.override`) and refusal-path audit events for unauthorized/invalid override attempts.
- Verified Story 2.3 integration and tenant-scope tests pass, and ran required compose suites (`test:admin`, `test:tenant`) with passing exit codes.

### File List

- `apps/api/src/partner/routes.ts`
- `packages/contracts/src/constants/voucher-issuance.ts`
- `tests/integration/voucher-override-with-reason.ts`
- `tests/tenant-isolation/voucher-override-tenant-scope.ts`
- `tests/support/helpers/voucher-integration-harness.ts`
- `tests/support/fixtures/factories/voucher-override-factory.ts`
- `tests/tenant-isolation/README.md`
- `_bmad-output/atdd-checklist-2-3-authorized-override-with-reason-audit.md`
- `_bmad-output/automation-summary.md`
- `_bmad-output/implementation-artifacts/2-3-authorized-override-with-reason-audit.md`
