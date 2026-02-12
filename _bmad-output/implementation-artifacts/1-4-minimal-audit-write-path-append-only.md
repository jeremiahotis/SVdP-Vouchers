# Story 1.4: Minimal Audit Write Path (Append-Only)

Status: done

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

- [x] Define audit event schema
  - [x] Append-only structure with `event_id`, `actor_id`, `tenant_id`, `timestamp`, `reason`, `correlation_id`
- [x] Implement audit write path
  - [x] Write on tenant resolution outcomes and admin actions
  - [x] Treat admin audit write failures as errors
- [x] Add tests
  - [x] Assert audit event written for admin action
  - [x] Assert refusal outcomes write audit event

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

- `docker compose -f "/Users/jeremiahotis/Local Sites/voucher-system/app/public/wp-content/plugins/voucher-shyft/infra/docker/docker-compose.yml" run --rm api-test pnpm tsx tests/integration/audit-write-path.ts`
- `docker compose -f "/Users/jeremiahotis/Local Sites/voucher-system/app/public/wp-content/plugins/voucher-shyft/infra/docker/docker-compose.yml" run --rm --build api-test pnpm test:admin`

### Completion Notes List

- Confirmed audit events are append-only with correlation_id persisted.
- Tenant resolution refusals and admin actions write audit events; admin audit failures return errors with `AUDIT_WRITE_FAILED`.
- Audit timestamp is stored as `audit_events.created_at`; event_id is `audit_events.id` (UUID, non-null).
- Integration tests cover admin action, refusal audit writes, and admin audit failure response codes.
- Regression: `pnpm test:admin`

### File List

- `apps/api/src/audit/write.ts`
- `apps/api/src/tenancy/hook.ts`
- `apps/api/src/admin/routes.ts`
- `apps/api/src/observability/correlation.ts`
- `apps/api/src/tenancy/refusal.ts`
- `apps/api/db/migrations/006_add_correlation_id_to_audit_events.ts`
- `apps/api/db/migrations/007_audit_events_event_id_not_null.ts`
- `apps/api/openapi.admin.json`
- `tests/integration/audit-write-path.ts`
- `package.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/atdd-checklist-1-4.md`
- `_bmad-output/implementation-artifacts/1-4-minimal-audit-write-path-append-only.md`

### Change Log

- 2026-02-06: Verified audit write path and tests for Story 1.4.
- 2026-02-06: Enforced non-null audit event IDs, clarified timestamp mapping, and hardened admin audit failure handling.
