# Automation Summary - Story 2.2 Duplicate Detection (Policy Window)

**Date:** 2026-02-12
**Mode:** BMad-Integrated
**Story:** `2-2-duplicate-detection-policy-window.md`
**Coverage Target:** critical-paths

## Target Analysis

**Story Source:** `_bmad-output/implementation-artifacts/2-2-duplicate-detection-policy-window.md`

**Acceptance Criteria Mapped:**

1. In-window duplicate detection returns refusal/warning outcome.
2. Duplicate checks are tenant-scoped only.
3. Partner-token and JWT issuance paths use the same duplicate policy behavior.
4. Duplicate outcomes follow FR0 envelope semantics with `correlation_id`.

**Existing Coverage Gaps Found Before Generation:**

- No integration automation for duplicate policy window behavior.
- No tenant-isolation automation for duplicate-policy cross-tenant negative case.

## Tests Created

### API / Integration Tests

- `tests/integration/voucher-duplicate-policy-window.ts` (293 lines)
  - `[P0]` in-window steward duplicate refusal (`voucher_type + identity key`)
  - `[P1]` out-of-window issuance allowed
  - `[P0]` partner-token duplicate behavior parity with steward flow
  - `[P1]` FR0 envelope correlation linkage on duplicate refusal

### Tenant Isolation Tests

- `tests/tenant-isolation/voucher-duplicate-policy-window.ts` (211 lines)
  - `[P0]` cross-tenant duplicate candidate does not block issuance in caller tenant

## Infrastructure and Script Updates

- Updated `package.json`:
  - `test:admin` now includes `tests/integration/voucher-duplicate-policy-window.ts`
  - `test:tenant` now includes `tests/tenant-isolation/voucher-duplicate-policy-window.ts`
- Updated docs:
  - `tests/README.md` with Story 2.2 direct execution commands
  - `tests/tenant-isolation/README.md` with duplicate-scope expectation

## Validation Results

### Auto-Validate

`auto_validate`: true (executed)

### Run Commands

```bash
docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm tsx tests/integration/voucher-duplicate-policy-window.ts
docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/tenant-isolation/voucher-duplicate-policy-window.ts
```

### Results

- Integration duplicate-policy suite: **FAIL** (expected RED)
  - First failure at `tests/integration/voucher-duplicate-policy-window.ts:212`
  - Assertion expected duplicate refusal (`success === false`) but current behavior returned `success === true`
- Tenant-isolation duplicate-policy suite: **PASS**

### Healing

- `tea_use_mcp_enhancements`: false
- Auto-healing loop: not executed (pattern per workflow when MCP enhancements are disabled)
- No `test.fixme()` markers applied

## Coverage Status

**Total Scenarios Added:** 5

- P0: 3
- P1: 2
- P2: 0
- P3: 0

**Test Level Split:**

- API/Integration: 4
- Tenant-isolation integration: 1
- E2E: 0
- Component: 0
- Unit: 0

**Current Status vs Story 2.2:**

- ✅ Tenant-scope negative behavior now covered.
- ✅ Out-of-window acceptance path now covered.
- ⚠️ In-window duplicate refusal behavior currently failing (implementation gap in `apps/api/src/vouchers`).
- ⚠️ Partner-token parity for duplicate refusal currently failing (same implementation gap).

## Definition of Done Check (Automation Workflow Scope)

- [x] Mode determined and story context loaded
- [x] Framework configuration loaded (`playwright.config.ts` present)
- [x] Coverage gaps analyzed
- [x] Test targets identified and prioritized
- [x] Duplicate coverage avoided (API + tenant-isolation only)
- [x] Test files generated with Given-When-Then intent comments and priority markers
- [x] Package scripts updated
- [x] Test docs updated
- [x] Generated tests validated by execution
- [x] Validation results documented

## Knowledge References Applied

- `_bmad/bmm/testarch/knowledge/test-levels-framework.md`
- `_bmad/bmm/testarch/knowledge/test-priorities-matrix.md`
- `_bmad/bmm/testarch/knowledge/data-factories.md`
- `_bmad/bmm/testarch/knowledge/selective-testing.md`
- `_bmad/bmm/testarch/knowledge/ci-burn-in.md`
- `_bmad/bmm/testarch/knowledge/test-quality.md`
- `_bmad/bmm/testarch/knowledge/fixture-architecture.md`
- `_bmad/bmm/testarch/knowledge/network-first.md`

## Standards Cross-Check

Checked against official references for current guidance:

- Playwright Route Interception: <https://playwright.dev/docs/network>
- Playwright `test.fixme` behavior: <https://playwright.dev/docs/test-annotations>
- Cypress best practices: <https://docs.cypress.io/app/core-concepts/best-practices>
- Pact docs (contract-testing context): <https://docs.pact.io/>
- GitHub Actions workflow fundamentals: <https://docs.github.com/actions>

## Next Steps

1. Implement Story 2.2 duplicate-policy domain service and wire it into steward + partner issuance paths.
2. Re-run:
   - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/voucher-duplicate-policy-window.ts`
   - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/tenant-isolation/voucher-duplicate-policy-window.ts`
3. Run full required gates:
   - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin`
   - `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant`
