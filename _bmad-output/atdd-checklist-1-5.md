# ATDD Checklist - Epic 1, Story 1-5: Operational Gates Hooks (Release-Blocking)

**Date:** 2026-02-10
**Author:** Jeremiah
**Primary Test Level:** Integration (filesystem/CI)

---

## Story Summary

Operational readiness for the single-droplet Postgres stack must be enforced via documented gates and CI enforcement. This story ensures release gating includes backup/restore practices and monitoring thresholds before Epic 1 ships.

**As a** release manager
**I want** droplet Postgres operational gates represented in docs/CI hooks
**So that** release readiness includes backup/restore and alert thresholds

---

## Acceptance Criteria

1. Given the cutover and ops requirements, when Epic 1 is completed, then documentation/runbook hooks exist for nightly backups, weekly full backups, monthly restore drills, disk alert at 80%, and IO wait >20% for 5 minutes.
2. A release-gate checklist file exists (e.g., `docs/RELEASE_GATES.md`) and CI fails if it is missing.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

None.

### API Tests (8 tests)

**File:** `tests/integration/operational-gates.ts` (118 lines)

- **Test:** release gates doc exists
  - **Status:** RED - `docs/RELEASE_GATES.md` missing
  - **Verifies:** release-gate checklist file exists (CI-enforced by running this test)
- **Test:** nightly backups (30 days)
  - **Status:** RED - content missing until doc exists
  - **Verifies:** nightly backups and 30-day retention documented
- **Test:** weekly full backups (12 weeks)
  - **Status:** RED - content missing until doc exists
  - **Verifies:** weekly full backups and 12-week retention documented
- **Test:** monthly restore drill
  - **Status:** RED - content missing until doc exists
  - **Verifies:** monthly restore drill documented
- **Test:** disk utilization alert at 80%
  - **Status:** RED - content missing until doc exists
  - **Verifies:** disk alert threshold documented
- **Test:** IO wait alert >20% for 5 minutes
  - **Status:** RED - content missing until doc exists
  - **Verifies:** IO wait alert threshold and duration documented
- **Test:** cutover runbook reference
  - **Status:** RED - content missing until doc exists
  - **Verifies:** migration/cutover runbook referenced
- **Test:** parity checks reference
  - **Status:** RED - content missing until doc exists
  - **Verifies:** parity checks referenced

### Component Tests (0 tests)

None.

---

## Data Factories Created

None.

---

## Fixtures Created

None.

---

## Mock Requirements

None.

---

## Required data-testid Attributes

Not applicable.

---

## Implementation Checklist

### Test: release gates doc exists

**File:** `tests/integration/operational-gates.ts`

**Tasks to make this test pass:**
1. Create `docs/RELEASE_GATES.md` (release-gate checklist).
2. Wire CI to execute `pnpm tsx tests/integration/operational-gates.ts` (or a `test:release-gates` script).
3. Run test: `pnpm tsx tests/integration/operational-gates.ts`
4. ✅ Test passes (green phase)

**Estimated Effort:** 1-2 hours

### Test: nightly backups (30 days)

**File:** `tests/integration/operational-gates.ts`

**Tasks to make this test pass:**
1. Document nightly backups with 30-day retention in `docs/RELEASE_GATES.md`.
2. Run test: `pnpm tsx tests/integration/operational-gates.ts`
3. ✅ Test passes (green phase)

**Estimated Effort:** 0.5-1 hour

### Test: weekly full backups (12 weeks)

**File:** `tests/integration/operational-gates.ts`

**Tasks to make this test pass:**
1. Document weekly full backups with 12-week retention in `docs/RELEASE_GATES.md`.
2. Run test: `pnpm tsx tests/integration/operational-gates.ts`
3. ✅ Test passes (green phase)

**Estimated Effort:** 0.5-1 hour

### Test: monthly restore drill

**File:** `tests/integration/operational-gates.ts`

**Tasks to make this test pass:**
1. Document monthly restore drills in `docs/RELEASE_GATES.md`.
2. Run test: `pnpm tsx tests/integration/operational-gates.ts`
3. ✅ Test passes (green phase)

**Estimated Effort:** 0.5-1 hour

### Test: disk utilization alert at 80%

**File:** `tests/integration/operational-gates.ts`

**Tasks to make this test pass:**
1. Document disk utilization alert at 80% in `docs/RELEASE_GATES.md`.
2. Run test: `pnpm tsx tests/integration/operational-gates.ts`
3. ✅ Test passes (green phase)

**Estimated Effort:** 0.5-1 hour

### Test: IO wait alert >20% for 5 minutes

**File:** `tests/integration/operational-gates.ts`

**Tasks to make this test pass:**
1. Document IO wait alert >20% for 5 minutes in `docs/RELEASE_GATES.md`.
2. Run test: `pnpm tsx tests/integration/operational-gates.ts`
3. ✅ Test passes (green phase)

**Estimated Effort:** 0.5-1 hour

### Test: cutover runbook reference

**File:** `tests/integration/operational-gates.ts`

**Tasks to make this test pass:**
1. Link to `CUTOVER.md` and/or `MIGRATION.md` in `docs/RELEASE_GATES.md`.
2. Run test: `pnpm tsx tests/integration/operational-gates.ts`
3. ✅ Test passes (green phase)

**Estimated Effort:** 0.5-1 hour

### Test: parity checks reference

**File:** `tests/integration/operational-gates.ts`

**Tasks to make this test pass:**
1. Document parity checks reference (Epic 6) in `docs/RELEASE_GATES.md`.
2. Run test: `pnpm tsx tests/integration/operational-gates.ts`
3. ✅ Test passes (green phase)

**Estimated Effort:** 0.5-1 hour

---

## Running Tests

```bash
# Recommended (CI parity)
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/operational-gates.ts

# Local red-phase verification
pnpm tsx tests/integration/operational-gates.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ Tests written and executed
- ✅ Failure is due to missing `docs/RELEASE_GATES.md`

### GREEN Phase (DEV Team - Next Steps)

1. Create `docs/RELEASE_GATES.md` with all operational gates.
2. Add CI hook to run the operational gates test.
3. Run test after each change until green.

### REFACTOR Phase (DEV Team)

Refactor documentation structure only after tests pass. Preserve all required gates and references.

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

**Command:** `pnpm tsx tests/integration/operational-gates.ts`

**Results:**

```
AssertionError [ERR_ASSERTION]: Expected docs/RELEASE_GATES.md to exist for release-gate enforcement
    at assertReleaseGatesFileExists (/Users/jeremiahotis/Local Sites/voucher-system/app/public/wp-content/plugins/voucher-shyft/tests/integration/operational-gates.ts:15:10)
    at run (/Users/jeremiahotis/Local Sites/voucher-system/app/public/wp-content/plugins/voucher-shyft/tests/integration/operational-gates.ts:103:3)
    at assert (/Users/jeremiahotis/Local Sites/voucher-system/app/public/wp-content/plugins/voucher-shyft/tests/integration/operational-gates.ts:115:1)
    at Object.<anonymous> (/Users/jeremiahotis/Local Sites/voucher-system/app/public/wp-content/plugins/voucher-shyft/tests/integration/operational-gates.ts:118:2)
```

**Summary:**

- Total tests: 8
- Passing: 0 (expected)
- Failing: 1 (expected)
- Status: ✅ RED phase verified (blocked by missing release gates doc)

---

## Notes

- This story is release-blocking; CI must execute the operational gates test to enforce the gate.
- Docker-based run may pass if a cached image contains an older `docs/RELEASE_GATES.md`; use a fresh build for CI parity.

---

**Generated by BMad TEA Agent** - 2026-02-10
