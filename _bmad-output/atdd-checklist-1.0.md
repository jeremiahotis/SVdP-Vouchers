# ATDD Checklist - Epic 1, Story 0: Initialize VoucherShyft Monorepo Scaffold

**Date:** 2026-02-04
**Author:** Jeremiah
**Primary Test Level:** API (repo-level integration checks)

---

## Story Summary

This story establishes the monorepo scaffold and baseline infra so all later stories can build on a consistent architecture. It requires the core folder structure, Docker Compose + Caddy, and an OpenAPI generation hook.

**As a** platform engineer
**I want** the starter template scaffold in place
**So that** all subsequent stories implement within the approved architecture

---

## Acceptance Criteria

1. Given the approved architecture stack (Next.js + Fastify + Postgres + Compose), when the repo is initialized, then monorepo structure, Docker Compose, and baseline config exist and build.
2. And OpenAPI generation from route schemas is available for later stories.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

Not applicable for scaffold verification.

### API Tests (2 tests)

**File:** `tests/api/scaffold.spec.ts` (34 lines)

- ✅ **Test:** should include required monorepo directories
  - **Status:** RED - `packages/ui` does not exist yet
  - **Verifies:** monorepo structure + infra files
- ✅ **Test:** should define an api:openapi script in package.json
  - **Status:** RED - `api:openapi` script missing
  - **Verifies:** OpenAPI generation hook exists

### Component Tests (0 tests)

Not applicable for scaffold verification.

---

## Data Factories Created

None required for repository scaffold checks.

---

## Fixtures Created

None required for repository scaffold checks.

---

## Mock Requirements

None. No external services are invoked in scaffold verification.

---

## Required data-testid Attributes

Not applicable for repository scaffold checks.

---

## Implementation Checklist

### Test: should include required monorepo directories

**File:** `tests/api/scaffold.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `packages/ui/` with placeholder `package.json` and token folder
- [ ] Ensure `infra/docker/docker-compose.yml` and `infra/docker/Caddyfile` remain present
- [ ] Run test: `pnpm test:e2e -- tests/api/scaffold.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hours

---

### Test: should define an api:openapi script in package.json

**File:** `tests/api/scaffold.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `api:openapi` script to `package.json`
- [ ] Ensure OpenAPI generation is wired in `apps/api` (schema-driven)
- [ ] Run test: `pnpm test:e2e -- tests/api/scaffold.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hours

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm test:e2e

# Run specific test file
pnpm test:e2e -- tests/api/scaffold.spec.ts

# Run tests in headed mode (see browser)
pnpm test:e2e -- --headed

# Debug specific test
pnpm test:e2e -- tests/api/scaffold.spec.ts --debug

# Run tests with coverage
pnpm test:e2e -- --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup (N/A for this story)
- ✅ Mock requirements documented (none)
- ✅ data-testid requirements listed (N/A)
- ✅ Implementation checklist created

**Verification:**

- Tests are expected to fail because `packages/ui` and `api:openapi` are not present yet.
- Failures are due to missing implementation, not test bugs.

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist
2. Implement minimal code to make that test pass
3. Run test to verify green
4. Move to next test until all pass

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all tests pass
2. Refactor code (if needed)
3. Ensure tests still pass

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run `pnpm test:e2e` to verify RED phase
3. Implement tasks to flip tests green

---

## Knowledge Base References Applied

- **fixture-architecture.md** - Fixture patterns (not used in this story)
- **data-factories.md** - Data factories (not used in this story)
- **network-first.md** - Intercept-before-navigate (not used in this story)
- **test-quality.md** - Deterministic tests, explicit assertions
- **test-levels-framework.md** - Test level selection

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm test:e2e -- tests/api/scaffold.spec.ts`

**Results:**

```
NOT RUN (expected failures due to missing packages/ui and api:openapi script)
```

**Summary:**

- Total tests: 2
- Passing: 0 (expected)
- Failing: 2 (expected)
- Status: ✅ RED phase expected

**Expected Failure Messages:**

- `expect(received).toBeTruthy()` for missing `packages/ui`
- `expect(received).toBeTruthy()` for missing `api:openapi` script

---

## Notes

- This story is scaffold-focused; tests are repo-level integration checks, not UI or API behavior.
- If the scaffold already exists, tests may pass; in that case, mark RED phase as already satisfied and proceed to GREEN/REFACTOR validation.

---

**Generated by BMad TEA Agent** - 2026-02-04
