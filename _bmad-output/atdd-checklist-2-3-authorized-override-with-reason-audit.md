# ATDD Checklist - Epic 2, Story 2.3: Authorized Override with Reason Audit

**Date:** 2026-02-13
**Author:** Jeremiah
**Primary Test Level:** API Integration

---

## Story Summary

Story 2.3 introduces a privileged override path for duplicate-policy denials so authorized tenant roles can proceed only when they provide a reason. The behavior must preserve FR0 refusal semantics for disallowed actors and persist append-only audit records for approved overrides. The implementation must remain tenant-scoped and correlation-aware.

**As a** authorized steward or admin  
**I want** to override duplicate refusals with a required reason  
**So that** policy exceptions are explicit, controlled, and auditable.

---

## Acceptance Criteria

1. Given a duplicate refusal/warning eligible for override, when an authorized role submits an override with a required reason, issuance proceeds and the override reason is captured in append-only audit events.
2. Unauthorized users or partner tokens attempting an override are refused with FR0 envelope semantics.
3. Override attempts always retain tenant scope and correlation_id telemetry.
4. Override behavior is explicit in API responses (authorized proceed vs refusal outcome).

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

Not required for this story. Scope is route/domain behavior and audit persistence.

### API Tests (5 tests)

**File:** `tests/integration/voucher-override-with-reason.ts` (342 lines)

- ✅ **Test:** Authorized override issues voucher when duplicate warning exists
  - **Status:** RED - Route currently returns refusal path/no override contract handling
  - **Verifies:** AC1 and AC4 (authorized proceed path)
- ✅ **Test:** Successful override writes append-only audit event with reason + correlation_id
  - **Status:** RED - `voucher.issuance.override` event not emitted today
  - **Verifies:** AC1 and AC3 (audit reason persistence, telemetry)
- ✅ **Test:** Missing override reason is refused with FR0 envelope
  - **Status:** RED - override payload contract/validation not implemented
  - **Verifies:** AC2 and AC4 (invalid override refusal semantics)
- ✅ **Test:** Unauthorized JWT role override is refused
  - **Status:** RED - explicit role allowlist gate not implemented for override flow
  - **Verifies:** AC2 and AC3 (role denial + correlation_id)
- ✅ **Test:** Partner-token override is refused
  - **Status:** RED - partner override refusal gate not implemented
  - **Verifies:** AC2 and AC3 (partner refusal + correlation_id)

### Component Tests (0 tests)

Not applicable. No standalone UI component change in this story scope.

---

## Data Factories Created

### Voucher Override Factory

**File:** `tests/support/fixtures/factories/voucher-override-factory.ts`

**Exports:**

- `createVoucherIssueBody(overrides?)` - base issuance payload fixture
- `createVoucherOverrideRequestBody(overrides?)` - override request payload with reason + duplicate reference

**Example Usage:**

```typescript
const payload = createVoucherOverrideRequestBody({
  override_reason: "Approved exception with documented policy reason",
  duplicate_reference_voucher_id: duplicateVoucherId,
});
```

---

## Fixtures Created

No new Playwright/Cypress fixture wrappers were added for this story slice. Existing Fastify+Knex test harness pattern is reused in the integration test file.

---

## Mock Requirements

No external third-party service mocks required. Existing local compose-backed Postgres and in-process Fastify route injection are sufficient for this story.

---

## Required data-testid Attributes

Not applicable for this API-first story. No UI selectors are required.

---

## Implementation Checklist

### Test: Authorized override issues voucher

**File:** `tests/integration/voucher-override-with-reason.ts`

**Tasks to make this test pass:**

- [ ] Extend issuance request contract to accept `override_reason` and `duplicate_reference_voucher_id`.
- [ ] Add override gate after duplicate-policy outcome (`warning`/`refusal`) and before issuance write.
- [ ] If actor is override-authorized and payload is valid, continue issuance path.
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/integration/voucher-override-with-reason.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2.0 hours

---

### Test: Override audit reason persistence

**File:** `tests/integration/voucher-override-with-reason.ts`

**Tasks to make this test pass:**

- [ ] Write append-only audit event `voucher.issuance.override` on successful override issuance.
- [ ] Persist `reason`, `actor_id`, `tenant_id`, and `correlation_id` in audit record.
- [ ] Include duplicate reference metadata in audit metadata payload.
- [ ] Run test command above.
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Missing reason refusal

**File:** `tests/integration/voucher-override-with-reason.ts`

**Tasks to make this test pass:**

- [ ] Validate override reason: required, trimmed, max length bounded.
- [ ] Return FR0 refusal envelope (HTTP 200, `success:false`, `reason`, `correlation_id`) for invalid override payload.
- [ ] Reuse refusal constants for invalid/unauthorized attempts.
- [ ] Run test command above.
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: Unauthorized JWT role refusal

**File:** `tests/integration/voucher-override-with-reason.ts`

**Tasks to make this test pass:**

- [ ] Introduce explicit override role allowlist in code (tenant-scoped).
- [ ] Ensure non-allowlisted actor receives FR0 refusal and no issuance side effects.
- [ ] Ensure refusal telemetry includes `correlation_id`.
- [ ] Run test command above.
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: Partner-token override refusal

**File:** `tests/integration/voucher-override-with-reason.ts`

**Tasks to make this test pass:**

- [ ] Block partner-token override requests by default.
- [ ] Return FR0 refusal envelope with `NOT_AUTHORIZED_FOR_ACTION`.
- [ ] Ensure no override-success audit event is written for partner flow.
- [ ] Run test command above.
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

## Running Tests

```bash
# Run all failing tests for Story 2.3
docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/integration/voucher-override-with-reason.ts

# Run duplicate-policy baseline suite for regression context
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/voucher-duplicate-policy-window.ts

# Run admin integration suite
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin

# Run tenant-isolation suite
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ Story acceptance criteria mapped to API-level acceptance tests.
- ✅ Failing test file created with Given-When-Then comments and deterministic setup.
- ✅ Factory support created for override payload consistency.
- ✅ Initial compose-backed RED execution captured.

### GREEN Phase (DEV Team)

1. Implement override payload contract and validation.
2. Implement explicit authorization + partner-token deny logic.
3. Implement override issuance and append-only audit event.
4. Re-run story test until green.

### REFACTOR Phase (DEV Team)

1. Reduce duplication between duplicate-policy and override handling.
2. Keep refusal envelope behavior centralized.
3. Keep tests deterministic and parallel-safe.

---

## Next Steps

1. Share this checklist and failing test file with the dev workflow.
2. Implement one checklist section at a time (contract → auth gate → audit).
3. Re-run story test command after each increment.
4. After green, run full compose suites (`test:admin`, `test:tenant`).

---

## Knowledge Base References Applied

- `data-factories.md` - dynamic override payload generation pattern
- `fixture-architecture.md` - setup/cleanup responsibility boundaries
- `test-quality.md` - deterministic API test design and RED criteria
- `test-healing-patterns.md` - anti-flake failure pattern planning
- `selector-resilience.md` - documented as N/A for API-only scope
- `timing-debugging.md` - deterministic waits and no hard waits
- `test-levels-framework.md` - API level chosen over E2E for this story
- `network-first.md` - applied conceptually to deterministic route behavior and response-driven assertions

**Official docs cross-check (current references):**
- Playwright Mock APIs: https://playwright.dev/docs/mock
- Playwright Assertions: https://playwright.dev/docs/api/class-playwrightassertions
- Cypress `intercept`: https://docs.cypress.io/api/commands/intercept
- Cypress `wait`: https://docs.cypress.io/api/commands/wait
- Pact provider verification: https://docs.pact.io/getting_started/provider_verification
- GitHub Actions workflow syntax/reference: https://docs.github.com/en/actions/reference/workflows-and-actions

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:**

```bash
docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/integration/voucher-override-with-reason.ts
```

**Results:**

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

false !== true

    at run (/app/tests/integration/voucher-override-with-reason.ts:235:12)
```

**Summary:**

- Total tests/scenarios in script: 5
- Passing: 0 (expected during RED)
- Failing: 5 (expected during RED; execution stops at first failing assertion)
- Status: ✅ RED phase verified

**Expected Failure Messages (until implementation exists):**

- Authorized override path returns refusal instead of success issuance.
- Override-specific audit event `voucher.issuance.override` absent.
- Override payload fields rejected or ignored by current contract/route logic.
- Unauthorized/partner override semantics not yet explicit in issuance route.

---

## Notes

- This ATDD slice intentionally targets API-level behavior only; no UI automation was added.
- Story implementation should keep refusal/error split from Story 1.3 and append-only audit behavior from Story 1.4.
- Partner-token override is intentionally denied by default per Story 2.3 scope.

---

**Generated by BMad TEA Agent** - 2026-02-13
