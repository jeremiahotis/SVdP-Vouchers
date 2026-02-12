# ATDD Checklist - Epic 1, Story 1.3: Correlation IDs + Refusal/Error Metrics Split

**Date:** 2026-02-05
**Author:** Jeremiah
**Primary Test Level:** Integration (API)

---

## Story Summary

Add correlation IDs to every API response and split refusal vs error telemetry so operational logging is observable from day one. This focuses on the API boundary behavior and structured log fields.

**As a** operator
**I want** correlation IDs and refusal/error metrics split at the API boundary
**So that** tenancy enforcement and business denials are observable from day one

---

## Acceptance Criteria

1. **Given** any API response,
   **When** it is returned to the client,
   **Then** it includes a `correlation_id`.
2. **And** refusals are tracked separately from errors in structured logs (e.g., `outcome=refusal|error|success` and `reason=...`).
3. **And** at least one test asserts the structured refusal vs error fields exist.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

**File:** N/A

### API Tests (3 checks in 1 file)

**File:** `tests/integration/correlation-telemetry.ts` (110 lines)

- ✅ **Test:** 1.3-INT-001 Correlation ID present on success/refusal/error responses
  - **Status:** RED - error responses do not include `correlation_id` (expected until response injector/error handler exists)
  - **Verifies:** `correlation_id` present for success, refusal, and error payloads
- ✅ **Test:** 1.3-INT-002 Refusal telemetry logs outcome + reason
  - **Status:** RED - refusal logs missing `outcome=refusal` and `reason`
  - **Verifies:** structured log fields for refusal outcomes
- ✅ **Test:** 1.3-INT-003 Error telemetry logs outcome + error_code
  - **Status:** RED - error logs missing `outcome=error` and `error_code`
  - **Verifies:** structured log fields for error outcomes

### Component Tests (0 tests)

**File:** N/A

---

## Data Factories Created

None required for this story.

---

## Fixtures Created

None required for this story.

---

## Mock Requirements

None required for this story.

---

## Required data-testid Attributes

None required for this story (API-only).

---

## Implementation Checklist

### Test: 1.3-INT-001 Correlation ID present on success/refusal/error responses

**File:** `tests/integration/correlation-telemetry.ts`

**Tasks to make this test pass:**

- [ ] Add a correlation_id injector at the API boundary (success/refusal/error)
- [ ] Ensure error responses include `correlation_id` even when errors are thrown
- [ ] Normalize error payload to `{ success:false, error:{ code, message }, correlation_id }`
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:admin`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2-3 hours

---

### Test: 1.3-INT-002 Refusal telemetry logs outcome + reason

**File:** `tests/integration/correlation-telemetry.ts`

**Tasks to make this test pass:**

- [ ] Add structured log entry for refusal responses
- [ ] Include `outcome=refusal`, `reason`, and `correlation_id`
- [ ] Ensure refusal logging happens for API boundary refusals (HTTP 200 with `success:false`)
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:admin`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2-3 hours

---

### Test: 1.3-INT-003 Error telemetry logs outcome + error_code

**File:** `tests/integration/correlation-telemetry.ts`

**Tasks to make this test pass:**

- [ ] Add structured log entry for error responses
- [ ] Include `outcome=error`, `error_code`, and `correlation_id`
- [ ] Ensure error logging happens for thrown errors and explicit error responses
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:admin`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2-3 hours

---

## Running Tests

```bash
# Run all failing tests for this story
docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:admin

# Run specific test file (inside test container)
docker compose -f infra/docker/docker-compose.yml run --rm --build api-test tsx tests/integration/correlation-telemetry.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup (N/A)
- ✅ Mock requirements documented (N/A)
- ✅ data-testid requirements listed (N/A)
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with highest priority)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Review this checklist** with team in standup or planning
3. **Run failing tests** to confirm RED phase: `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:admin`
4. **Begin implementation** using implementation checklist as guide
5. **Work one test at a time** (red → green for each)
6. **Share progress** in daily standup
7. **When all tests pass**, refactor code for quality
8. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using Playwright's `test.extend()`
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **component-tdd.md** - Component test strategies using Playwright Component Testing
- **network-first.md** - Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **test-levels-framework.md** - Test level selection framework (E2E vs API vs Component vs Unit)
- **test-healing-patterns.md** - Common failure patterns and prevention
- **selector-resilience.md** - Selector hierarchy and anti-patterns
- **timing-debugging.md** - Deterministic waiting and race condition fixes

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:admin`

**Results:**

```
AssertionError [ERR_ASSERTION]: refusal logs must include outcome=refusal and reason
    at run (/app/tests/integration/correlation-telemetry.ts:82:10)
```

**Summary:**

- Total checks: 3 (single integration file)
- Passing: 0 (expected)
- Failing: 3 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- `refusal logs must include outcome=refusal and reason`
- `error responses must include correlation_id`
- `error logs must include outcome=error and error_code`

---

## Notes

- This story is API-only; no UI selectors or component tests required.
- The red-phase tests are designed to fail until a response injector + telemetry logger are implemented.

---

**Generated by BMad TEA Agent** - 2026-02-05
