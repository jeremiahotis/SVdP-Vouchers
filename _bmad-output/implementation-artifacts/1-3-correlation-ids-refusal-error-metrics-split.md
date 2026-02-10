# Story 1.3: Correlation IDs + Refusal/Error Metrics Split

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an operator,
I want correlation IDs and refusal/error metrics split at the API boundary,
so that tenancy enforcement and business denials are observable from day one.

## Acceptance Criteria

1. **Given** any API response,
   **When** it is returned to the client,
   **Then** it includes a `correlation_id`.
2. **And** refusals are tracked separately from errors in structured logs (e.g., `outcome=refusal|error|success` and `reason=...`).
3. **And** at least one test asserts the structured refusal vs error fields exist.

## Tasks / Subtasks

- [x] Implement correlation_id generator and response injector
  - [x] Always include `correlation_id` on success/refusal/error responses
- [x] Implement structured logging split
  - [x] Log `outcome` and `reason` for refusals
  - [x] Log `outcome=error` and error codes for failures
- [x] Add tests for telemetry schema
  - [x] Verify refusal logs contain `outcome=refusal` and `reason`
  - [x] Verify error logs contain `outcome=error`

## Dev Notes

- Correlation IDs are required for every request (API + UI surfaces).
- Refusals are business denials and must not be treated as errors.
- Keep logging format consistent for later ingestion.

### Project Structure Notes

- Correlation hooks: `apps/api/src/observability/correlation.ts`
- Outcome logging helpers: `apps/api/src/logging/`
- Core app wiring: `apps/api/src/main.ts`
- Tests: `tests/integration/` and `tests/tenant-isolation/`

### References

- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic definitions: `_bmad-output/planning-artifacts/epics.md`

### Technical Requirements (Latest Versions)

- Node.js 20+ required by Fastify v5; ensure logger and middleware are compatible.

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

N/A

### Implementation Plan

- Add correlation_id injection in a pre-serialization hook.
- Add error handler that returns structured error with correlation_id.
- Register correlation middleware in main.
- Update correlation telemetry integration test to exercise middleware.

### Completion Notes List

- Added correlation_id injection, not-found handler, and structured refusal/error outcome logging.
- Added telemetry assertions for refusal vs error outcomes.
- Tests: `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:db`.

### File List

- `apps/api/src/logging/outcome.ts`
- `apps/api/src/main.ts`
- `tests/tenant-isolation/host-based-tenant-refusal.ts`
- `_bmad-output/implementation-artifacts/1-3-correlation-ids-refusal-error-metrics-split.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/atdd-checklist-1-3-correlation-ids-refusal-error-metrics-split.md`
- `apps/api/openapi.admin.json`
- `apps/api/src/observability/correlation.ts`
- `apps/api/src/main.ts`
- `tests/integration/openapi-admin-routes.ts`
- `tests/integration/correlation-telemetry.ts`
- `package.json`

### Change Log

- 2026-02-05: Added correlation_id injection for success/refusal/error responses.
- 2026-02-05: Added structured refusal/error outcome logging.
- 2026-02-05: Added and validated telemetry schema tests.
