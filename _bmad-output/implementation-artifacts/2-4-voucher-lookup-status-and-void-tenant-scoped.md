# Story 2.4: Voucher Lookup/Status and Void (Tenant Scoped)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an authorized steward or admin,  
I want to void vouchers with required reason capture and have lookup/status reflect that outcome within tenant scope,  
so that invalid or rescinded vouchers are controlled and auditable.

## Acceptance Criteria

1. **Given** an authorized role and an active voucher in the current tenant,  
   **When** a void is submitted with a required reason,  
   **Then** the voucher is marked `voided` and an append-only audit event records the reason.
2. **And** unauthorized users or partner tokens attempting a void are refused using FR0 refusal semantics.
3. **And** voucher lookup/status responses in-tenant reflect `voided` state after successful void.
4. **And** cross-tenant voucher IDs are never disclosed; tenant scoping is enforced at query boundary.
5. **And** refusal/error telemetry and correlation_id behavior remain consistent with Epic 1.

## Tasks / Subtasks

- [ ] Implement void request contract
  - [ ] Define void endpoint payload with required `reason`.
  - [ ] Validate reason constraints (required, trimmed, bounded length, plain text).
  - [ ] Define/refine refusal reason codes for unauthorized or invalid void attempts.
- [ ] Implement void domain behavior
  - [ ] Add void service under `apps/api/src/vouchers/` (or `apps/api/src/vouchers/void/`).
  - [ ] Enforce allowed actor roles and tenant scope checks.
  - [ ] Prevent illegal state transitions (already voided, redeemed-policy constraints per product rules).
- [ ] Update lookup/status surface for tenant-scoped status
  - [ ] Ensure lookup by ID/fields returns current status including `voided`.
  - [ ] Preserve partner-token lookup scope (partner can only view own-issued vouchers).
  - [ ] Avoid cross-tenant leakage in not-found/refusal semantics.
- [ ] Implement audit + observability
  - [ ] Write append-only audit event for successful void with reason and correlation_id.
  - [ ] Keep refusal outcomes logged as refusal (not error) for policy denials.
- [ ] Add tests
  - [ ] Integration test: authorized void succeeds and status becomes `voided`.
  - [ ] Integration test: missing reason refused.
  - [ ] Integration test: unauthorized JWT role refused.
  - [ ] Integration test: partner-token void refused.
  - [ ] Integration test: lookup/status reflects voided result in tenant scope only.

## Dev Notes

### Story Foundation

- This story closes Epic 2 governance with terminal lifecycle control (void) and immediate status visibility.
- It builds on issuance/duplicate/override foundations from Stories 2.1–2.3.
- Lookup/status behavior must remain tenant-scoped and partner-scoped where applicable.

### Developer Context Section

- Void is a mutating, destructive action and requires explicit reason capture.
- Refusals should provide policy-safe guidance while avoiding data leakage.
- Tenant/issuer context must remain pinned and visible in mutating UX surfaces.
- Mobile mutating behavior defaults remain restricted by UX policy unless explicitly enabled.

### Technical Requirements

- Status set must include at minimum: `active`, `redeemed`, `expired`, `voided`.
- Void writes must be idempotency-safe enough to avoid duplicate side effects on retries.
- Audit event for void must include actor, tenant, reason, timestamp, correlation_id.
- On-wire payloads remain `snake_case`.

### Architecture Compliance

- Voucher lifecycle remains in `apps/api/src/vouchers/`.
- Tenant context from middleware is mandatory for all lookup/void queries.
- Route-level schemas plus domain-level invariants both required.
- Keep refusal/error split and structured logging semantics from Epic 1.

### Library / Framework Requirements

- Fastify v5 route schemas for void endpoint and lookup/status responses.
- Use existing contracts/constants package for refusal codes and shared types.
- Postgres constraints and indexed tenant columns for status lookup performance.

### File Structure Requirements

- API:
  - `apps/api/src/vouchers/` for void and status query behavior
  - optional submodules `apps/api/src/vouchers/void/` and `apps/api/src/vouchers/lookup/`
- Tests:
  - `tests/integration/` for lifecycle and status assertions
  - `tests/tenant-isolation/` for no cross-tenant leakage behavior

### Testing Requirements

- Required compose checks before handoff:
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin`
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant`
- Add regression tests for:
  - void reason enforcement
  - unauthorized refusal path
  - lookup/status reflects voided state
  - partner scope and tenant scope boundaries

### Previous Story Intelligence

- Story 1.6 established partner-token scope; partner tokens are issuance/lookup-only and should not void vouchers.
- Story 1.4 defined append-only audit posture; void events must use same append-only model.
- Story 3.1/3.2 (future epic) will extend lookup/status UX depth; this story should avoid over-scoping UI work and focus on API/domain correctness.

### Git Intelligence Summary

- Recent work confirms importance of route-boundary tests for refusal envelopes and schema behavior.
- CI compose matrix catches schema/migration assumptions early; keep tests fresh-DB compatible.

### Project Context Reference

- `_bmad-output/project-context.md` governs:
  - refusal semantics
  - tenant/capability enforcement
  - sanitization
  - mandatory test execution

### Project Structure Notes

- Keep scope on API/domain correctness and auditability.
- Do not implement redemption workflows here.
- Avoid introducing cross-module coupling that blocks Epic 3 lookup-status expansion.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.4)
- `_bmad-output/planning-artifacts/voucher-shyft-prd.md` (FR19, FR20, FR0)
- `_bmad-output/planning-artifacts/voucher-shyft-architecture.md` (voucher lifecycle module mapping, tenant-scoped queries)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (void/override governance and status expectations)
- `_bmad-output/implementation-artifacts/2-3-authorized-override-with-reason-audit.md`
- `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

- Story preparation only (no implementation logs).

### Completion Notes List

- Story drafted for tenant-scoped void governance with reason audit and status/lookup consistency.
- Scope intentionally constrained to avoid overlap with redemption and broader lookup UX epics.

### File List

- `_bmad-output/implementation-artifacts/2-4-voucher-lookup-status-and-void-tenant-scoped.md`

