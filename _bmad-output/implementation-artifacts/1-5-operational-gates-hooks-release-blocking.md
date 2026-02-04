# Story 1.5: Operational Gates Hooks (Release-Blocking)

Status: ready-for-dev

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

- [ ] Create operational gates documentation
  - [ ] Nightly backups (30 days)
  - [ ] Weekly full backups (12 weeks)
  - [ ] Monthly restore drill
  - [ ] Disk utilization alert at 80%
  - [ ] IO wait alert >20% for 5 minutes
- [ ] Add CI hook
  - [ ] CI fails if `docs/RELEASE_GATES.md` is missing
- [ ] Add cutover readiness references
  - [ ] Link to migration runbook and parity checks (from Epic 6)

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

N/A

### Completion Notes List

- Story scaffolded for operational gates and CI enforcement.

### File List

- `_bmad-output/implementation-artifacts/1-5-operational-gates-hooks-release-blocking.md`
