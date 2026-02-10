# Story 1.5: Operational Gates Hooks (Release-Blocking)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a release manager,
I want droplet Postgres operational gates represented in docs/CI hooks,
so that release readiness includes backup/restore and alert thresholds.

## Acceptance Criteria

1. **Given** the cutover and ops requirements,
   **When** Epic 1 is completed,
   **Then** documentation/runbook hooks exist for nightly backups, weekly full backups, monthly restore drills, disk alert at 80%, and IO wait >20% for 5 minutes.
2. **And** a release-gate checklist file exists (e.g., `docs/RELEASE_GATES.md`) and CI fails if it is missing.

## Tasks / Subtasks

- [x] Create operational gates documentation
  - [x] Nightly backups (30 days)
  - [x] Weekly full backups (12 weeks)
  - [x] Monthly restore drill
  - [x] Disk utilization alert at 80%
  - [x] IO wait alert >20% for 5 minutes
- [x] Add CI hook
  - [x] CI fails if `docs/RELEASE_GATES.md` is missing
- [x] Add cutover readiness references
  - [x] Link to migration runbook and parity checks (from Epic 6)

## Dev Notes

- This is a release-blocking operational gate; treat as mandatory for production readiness.
- Single-droplet Postgres requires explicit backup/restore discipline.

### Project Structure Notes

- Ops docs: `docs/` or `infra/`
- CI: `.github/workflows/`

### References

- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic definitions: `_bmad-output/planning-artifacts/epics.md`

### Technical Requirements (Latest Versions)

- Caddy proxy configuration should follow official install and config guidance. citeturn3search2

## Dev Agent Record

### Agent Model Used

GPT-5

### Implementation Plan

- Add operational gates documentation with backup/restore and alert thresholds.
- Enforce release gates via `test:release-gates` wired into `test:db` and CI.
- Add cutover runbook and parity checks references; re-enable corresponding tests.

### Debug Log References
- `pnpm test:release-gates`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:db` (green)

### Completion Notes List

- Added release gates documentation covering backups, restore drills, alert thresholds, and cutover readiness references.
- Enforced off-droplet backup wording in release gates docs and tests.
- Wired release-gates test into `pnpm test:db` and CI compose workflow (`api-test`) plus CI presence check for `docs/RELEASE_GATES.md`.
- Added correlation_id presence assertions for refusal tests.
- Updated api-test Dockerfile to include `docs/RELEASE_GATES.md` and `.github/workflows` for integration checks.
- Full compose regression suite green.

### File List

- `_bmad-output/implementation-artifacts/1-5-operational-gates-hooks-release-blocking.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/atdd-checklist-1-5.md`
- `_bmad-output/atdd-checklist-1-5-operational-gates-hooks-release-blocking.md`
- `.github/workflows/compose-tests.yml`
- `docs/RELEASE_GATES.md`
- `tests/integration/operational-gates.ts`
- `tests/tenant-isolation/host-based-tenant-refusal.ts`
- `package.json`
- `infra/docker/api.test.Dockerfile`

### Change Log

- 2026-02-06: Added release-gate documentation, CI presence check, and API tests for operational gates.
- 2026-02-07: Tightened CI release-gate check, moved operational gate checks into integration tests, and clarified IO wait definition.
- 2026-02-07: Fixed tenant isolation test harness and updated api-test Dockerfile for release-gate checks.
- 2026-02-07: Updated compose workflow to use api-test for database test runs.
- 2026-02-10: Enforced off-droplet backup wording, fixed compose CI service name, and added correlation_id assertions.
