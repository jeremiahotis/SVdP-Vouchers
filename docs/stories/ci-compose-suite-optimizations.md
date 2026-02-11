# Story: CI Compose Suite Optimizations

Status: in-progress

## Story

As a release engineer,
I want the Compose Test Suite optimized for speed and reliability,
so that PR checks finish quickly without reducing coverage.

## Acceptance Criteria

1. AC1: Compose workflow uses Docker Buildx layer caching and pnpm cache in CI; logs show cache hits on subsequent runs.
2. AC2: `infra/docker/api.test.Dockerfile` uses BuildKit cache mount for pnpm store; pnpm installs reuse cache across CI runs.
3. AC3: Compose suite tests run as parallel jobs (admin, tenant, idempotency, release-gates) without changing test coverage.
4. AC4: CI logs include timing output per test job and a timeout guard to fail hung test jobs.

## Tasks / Subtasks

- [ ] Task 1: Add CI caching for Compose Test Suite
  - [ ] Update `.github/workflows/compose-tests.yml` to use `docker/setup-buildx-action` and `docker/build-push-action` cache-from/cache-to.
  - [ ] Add `actions/cache` for pnpm store (or mount in Docker build step as appropriate).
  - [ ] Ensure cache keys use `pnpm-lock.yaml` hash.
  - [ ] Verify workflow still uses compose to run tests; no test commands change.
- [ ] Task 2: Use BuildKit cache mount in `api.test.Dockerfile`
  - [ ] Add BuildKit syntax line.
  - [ ] Add cache mount for pnpm store in `pnpm install` layer.
  - [ ] Keep Dockerfile behavior identical apart from caching.
- [ ] Task 3: Parallelize test jobs
  - [ ] Split Compose Test Suite into a matrix with jobs: `test:admin`, `test:tenant`, `test:idempotency`, `test:release-gates`.
  - [ ] Each job runs `infra/scripts/compose.sh run --rm api-test pnpm <task>` with same env prep.
  - [ ] Ensure job names are clear for PR status checks.
- [ ] Task 4: Add timing + timeout guard
  - [ ] Add `time` output around test command in workflow.
  - [ ] Add job-level timeout (`timeout-minutes`) and/or command-level timeout to fail hung jobs.

## Dev Notes

- CI-only changes; no application code changes.
- Preserve existing triggers: `push` and `pull_request` on `main` and `feature/*`.
- Keep tests mandatory and full coverage.

## Dev Agent Record

### Agent Model Used

GPT-5

### Implementation Plan

- Add Buildx cached build for api-test image in `compose-tests.yml`.
- Add BuildKit cache mount for pnpm store in `infra/docker/api.test.Dockerfile`.
- Split Compose Test Suite into a matrix (admin/tenant/idempotency/release-gates).
- Add timing output and timeout guard per job.

### Debug Log References

- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:db` (hung; terminated).
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:admin` (hung; terminated).
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/admin-auth.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/admin-guards.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/admin-ip-allowlist.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/openapi-admin-routes.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/correlation-telemetry.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/audit-write-path.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/partner-token-auth.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm tsx tests/integration/partner-token-schema.ts`
- `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm exec tsx tests/integration/partner-form-config.ts` (hung; terminated).

### Completion Notes List

- Added Buildx caching and matrix test jobs in Compose Test Suite workflow.
- Added BuildKit cache mount for pnpm store in api-test Dockerfile.
- Added per-job timing + timeout guard in CI.
- Tests not fully completed: `partner-form-config` hang in compose; full `test:db` run incomplete.

### File List

- `.github/workflows/compose-tests.yml`
- `infra/docker/api.test.Dockerfile`
- `docs/stories/ci-compose-suite-optimizations.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-02-11: Added cached Buildx build, parallel Compose test jobs, and per-job timing/timeout guard; added BuildKit cache mount for pnpm store.
