# Story 2.3: Authorized Override with Reason Audit

Status: ready-for-dev

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

- [ ] Implement override request contract
  - [ ] Define override payload (`override_reason` and any required duplicate reference metadata).
  - [ ] Enforce required reason validation (non-empty, bounded length, sanitized).
  - [ ] Reuse refusal reason constants for unauthorized/invalid override attempts.
- [ ] Implement authorization and domain flow
  - [ ] Add override gate in issuance path for duplicate outcomes.
  - [ ] Authorize only allowed tenant roles (explicit role list in code, not implicit).
  - [ ] Block partner-token override attempts by default.
- [ ] Implement audit logging requirements
  - [ ] Write append-only audit event for successful overrides with actor, tenant, reason, correlation_id.
  - [ ] Log refusal outcomes for unauthorized attempts without creating successful issuance.
  - [ ] Preserve partner attribution if override path later expands (currently refused for partner tokens).
- [ ] Add tests
  - [ ] Integration test: authorized override with reason issues voucher.
  - [ ] Integration test: missing reason is refused.
  - [ ] Integration test: unauthorized JWT role refused.
  - [ ] Integration test: partner-token override refused.
  - [ ] Audit test: override reason is persisted in append-only audit event.

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

- Story preparation only (no implementation logs).

### Completion Notes List

- Story drafted with strict override authorization boundaries and mandatory reason auditing.
- Separation of concerns preserved between duplicate detection, override decisioning, and void workflow.

### File List

- `_bmad-output/implementation-artifacts/2-3-authorized-override-with-reason-audit.md`

