# ATDD Checklist - Epic 1, Story 1.1: Host-Based Tenant Resolution + Refusal Reasons

**Date:** 2026-02-05  
**Author:** Jeremiah  
**Primary Test Level:** Integration/API

---

## Story Summary

Tenant context must be derived from host + JWT only, with explicit refusal reasons and indistinguishable external envelopes for unknown host vs disabled app. This enforces tenant isolation without enumeration.

**As a** platform operator  
**I want** tenant context derived only from host + JWT and explicit refusal reasons  
**So that** tenant isolation is enforceable without enumeration

---

## Acceptance Criteria

1. Given a request to a tenant host matching `{tenant_slug}.voucher.{root_domain}`, when the host matches `platform.tenants.host` exactly and JWT tenant claim matches the resolved `tenant_id`, then the request executes in that tenant context and no tenant IDs are accepted from body/query.
2. Unknown host returns HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` with `correlation_id`.
3. Host/JWT mismatch returns HTTP 200 refusal `{ success:false, reason:"TENANT_CONTEXT_MISMATCH" }`.
4. Non-membership returns HTTP 200 refusal `{ success:false, reason:"NOT_A_MEMBER" }`.
5. Unknown host refusal does not differ in message shape or status from disabled-app refusal; tests verify identical external envelope/reason.
6. A tenant isolation test case is added covering the three refusal reasons.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

No E2E tests created for this story.

### API Tests (1 test)

**File:** `tests/tenant-isolation/host-based-tenant-refusal.ts` (225 lines)

- ✅ **Test:** `1.1-INT-001 host-based tenancy refusals and envelope parity`
  - **Status:** RED - `NOT_A_MEMBER` refusal not implemented; refusal constant missing.
  - **Verifies:** AC2, AC3, AC4, AC5, AC6

### Component Tests (0 tests)

No component tests created for this story.

---

## Data Factories Created

### Tenant Factory

**File:** `tests/support/fixtures/factories/tenant-factory.ts`

**Exports:**

- `createTenant(overrides?)` - Create `platform.tenants` record
- `createTenantApp(overrides?)` - Create `platform.tenant_apps` record
- `createMembership(overrides?)` - Create `memberships` record

**Example Usage:**

```typescript
const tenant = createTenant({ status: "active" });
const app = createTenantApp({ tenant_id: tenant.tenant_id, enabled: true });
const membership = createMembership({ tenant_id: tenant.tenant_id, actor_id: "actor-1" });
```

---

## Fixtures Created

No new fixtures created for this story.

---

## Mock Requirements

No external service mocks required for this story.

---

## Required data-testid Attributes

No UI selectors required for this story.

---

## Implementation Checklist

### Test: 1.1-INT-001 host-based tenancy refusals and envelope parity

**File:** `tests/tenant-isolation/host-based-tenant-refusal.ts`

**Tasks to make this test pass:**

- [ ] Add `NOT_A_MEMBER` to `packages/contracts/src/constants/refusal-reasons.ts`.
- [ ] Add `notAMember` to `apps/api/src/tenancy/refusal.ts` and export in `refusalReasons`.
- [ ] Implement membership lookup in tenancy flow:
- [ ] Add membership query helper (e.g., `apps/api/src/tenancy/membership.ts`) using `memberships` table.
- [ ] In `apps/api/src/tenancy/hook.ts`, return HTTP 200 refusal `NOT_A_MEMBER` when actor has no membership for resolved tenant.
- [ ] Ensure refusal envelope includes `correlation_id` in all paths.
- [ ] Run test: `pnpm test:tenant`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3-5 hours

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm test:tenant

# Run specific test file
tsx tests/tenant-isolation/host-based-tenant-refusal.ts

# Run tests in headed mode (not applicable)
# N/A

# Debug specific test (not applicable)
# N/A

# Run tests with coverage (not applicable)
# N/A
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ Tests written and expected to fail (membership + refusal constants not implemented)
- ✅ Data factories created with overrides
- ✅ Mock requirements documented
- ✅ Implementation checklist created

**Verification:**

- Tests not executed in this run.
- Expected failure point: non-membership refusal and missing refusal constants.

---

### GREEN Phase (DEV Team - Next Steps)

1. Implement membership lookup and refusal reason constants.
2. Run `pnpm test:tenant` until green.
3. Refactor for clarity and reuse (helpers for tenant/membership checks).

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Extract shared tenancy helpers if repeated.
2. Maintain refusal envelope consistency.
3. Keep tests deterministic and isolated.

---

## Next Steps

1. Share this checklist with dev workflow.
2. Run `pnpm test:tenant` to confirm RED phase.
3. Implement checklist tasks in order.

---

## Knowledge Base References Applied

- `fixture-architecture.md`
- `data-factories.md`
- `network-first.md`
- `test-quality.md`
- `test-levels-framework.md`
- `selector-resilience.md`
- `timing-debugging.md`
- `test-healing-patterns.md`
- `component-tdd.md`

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm test:tenant`

**Results:**

```
Not run in this session.
```

**Summary:**

- Total tests: 1
- Passing: 0 (expected once run)
- Failing: 1 (expected once run)
- Status: RED phase pending execution

**Expected Failure Messages:**

- `AssertionError: expected NOT_A_MEMBER refusal` (membership enforcement missing)
- `AssertionError: refusalReasons.notAMember missing` (constant not defined)

---

## Notes

- AC1 (host/JWT match + ignore tenant_id from body/query) appears implemented in `apps/api/src/tenancy/hook.ts` and will be validated as part of integration once membership enforcement is added.
- This story’s tests are API-level and do not require UI test IDs.
- `pnpm test:tenant` now includes both tenant resolution and host-based refusal tests.

---

**Generated by BMad TEA Agent** - 2026-02-05
