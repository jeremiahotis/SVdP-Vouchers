# Story 1.4: Minimal Audit Write Path (Append-Only)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a compliance steward,
I want append-only audit events written for tenant/auth/admin actions,
so that later voucher workflows inherit auditability without rework.

## Acceptance Criteria

1. **Given** tenant resolution outcomes (success/refusal reason), app enablement refusals, or admin create/enable actions,
   **When** those actions occur,
   **Then** an append-only audit event is written with event_id, actor, tenant, timestamp, reason (if applicable), and correlation_id.
2. **And** audit write failure is treated as an error for admin actions.
3. **And** a test asserts audit event creation for at least one admin action.

## Tasks / Subtasks

- [ ] Define audit event schema
  - [ ] Append-only structure with `event_id`, `actor_id`, `tenant_id`, `timestamp`, `reason`, `correlation_id`
- [ ] Implement audit write path
  - [ ] Write on tenant resolution outcomes and admin actions
  - [ ] Treat admin audit write failures as errors
- [ ] Add tests
  - [ ] Assert audit event written for admin action
  - [ ] Assert refusal outcomes write audit event

## Dev Notes

- Audit events are append-only and must not be mutated.
- All events must include `correlation_id` for traceability.

### Project Structure Notes

- Audit module: `apps/api/src/audit/`
- DB: `apps/api/src/db/` (migrations for audit table)
- Tests: `tests/integration/`

### References

- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic definitions: `_bmad-output/planning-artifacts/epics.md`

### Technical Requirements (Latest Versions)

- Postgres 17.x latest patch is pinned for MVP; schema/migrations should target that line. citeturn0search2

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

N/A

### Completion Notes List

- Story scaffolded for append-only audit write path.

### File List

- `_bmad-output/implementation-artifacts/1-4-minimal-audit-write-path-append-only.md`
