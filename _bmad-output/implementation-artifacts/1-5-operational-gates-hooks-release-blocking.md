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

### Debug Log References

- `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:db`
- `pnpm test:release-gates`

### Completion Notes List

- Tightened CI gate to require tracked, non-empty `docs/RELEASE_GATES.md`.
- Moved release-gate checks to `tests/integration/operational-gates.ts` and wired into `pnpm test:db`.
- Clarified IO wait alert measurement in `docs/RELEASE_GATES.md`.
- Updated ATDD checklist to reference `tests/integration/operational-gates.ts` and `pnpm test:release-gates`.
- Updated tenant isolation test harness to parse JSON-string refusals.
- Updated api-test Dockerfile to include `docs/RELEASE_GATES.md` and `.github/workflows` for integration checks.
- Updated compose workflow to run `api-test` service for `pnpm test:db`.
- Tests: `pnpm test:release-gates` (pass); `docker compose -f infra/docker/docker-compose.yml run --rm --build api-test pnpm test:db` (pass).

### File List

- `.github/workflows/compose-tests.yml`
- `_bmad-output/atdd-checklist-1-5-operational-gates-hooks-release-blocking.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `docs/RELEASE_GATES.md`
- `infra/docker/api.test.Dockerfile`
- `package.json`
- `tests/integration/operational-gates.ts`
- `tests/tenant-isolation/host-based-tenant-refusal.ts`
- `_bmad-output/implementation-artifacts/1-5-operational-gates-hooks-release-blocking.md`

### Change Log

- 2026-02-06: Added release-gate documentation, CI presence check, and API tests for operational gates.
- 2026-02-07: Tightened CI release-gate check, moved operational gate checks into integration tests, and clarified IO wait definition.
- 2026-02-07: Fixed tenant isolation test harness and updated api-test Dockerfile for release-gate checks.
- 2026-02-07: Updated compose workflow to use api-test for database test runs.
