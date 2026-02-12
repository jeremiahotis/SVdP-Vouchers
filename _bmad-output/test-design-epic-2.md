# Test Design: Epic 2 - Voucher Issuance & Governance

**Date:** 2026-02-11
**Author:** Jeremiah
**Status:** Draft

---

## Executive Summary

**Scope:** full test design for Epic 2

**Risk Summary:**

- Total risks identified: 9
- High-priority risks (>=6): 6
- Critical categories: DATA, SEC, TECH

**Coverage Summary:**

- P0 scenarios: 14 (28 hours)
- P1 scenarios: 20 (20 hours)
- P2/P3 scenarios: 26 (11 hours)
- **Total effort**: 59 hours (~7.4 days)

---

## Risk Assessment

### High-Priority Risks (Score >=6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- | -------- |
| R-201 | TECH | Core voucher issuance path is not implemented yet (`apps/api/src/vouchers/` is empty), so Epic 2 has no production logic behind ACs. | 3 | 3 | 9 | Implement issuance service + route contracts first, then wire tests before feature expansion. | Dev Lead | Sprint start + 2 days |
| R-202 | DATA | Immutable authorization snapshot requirement (FR17) has no persistence model yet, creating risk of mutable authorization history. | 2 | 3 | 6 | Add snapshot persistence table/columns + immutability tests (no post-issuance mutation allowed). | Dev + DB Owner | Sprint start + 3 days |
| R-203 | SEC | Override/void authorization can be bypassed if role checks are inconsistent between JWT and partner-token paths. | 2 | 3 | 6 | Centralize authorization gate logic for override/void and add deny-by-default tests for partner tokens. | Dev Lead + QA | Sprint start + 3 days |
| R-204 | DATA | Duplicate detection accuracy risk (false positives/negatives) due missing canonical identity normalization and window boundary handling. | 2 | 3 | 6 | Introduce deterministic normalization rules + boundary tests for inclusive/exclusive window behavior. | Dev + QA | Sprint start + 4 days |
| R-205 | SEC | Cross-tenant leakage risk in duplicate lookup, status, and void endpoints if tenant predicates are missed. | 2 | 3 | 6 | Require tenant predicate in every voucher query + tenant-isolation test suite for Epic 2 endpoints. | Dev + QA | Sprint start + 2 days |
| R-206 | DATA | Invalid lifecycle transitions (voiding redeemed/already voided vouchers) may corrupt status history. | 2 | 3 | 6 | Enforce state machine invariants at domain layer + transition rejection tests + audit assertions. | Dev | Sprint start + 3 days |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ---------- | ----- |
| R-207 | BUS | FR0 refusal envelope drift (returning errors instead of business refusals) will break UX and telemetry split. | 2 | 2 | 4 | Route-boundary tests for refusal envelope + correlation_id on all Epic 2 denials. | QA |
| R-208 | PERF | Duplicate and status queries may miss p95 targets at scale without tenant + identity indexing strategy. | 2 | 2 | 4 | Add query-plan checks and performance smoke tests against seeded volume. | Dev + QA |
| R-209 | OPS | CI currently has no Epic 2 tests in `test:admin` matrix, enabling regressions to merge unnoticed. | 2 | 2 | 4 | Add Epic 2 test files to compose matrix scripts and enforce pass in required checks. | DevOps + QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
| ------- | -------- | ----------- | ----------- | ------ | ----- | ------ |
| None at this phase | - | Epic 2 scope is governance-heavy; identified risks are medium/high by default. | - | - | - | Monitor after first implementation slice |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (>=6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| FR16/FR17 issuance with immutable snapshot | API | R-201, R-202 | 4 | QA | Covers issued vs initiate-only outcomes and immutability assertion |
| FR21 duplicate refusal path | API | R-204 | 3 | QA | In-window duplicate refusal + deterministic identity key normalization |
| FR22/FR24 authorization gates (override/void deny) | API | R-203, R-205 | 3 | QA | Unauthorized JWT + partner-token denials with FR0 envelope |
| FR19 void transition guardrails | API | R-206 | 2 | QA | Reject illegal transitions (already voided/redeemed-policy constraints) |
| Critical journey sanity (issue -> duplicate -> override -> void status) | E2E | R-201, R-206 | 2 | QA | One steward journey + one refusal-first journey |

**Total P0**: 14 tests, 28 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| Partner-token issuance parity with steward flow | API | R-203, R-205 | 4 | QA | Same duplicate and allowed-type behavior across auth modes |
| Override with reason + append-only audit | API | R-203, R-207 | 4 | QA | Success path, reason required, audit fields including correlation_id |
| Void with reason + status visibility | API | R-206 | 4 | QA | Status updates to `voided`, reason capture, tenant scoping |
| Refusal envelope consistency across Epic 2 endpoints | API | R-207 | 3 | QA | HTTP 200 refusal + `success:false,reason,correlation_id` |
| UI lane behavior for governance prompts (override/void modal constraints) | Component | R-207 | 3 | Dev + QA | Reason required, context pinned, neutral refusal copy |
| Core issuance happy path with partner/steward personas | E2E | R-201 | 2 | QA | End-to-end smoke against seeded tenant contexts |

**Total P1**: 20 tests, 20 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
| ----------- | ---------- | --------- | ---------- | ----- | ----- |
| Identity normalization edge cases (whitespace/case/date formats) | Unit | R-204 | 6 | Dev | Pure normalization logic and duplicate key generation |
| Duplicate window boundaries (inclusive/exclusive timestamps) | Unit | R-204 | 4 | Dev | Deterministic clock-based tests |
| Query plan and indexing regression checks | API | R-208 | 3 | Dev + QA | Seeded load + tenant-filter query expectations |
| Cross-tenant negative matrix (lookup/void/override) | API | R-205 | 3 | QA | Ensure no leakage semantics across tenants |
| Error-handling branches (db failures, malformed payloads) | API | R-207 | 2 | QA | Preserve refusal vs error split under failures |

**Total P2**: 18 tests, 9 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
| ----------- | ---------- | ---------- | ----- | ----- |
| Extended multi-tenant chaos scenarios | E2E | 2 | QA | Fault-injection style exploratory journeys |
| Long-window duplicate-policy simulation | API | 2 | QA | Large date offsets and policy tune experiments |
| Contract tests for future service split (if voucher service extracted) | API/Contract | 2 | Dev + QA | Pact reserved for future multi-service boundary |
| Mutation copy/accessibility refinements for refusal messaging | Component | 2 | Dev | Non-blocking UX quality checks |

**Total P3**: 8 tests, 2 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Steward issues allowed voucher type successfully (API)
- [ ] Duplicate in-window request returns refusal envelope (API)
- [ ] Unauthorized partner-token override attempt is refused (API)
- [ ] Authorized void with reason updates status to `voided` (API)

**Total**: 4 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] FR16/17 issuance with immutable snapshot (API)
- [ ] FR21 duplicate refusal and boundary logic (API)
- [ ] FR22/24 override authorization denials (API)
- [ ] FR19 void transition invariants (API)
- [ ] Steward governance journey (E2E)
- [ ] Refusal-first governance journey (E2E)

**Total**: 14 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] Partner-token parity scenarios (API)
- [ ] Override success + audit evidence (API)
- [ ] Void reason + tenant-scoped lookup status (API)
- [ ] Refusal envelope consistency matrix (API)
- [ ] Governance UI component constraints (Component)

**Total**: 20 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] Identity normalization and duplicate-key edge cases (Unit)
- [ ] Query/index performance regression checks (API)
- [ ] Cross-tenant negative matrix expansion (API)
- [ ] Exploratory governance and resiliency scenarios (E2E/API)

**Total**: 26 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
| -------- | ----- | ---------- | ----------- | ----- |
| P0 | 14 | 2.0 | 28 | Critical path + authorization invariants |
| P1 | 20 | 1.0 | 20 | Governance flows and audit validation |
| P2 | 18 | 0.5 | 9 | Edge-case hardening |
| P3 | 8 | 0.25 | 2 | Exploratory and future-proofing |
| **Total** | **60** | **-** | **59** | **~7.4 days** |

### Prerequisites

**Test Data:**

- Tenant/member/role/voucher factories under `tests/support/fixtures/factories/`
- Deterministic issuance fixtures with seeded `platform.tenants`, `memberships`, and partner token records

**Tooling:**

- Playwright Test runner for API + E2E orchestration (`@playwright/test`)
- Compose-backed test runner via `infra/scripts/compose.sh` + matrix jobs

**Environment:**

- Docker Postgres with migrations applied per isolated job
- Host-based tenancy simulation (`*.voucher.shyft.org`) in test request headers
- Correlation/audit log visibility during integration test runs

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: >=95% (waivers required for failures)
- **P2/P3 pass rate**: >=90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: >=80%
- **Security scenarios**: 100%
- **Business logic**: >=70%
- **Edge cases**: >=50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (>=6) items unmitigated
- [ ] Security tests (SEC category) pass 100%
- [ ] Refusal envelope + correlation_id behavior verified on all Epic 2 denials

---

## Mitigation Plans

### R-201: Core Issuance Path Missing (Score: 9)

**Mitigation Strategy:** Implement voucher issuance domain + route contracts before any downstream governance work; add red-green API tests first.  
**Owner:** Dev Lead  
**Timeline:** Day 1-2 of Epic 2  
**Status:** Planned  
**Verification:** `test:admin` contains issuance route tests for steward + partner contexts.

### R-205: Cross-Tenant Leakage in Governance Endpoints (Score: 6)

**Mitigation Strategy:** Require tenant predicate in every vouchers query and enforce partner scope where applicable; add tenant-isolation negative matrix.  
**Owner:** QA + Dev  
**Timeline:** Day 2-3 of Epic 2  
**Status:** Planned  
**Verification:** Dedicated tenant-isolation tests confirm no data disclosure via lookup/duplicate/void.

### R-204: Duplicate Detection Accuracy Risk (Score: 6)

**Mitigation Strategy:** Define canonical identity key normalization and window boundary semantics in shared contracts; lock with unit+API tests.  
**Owner:** Dev  
**Timeline:** Day 2-4 of Epic 2  
**Status:** Planned  
**Verification:** Boundary and normalization suites pass; no false duplicate in out-of-window fixtures.

---

## Assumptions and Dependencies

### Assumptions

1. Epic 2 implementation remains primarily API/service-layer with minimal UI delta.
2. Partner-token path remains issuance + lookup only (no override/void privileges).
3. FR0 refusal semantics continue as invariant across all new endpoints.

### Dependencies

1. Story files `2-1` through `2-4` remain stable and approved for implementation.
2. Existing compose CI matrix remains required and will include new Epic 2 tests.
3. Audit event writer remains append-only and available for override/void instrumentation.

### Risks to Plan

- **Risk**: Scope bleed into Epic 3 lookup-status breadth during Story 2.4 implementation  
  - **Impact**: Delayed Epic 2 closure, diluted governance focus  
  - **Contingency**: Constrain Story 2.4 to void/status correctness only; defer broad lookup UX to Epic 3.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run).
- Run `*automate` for broader coverage once implementation exists.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: {name} Date: {date}
- [ ] Tech Lead: {name} Date: {date}
- [ ] QA Lead: {name} Date: {date}

**Comments:**

---

---

---

## Appendix

### Knowledge Base References

- `_bmad/bmm/testarch/knowledge/risk-governance.md`
- `_bmad/bmm/testarch/knowledge/probability-impact.md`
- `_bmad/bmm/testarch/knowledge/test-levels-framework.md`
- `_bmad/bmm/testarch/knowledge/test-priorities-matrix.md`

### Official Documentation Cross-Checks

- Playwright: API testing and request contexts - https://playwright.dev/docs/api-testing
- Playwright: Tagging and grep-based selective execution - https://playwright.dev/docs/test-annotations#tag-tests and https://playwright.dev/docs/test-cli#grep
- Cypress: Core concepts and test isolation - https://docs.cypress.io/app/core-concepts/test-isolation
- Cypress: Retry-ability model - https://docs.cypress.io/app/core-concepts/retry-ability
- Pact: Contract testing fundamentals and workflow - https://docs.pact.io/
- GitHub Actions: Workflow syntax, matrix strategies, and job timeout controls - https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax

### Related Documents

- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic: `_bmad-output/planning-artifacts/epics.md` (Epic 2)
- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- System test design baseline: `_bmad-output/test-design-system.md`
- Story pack: `_bmad-output/implementation-artifacts/2-1-issue-voucher-allowed-types-identity-minimums.md`, `_bmad-output/implementation-artifacts/2-2-duplicate-detection-policy-window.md`, `_bmad-output/implementation-artifacts/2-3-authorized-override-with-reason-audit.md`, `_bmad-output/implementation-artifacts/2-4-voucher-lookup-status-and-void-tenant-scoped.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module  
**Workflow**: `_bmad/bmm/testarch/test-design`  
**Version**: 4.0 (BMad v6)
