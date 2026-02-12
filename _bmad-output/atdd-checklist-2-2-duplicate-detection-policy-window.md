# ATDD Checklist - Epic 2, Story 2: Duplicate Detection (Policy Window)

**Date:** 2026-02-12
**Author:** Jeremiah
**Primary Test Level:** API (integration + tenant-isolation)

---

## Story Summary

This story adds duplicate-detection governance before voucher issuance state mutation, using a configurable policy window and canonical identity matching. It must behave consistently across steward JWT and partner-token issuance paths while preserving strict tenant isolation and FR0 refusal envelope semantics.

**As a** steward or partner agent  
**I want** duplicate detection during issuance  
**So that** policy is enforced consistently across partners and staff

---

## Acceptance Criteria

1. Given an issuance request within the configured duplicate policy window, when a duplicate is detected using defined criteria (`voucher_type` + identity key), then the system returns a refusal or warning per policy.
2. Duplicate checks are tenant-scoped only and never leak cross-tenant data.
3. Partner-token and JWT issuance paths use the same duplicate policy engine.
4. Refusal/warning responses follow standard FR0 envelope semantics with `correlation_id`.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

**File:** `N/A`

- ✅ **Test:** N/A  
  - **Status:** RED - E2E deferred; Story 2.2 risk is primarily API policy and tenancy boundaries  
  - **Verifies:** N/A

### API Tests (4 tests)

**File:** `tests/integration/voucher-duplicate-policy-window.ts` (planned)

- ✅ **Test:** `steward issuance refuses in-window duplicate for same voucher_type + normalized identity key`  
  - **Status:** RED - duplicate policy engine not yet wired into issuance flow  
  - **Verifies:** AC1 refusal branch with deterministic in-window matching

- ✅ **Test:** `issuance allows request outside duplicate window`  
  - **Status:** RED - boundary-window evaluation not implemented  
  - **Verifies:** AC1 non-duplicate/out-of-window success path with explicit boundary assertion

- ✅ **Test:** `partner-token issuance applies identical duplicate policy outcomes`  
  - **Status:** RED - partner and steward paths not yet sharing duplicate policy engine  
  - **Verifies:** AC3 parity between auth modes

- ✅ **Test:** `duplicate refusal/warning envelope includes success:false, reason, correlation_id`  
  - **Status:** RED - duplicate-specific refusal/warning reason mapping not implemented  
  - **Verifies:** AC4 FR0 envelope consistency for duplicate outcomes

### Component Tests (0 tests)

**File:** `N/A`

- ✅ **Test:** N/A  
  - **Status:** RED - no Story 2.2 component scope  
  - **Verifies:** N/A

### Tenant-Isolation Tests (1 test)

**File:** `tests/tenant-isolation/voucher-duplicate-policy-window.ts` (planned)

- ✅ **Test:** `duplicate lookup remains tenant-scoped and never discloses cross-tenant matches`  
  - **Status:** RED - duplicate query tenancy predicates not implemented for this story  
  - **Verifies:** AC2 no cross-tenant data leakage

---

## Data Factories Created

No new factories required for checklist phase.

**Reuse existing factories/patterns:**

- `tests/support/fixtures/factories/tenant-factory.ts`
- inline payload builders from `tests/integration/voucher-issuance.ts`

**Factory additions required during implementation:**

- `createVoucherAuthorizationSnapshot(overrides?)` for deterministic identity-key seeding
- `createDuplicateWindowScenario({ issuedAt, now, windowDays })` helper for boundary tests

---

## Fixtures Created

No new fixture files created in checklist phase.

**Fixture pattern to follow (implementation phase):**

- Use per-test setup/cleanup with deterministic seeding and teardown in each integration script
- Keep tenant and membership setup isolated per test run
- Reuse `seedTenant` style helpers from existing integration tests

---

## Mock Requirements

No external third-party mocks required; this story is DB + API domain behavior.

**Required deterministic controls:**

- Stable time source for policy-window boundary tests (injectable clock or explicit timestamps)
- Explicit seeded vouchers/authorizations for duplicate candidates

---

## Required data-testid Attributes

No `data-testid` requirements for Story 2.2 (API/domain scope only).

---

## Implementation Checklist

### Test: steward issuance refuses in-window duplicate for same voucher_type + normalized identity key

**File:** `tests/integration/voucher-duplicate-policy-window.ts`

**Tasks to make this test pass:**

- [ ] Implement duplicate policy contract (window + key shape) in shared constants/contracts
- [ ] Implement identity-key normalization (case/whitespace/date canonicalization)
- [ ] Add tenant-scoped duplicate query in `apps/api/src/vouchers/duplicate/`
- [ ] Run duplicate check before issuance mutation in steward issuance path
- [ ] Return refusal/warning reason codes via FR0 envelope
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test tsx tests/integration/voucher-duplicate-policy-window.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2.0 hours

---

### Test: issuance allows request outside duplicate window

**File:** `tests/integration/voucher-duplicate-policy-window.ts`

**Tasks to make this test pass:**

- [ ] Define boundary semantics (inclusive/exclusive) and codify in duplicate evaluator
- [ ] Add deterministic boundary coverage for exact window edge and just-outside edge
- [ ] Ensure out-of-window issuance proceeds through existing issuance success path
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test tsx tests/integration/voucher-duplicate-policy-window.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: partner-token issuance applies identical duplicate policy outcomes

**File:** `tests/integration/voucher-duplicate-policy-window.ts`

**Tasks to make this test pass:**

- [ ] Reuse same duplicate evaluator for partner-token issuance (`apps/api/src/partner/issuance.ts`)
- [ ] Preserve partner-agency constraints while applying tenant-scoped duplicate checks
- [ ] Ensure reason-code parity between steward and partner-token duplicate outcomes
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test tsx tests/integration/voucher-duplicate-policy-window.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: duplicate refusal/warning envelope includes success:false, reason, correlation_id

**File:** `tests/integration/voucher-duplicate-policy-window.ts`

**Tasks to make this test pass:**

- [ ] Ensure duplicate outcomes return FR0 refusal semantics (HTTP 200 + envelope)
- [ ] Include `correlation_id` in body and maintain `x-correlation-id` header propagation
- [ ] Add duplicate reason constants to contracts if missing
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test tsx tests/integration/voucher-duplicate-policy-window.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: duplicate lookup remains tenant-scoped and never discloses cross-tenant matches

**File:** `tests/tenant-isolation/voucher-duplicate-policy-window.ts`

**Tasks to make this test pass:**

- [ ] Enforce tenant predicates in all duplicate-lookup queries
- [ ] Verify no cross-tenant rows can trigger duplicate refusal/warning
- [ ] Validate refusal payload does not disclose external tenant identity details
- [ ] Run test: `docker compose -f infra/docker/docker-compose.yml run --rm api-test tsx tests/tenant-isolation/voucher-duplicate-policy-window.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

## Running Tests

```bash
# Story 2.2 integration tests (RED/GREEN)
docker compose -f infra/docker/docker-compose.yml run --rm api-test tsx tests/integration/voucher-duplicate-policy-window.ts

# Story 2.2 tenant-isolation tests
docker compose -f infra/docker/docker-compose.yml run --rm api-test tsx tests/tenant-isolation/voucher-duplicate-policy-window.ts

# Full required suite before merge
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ Acceptance criteria decomposed into failing test intent
- ✅ Primary test level selected (API + tenant-isolation)
- ✅ Required fixtures/factories/mocks documented
- ✅ Implementation checklist created and mapped to ACs

**Verification:**

- Planned failures are due to missing duplicate-policy implementation (not test harness defects)
- FR0 envelope + tenancy constraints are explicitly covered

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Implement duplicate policy contract + normalization
2. Wire duplicate evaluation into steward and partner-token issuance flows
3. Add tenant-isolated duplicate query behavior
4. Implement/execute Story 2.2 tests until green

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Extract duplicate-policy evaluator for single-source behavior
2. Remove duplication across steward/partner issuance orchestration
3. Keep tests deterministic (no hard waits, explicit setup/cleanup)

---

## Next Steps

1. Create `tests/integration/voucher-duplicate-policy-window.ts` with the 4 API acceptance tests above.
2. Create `tests/tenant-isolation/voucher-duplicate-policy-window.ts` for cross-tenant negative coverage.
3. Execute compose-backed test runs and capture first RED failures as implementation baseline.
4. Hand this checklist to DEV for Green-phase implementation.

---

## Knowledge Base References Applied

- **fixture-architecture.md** - isolate setup/teardown and compose reusable helpers
- **data-factories.md** - factory + override strategy for duplicate/boundary datasets
- **component-tdd.md** - reviewed; component coverage intentionally out of scope for Story 2.2
- **network-first.md** - reviewed; not primary for non-UI API tests in this story
- **test-quality.md** - deterministic boundaries, explicit assertions, isolated cleanup
- **test-levels-framework.md** - API + tenant-isolation selected as best fit for this AC set

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** Not executed in this checklist-only pass.

**Expected RED failures once tests are authored:**

- Duplicate in-window case currently issues or routes without duplicate refusal/warning
- Partner-token flow not yet guaranteed to use same duplicate evaluator as steward flow
- Duplicate-specific reason-code and boundary behavior not yet implemented
- Tenant-isolation negative matrix for duplicate lookup not yet present

**Summary:**

- Planned tests: 5 total (4 API + 1 tenant-isolation)
- Expected passing: 0 (before implementation)
- Expected failing: 5 (before implementation)
- Status: ✅ RED phase specified; test authoring/execution is next implementation step
