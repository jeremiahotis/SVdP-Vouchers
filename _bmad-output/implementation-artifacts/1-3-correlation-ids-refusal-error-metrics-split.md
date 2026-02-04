# Story 1.3: Correlation IDs + Refusal/Error Metrics Split

Status: ready-for-dev

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

- [ ] Implement correlation_id generator and response injector
  - [ ] Always include `correlation_id` on success/refusal/error responses
- [ ] Implement structured logging split
  - [ ] Log `outcome` and `reason` for refusals
  - [ ] Log `outcome=error` and error codes for failures
- [ ] Add tests for telemetry schema
  - [ ] Verify refusal logs contain `outcome=refusal` and `reason`
  - [ ] Verify error logs contain `outcome=error`

## Dev Notes

- Correlation IDs are required for every request (API + UI surfaces).
- Refusals are business denials and must not be treated as errors.
- Keep logging format consistent for later ingestion.

### Project Structure Notes

- Observability: `apps/api/src/observability/`
- Logging middleware: `apps/api/src/middleware/` or `apps/api/src/observability/logger.ts`
- Tests: `tests/integration/`

### References

- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic definitions: `_bmad-output/planning-artifacts/epics.md`

### Technical Requirements (Latest Versions)

- Node.js 20+ required by Fastify v5; ensure logger and middleware are compatible. citeturn0search1turn1search0

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

N/A

### Completion Notes List

- Story scaffolded for correlation_id + refusal/error metrics split.

### File List

- `_bmad-output/implementation-artifacts/1-3-correlation-ids-refusal-error-metrics-split.md`
