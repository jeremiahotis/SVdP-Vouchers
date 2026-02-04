# System-Level Test Design

**Date:** 2026-02-04
**Author:** Jeremiah
**Status:** Draft

---

## Testability Assessment

- **Controllability: CONCERNS**
  - Tenant context is host + JWT derived only; tests must control host routing and JWT claims deterministically.
  - Requires reliable seeding of `platform.tenants` and `platform.tenant_apps` plus membership/role fixtures.
  - Error and refusal states need deterministic triggers (e.g., host/JWT mismatch, app disabled, not-a-member).

- **Observability: CONCERNS**
  - Correlation IDs and refusal/error split metrics are required but must be validated in CI and staging.
  - Audit events are mandated for issuance/override/redemption/config changes; need test hooks for audit validation.

- **Reliability: CONCERNS**
  - Idempotency (redemption, migration import) and refusal/error semantics are central; require deterministic replay tests.
  - Single-droplet Postgres and cutover constraints demand dedicated reliability checks (backup/restore drills, migration parity).

---

## Architecturally Significant Requirements (ASRs)

| ASR ID | Requirement | Category | Probability | Impact | Score | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| ASR-01 | Tenant isolation via host + JWT match only (no tenant in request body/query) | SEC/TECH | 2 | 3 | 6 | Core isolation; cross-tenant leakage is unacceptable. |
| ASR-02 | Refusal contract (HTTP 200 `{ success:false, reason }`) and refusal/error metrics split | BUS/OPS | 2 | 3 | 6 | Needed for predictable UX + observability. |
| ASR-03 | Redemption idempotency on `(tenant_id, voucher_id)` | DATA | 2 | 3 | 6 | Prevents double redemption; critical POS behavior. |
| ASR-04 | Performance p95: redeem ≤ 1.5s, issue ≤ 2.0s, lookup ≤ 1.5s at ≥25 concurrent users | PERF | 2 | 3 | 6 | Core experience and NFR targets. |
| ASR-05 | 30-day WP read-only window with **0 successful legacy writes** | OPS/DATA | 2 | 3 | 6 | Cutover success gate. |
| ASR-06 | Audit trail append-only with correlation IDs | SEC/OPS | 2 | 2 | 4 | Compliance + troubleshooting. |
| ASR-07 | Postgres-on-droplet operational gates (backups + restore drills + disk/IO alerts) | OPS | 2 | 2 | 4 | Reliability risk on single droplet. |

---

## Test Levels Strategy

**Recommended split (web + API, multi-tenant):**
- **Unit: 45%** – Business logic, identity key normalization, duplicate detection policy, refusal mapping.
- **Integration/API: 35%** – Fastify routes, tenancy middleware, DB constraints, idempotency, audit writes.
- **E2E: 20%** – Critical user journeys (cashier redemption, steward issuance, tenant switching), refusal vs error UX states.

Rationale: API/DB boundaries carry the highest risk for tenancy, idempotency, and refusal semantics. UI E2E tests validate core flows and refusal messaging without over-relying on brittle UI coverage.

---

## NFR Testing Approach

- **Security**
  - Auth/authz: host/JWT mismatch, not-a-member, disabled-app (TENANT_NOT_FOUND).
  - Tenant isolation tests in CI against real Postgres.
  - OWASP baseline checks for input sanitization (no free-text fields, structured inputs).

- **Performance**
  - Load and latency testing for redeem/issue/lookup at ≥25 concurrent users.
  - Validate p95 targets (redeem ≤1.5s, issue ≤2.0s, lookup ≤1.5s).

- **Reliability**
  - Idempotent redemption replay tests (same voucher/receipt). 
  - Refusal vs error handling; retry safety; correlation_id presence.
  - Migration parity checks and read-only WP enforcement tests.

- **Maintainability**
  - Coverage gates for critical paths (tenancy, issuance, redemption, overrides).
  - CI validation for structured logs + correlation IDs.

---

## Test Environment Requirements

- **Staging environment** with same-origin host routing per tenant and valid JWT signing keys.
- **Seedable Postgres** with deterministic fixtures for tenants, memberships, vouchers, redemptions.
- **Controlled host routing** for multi-tenant tests (e.g., `tenant-a.voucher.*`, `tenant-b.voucher.*`).
- **Migration test harness** that can import/export in isolation and produce parity reports.
- **Observability hooks**: access to logs/metrics for refusal vs error and correlation IDs.

---

## Testability Concerns

- Host-based tenancy requires special handling in tests to avoid false positives from shared origins.
- Refusal vs error semantics must be consistently enforced across API + UI; drift is likely without contract tests.
- Migration parity and WP read-only enforcement are operational gates; must be tested in an environment that mirrors production constraints.

**Severity:** CONCERNS (no blockers, but must be addressed in Sprint 0 before implementation scale-up).

---

## Recommendations for Sprint 0

1. **Test data factories + seed helpers** for tenants, memberships, vouchers, redemptions.
2. **Host/JWT testing utilities** to simulate tenant context and mismatch scenarios deterministically.
3. **CI test stages**: unit → integration/API → E2E smoke.
4. **Performance baseline** script and thresholds for p95 targets.
5. **Observability validation**: correlation_id present in all responses; refusal vs error metrics split.
6. **Migration parity harness** + WP read-only verification check.

---

**Output File:** `_bmad-output/test-design-system.md`
