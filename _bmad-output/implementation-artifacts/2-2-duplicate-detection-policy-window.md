# Story 2.2: Duplicate Detection (Policy Window)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a steward or partner agent,  
I want duplicate detection during issuance,  
so that policy is enforced consistently across partners and staff.

## Acceptance Criteria

1. **Given** an issuance request within the configured duplicate policy window,  
   **When** a duplicate is detected using defined criteria (`voucher_type` + identity key),  
   **Then** the system returns a refusal or warning per policy.
2. **And** duplicate checks are tenant-scoped only and never leak cross-tenant data.
3. **And** partner-token and JWT issuance paths use the same duplicate policy engine.
4. **And** refusal/warning responses follow standard FR0 envelope semantics with `correlation_id`.

## Tasks / Subtasks

- [x] Implement duplicate policy contract
  - [x] Define configurable policy window and duplicate key shape in shared contracts/config.
  - [x] Normalize identity key inputs consistently (case/whitespace/date canonicalization).
  - [x] Document refusal/warning reason codes for duplicate outcomes.
- [x] Implement duplicate detection domain service
  - [x] Add tenant-scoped duplicate query logic in `apps/api/src/vouchers/duplicate/`.
  - [x] Apply deterministic policy window boundaries (inclusive/exclusive behavior explicitly tested).
  - [x] Return structured outcome (`no_match`, `warning`, `refusal`) for issuance flow integration.
- [x] Wire duplicate checks into issuance path
  - [x] Execute duplicate check before issuance state mutation.
  - [x] Use refusal path for blocking policy and warning path for override-eligible policy.
  - [x] Preserve partner scope and tenant constraints for partner-token requests.
- [x] Add tests
  - [x] Integration test: duplicate refusal in-window.
  - [x] Integration test: non-duplicate outside window succeeds.
  - [x] Integration test: partner-token issuance uses same duplicate behavior.
  - [x] Tenant isolation test: duplicate checks never query/return cross-tenant matches.

## Dev Notes

### Story Foundation

- Story 2.1 creates the issuance path and snapshot behavior.
- Story 2.2 introduces governance before write: policy-window duplicate detection.
- Story 2.3 consumes warning/refusal outcomes to permit authorized override with reason.

### Developer Context Section

- Duplicate policy must be consistent across steward JWT and partner-token issuance flows.
- Duplicate check must never be the source of cross-tenant information leakage.
- Refusal remains business outcome, not system error.
- Keep result messaging neutral and next-step oriented (UX refusal guidance pattern).

### Technical Requirements

- Matching criteria baseline: `voucher_type` + normalized identity key.
- Policy window must be configurable and test-covered at boundary edges.
- Duplicate outcomes should be machine-readable for downstream override decisioning.
- Keep on-wire contract `snake_case`.

### Architecture Compliance

- Domain location:
  - Duplicate logic in `apps/api/src/vouchers/duplicate/`
  - Issuance orchestration in `apps/api/src/vouchers/`
- Tenant context from middleware must be mandatory input to duplicate query.
- Audit and telemetry must keep refusal/error split intact.

### Library / Framework Requirements

- Fastify + schema validation for request payload shape.
- Use existing Knex/Postgres patterns and naming conventions (`snake_case`, indexed tenant keys).
- Avoid introducing new infrastructure dependencies in this story.

### File Structure Requirements

- API domain:
  - `apps/api/src/vouchers/duplicate/` for policy/query helpers
  - `apps/api/src/vouchers/` for issuance integration points
- Contracts:
  - `packages/contracts/src/constants/` and/or schema files
- Tests:
  - `tests/integration/`
  - `tests/tenant-isolation/`

### Testing Requirements

- Required checks before handoff:
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin`
  - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant`
- Add deterministic coverage for:
  - in-window duplicate
  - out-of-window non-duplicate
  - partner-token parity
  - refusal envelope consistency

### Previous Story Intelligence

- Story 1.6 + 4.4 already established partner issuance constraints and allowed type filtering.
- Story 1.3 established refusal/error observability split; duplicate denials must log as refusal outcomes.
- Recent CI work highlighted need for tests to self-seed migrations in isolated compose jobs.

### Git Intelligence Summary

- Recent commits hardened route-level tests and compose-matrix execution.
- Keep new duplicate tests boundary-focused and HTTP-route-aware where possible to avoid schema bypass blind spots.

### Project Context Reference

- `_bmad-output/project-context.md` rules apply:
  - no free-form sensitive data expansion
  - refusal semantics over generic errors for business denials
  - mandatory compose-backed verification

### Project Structure Notes

- This story should not implement override authorization path itself (that is Story 2.3).
- Keep implementation incremental: detector first, issuance integration second, then test expansion.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.2)
- `_bmad-output/planning-artifacts/voucher-shyft-prd.md` (FR21, FR0)
- `_bmad-output/planning-artifacts/voucher-shyft-architecture.md` (module mapping, tenant isolation, refusal handling)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (full issuance duplicate branch)
- `_bmad-output/implementation-artifacts/2-1-issue-voucher-allowed-types-identity-minimums.md`
- `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/integration/voucher-duplicate-policy-window.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/integration/voucher-duplicate-policy-boundary.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/tenant-isolation/voucher-duplicate-policy-window.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:admin`
- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:tenant`
- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:db`

### Completion Notes List

- Added shared duplicate policy configuration/identity normalization helpers in contracts (`window_days`, `policy_action`, normalized identity key shape).
- Added refusal reason codes for duplicate outcomes: `DUPLICATE_IN_POLICY_WINDOW`, `DUPLICATE_WARNING_REQUIRES_OVERRIDE`.
- Implemented tenant-scoped duplicate policy engine in `apps/api/src/vouchers/duplicate/policy.ts` with structured outcomes (`no_match`, `warning`, `refusal`).
- Wired duplicate checks into issuance route for partner-token and active steward issuance paths, preserving initiate-only pending-request behavior.
- Added deterministic boundary coverage and route-level duplicate coverage; updated existing issuance integration scenarios for non-duplicate fixtures under new policy.
- Verified regression suite passes with duplicate-policy tests included in `test:admin` and `test:tenant`.
- Added explicit warning response path for duplicate policy warnings (distinct from refusal), including machine-readable details and warning audit event type.
- Added route-level warning-mode integration assertions for steward and partner-token issuance flows.
- Reconciled story file list against git status to remove review discrepancies.

### File List

- `apps/api/src/partner/routes.ts`
- `apps/api/src/tenancy/refusal.ts`
- `apps/api/src/vouchers/duplicate/index.ts`
- `apps/api/src/vouchers/duplicate/policy.ts`
- `package.json`
- `packages/contracts/src/constants/refusal-reasons.ts`
- `packages/contracts/src/constants/voucher-issuance.ts`
- `packages/contracts/src/index.ts`
- `tests/README.md`
- `tests/integration/voucher-duplicate-policy-boundary.ts`
- `tests/integration/voucher-duplicate-policy-window.ts`
- `tests/integration/voucher-issuance.ts`
- `tests/tenant-isolation/README.md`
- `tests/tenant-isolation/voucher-duplicate-policy-window.ts`
- `_bmad-output/implementation-artifacts/2-2-duplicate-detection-policy-window.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/automation-summary.md`

## Senior Developer Review (AI)

- 2026-02-12: Resolved code-review findings by implementing a distinct warning response branch for duplicate policy warnings, adding warning-path integration coverage, and reconciling story/git file-list drift.
- Verified compose-backed duplicate-policy test coverage for refusal, warning, boundary behavior, and tenant isolation.

## Change Log

- 2026-02-12: Implemented Story 2.2 duplicate policy engine, refusal reason codes, issuance-path integration, and regression-tested admin/tenant suites with new duplicate-policy coverage.
- 2026-02-12: Review remediation applied for warning-path behavior, warning-mode tests, and story/git discrepancy cleanup.
