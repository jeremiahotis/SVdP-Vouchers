# ATDD Checklist - Epic 1, Story 1-4: Minimal Audit Write Path (Append-Only)

**Date:** 2026-02-10
**Author:** Jeremiah
**Primary Test Level:** API (integration)

---

## Story Summary

Append-only audit events must be recorded for tenant resolution outcomes and admin actions so auditability exists before voucher workflows expand. Audit writes must include correlation IDs and treat admin audit write failures as errors.

**As a** compliance steward
**I want** append-only audit events written for tenant/auth/admin actions
**So that** later voucher workflows inherit auditability without rework

---

## Acceptance Criteria

1. Given tenant resolution outcomes (success/refusal reason), app enablement refusals, or admin create/enable actions, when those actions occur, then an append-only audit event is written with event_id, actor, tenant, timestamp, reason (if applicable), and correlation_id.
2. Audit write failure is treated as an error for admin actions.
3. A test asserts audit event creation for at least one admin action.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

None. API-only story.

### API Tests (4 tests)

**File:** `tests/integration/audit-write-path.ts` (305 lines)

**Test:** admin tenant create writes audit event
**Status:** RED (pre-implementation). Currently GREEN on this branch.
**Verifies:** audit event exists with actor_id, tenant_id, timestamp, correlation_id after admin tenant creation.

**Test:** tenant refusal writes audit event
**Status:** RED (pre-implementation). Currently GREEN on this branch.
**Verifies:** refusal outcomes write audit event with reason and correlation_id.

**Test:** app-disabled refusal writes audit event
**Status:** RED (pre-implementation). Currently GREEN on this branch.
**Verifies:** app enablement refusal writes audit event with reason and correlation_id.

**Test:** admin audit failure returns error
**Status:** RED (pre-implementation). Currently GREEN on this branch.
**Verifies:** admin audit insert failure surfaces `AUDIT_WRITE_FAILED` and returns error response.

### Component Tests (0 tests)

None. No UI components involved.

---

## Data Factories Created

No new factories required. Existing factories are available and recommended for future audit tests.

**Existing Factory:** `tests/support/fixtures/factories/tenant-factory.ts`
**Exports:** `createTenant`, `createTenantApp`, `createMembership`

**Existing Factory:** `tests/support/fixtures/factories/user-factory.ts`
**Exports:** `UserFactory` (with `createUser` and `cleanup`)

---

## Fixtures Created

No new fixtures required for this story.

**Existing Fixture:** `tests/support/fixtures/index.ts`
**Fixture:** `userFactory` with auto-cleanup stub (no DB delete yet)

---

## Mock Requirements

None. DB-only audit writes. The integration test uses a temporary DB trigger (`audit_fail_trigger`) to simulate insert failures.

---

## Required data-testid Attributes

Not applicable. API-only story.

---

## Implementation Checklist

### Test: admin tenant create writes audit event

**File:** `tests/integration/audit-write-path.ts`

**Tasks to make this test pass:**
1. Add append-only `audit_events` schema with non-null `event_id` and `created_at`.
2. Write audit event on admin tenant creation with actor_id, tenant_id, correlation_id.
3. Ensure response includes correlation_id and audit event is persisted.
4. Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/audit-write-path.ts`
5. Mark test green after passing.

**Estimated Effort:** 2-3 hours

### Test: tenant refusal writes audit event

**File:** `tests/integration/audit-write-path.ts`

**Tasks to make this test pass:**
1. Emit audit event on tenant resolution refusal with reason and correlation_id.
2. Persist audit event without mutation or overwrite.
3. Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/audit-write-path.ts`
4. Mark test green after passing.

**Estimated Effort:** 1-2 hours

### Test: app-disabled refusal writes audit event

**File:** `tests/integration/audit-write-path.ts`

**Tasks to make this test pass:**
1. Emit audit event when app enablement is denied.
2. Include reason and correlation_id on audit event.
3. Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/audit-write-path.ts`
4. Mark test green after passing.

**Estimated Effort:** 1-2 hours

### Test: admin audit failure returns error

**File:** `tests/integration/audit-write-path.ts`

**Tasks to make this test pass:**
1. Treat audit insert failures during admin actions as errors.
2. Return `AUDIT_WRITE_FAILED` in error response with correlation_id.
3. Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/audit-write-path.ts`
4. Mark test green after passing.

**Estimated Effort:** 1-2 hours

---

## Running Tests

```bash
# Run all admin integration tests (includes audit write path)
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin

# Run the audit write path test only
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/audit-write-path.ts

# Headed/debug/coverage are not applicable for API-only tests in this repo
```

---

## Red-Green-Refactor Workflow

### RED Phase (Historical)

Tests were authored after implementation in this repo. RED phase cannot be demonstrated on this branch without reverting the audit code.

### GREEN Phase (DEV Team)

Follow the implementation checklist above. Run the specific test after each change and keep failures actionable.

### REFACTOR Phase (DEV Team)

Refactor only after all audit tests pass. Keep audit events append-only and correlation_id intact.

---

## Knowledge Base References Applied

- `fixture-architecture.md`
- `data-factories.md`
- `component-tdd.md`
- `network-first.md`
- `test-quality.md`
- `test-healing-patterns.md`
- `selector-resilience.md`
- `timing-debugging.md`
- `test-levels-framework.md`
- `test-priorities-matrix.md`
- `api-testing-patterns.md`
- `error-handling.md`

---

## Test Execution Evidence

RED-phase output is not available because the story is already implemented. Current runs should be green. See the story record for historical commands.

---

## Notes

- Project context requires manual test coverage from `TEST_PLAN.md` even for API-only changes.
- The existing audit integration test exceeds the 300-line guideline; consider splitting if further scenarios are added.
- Cross-checked current Playwright, Cypress, Pact, and GitHub Actions documentation for tooling alignment. citeturn0search1turn0search2turn0search3turn1search0

---

**Generated by BMad TEA Agent** - 2026-02-10
