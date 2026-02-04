# Story 1.1: Host-Based Tenant Resolution + Refusal Reasons

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform operator,
I want tenant context derived only from host + JWT and explicit refusal reasons,
so that tenant isolation is enforceable without enumeration.

## Acceptance Criteria

1. **Given** a request to a tenant host matching `{tenant_slug}.voucher.{root_domain}`,
   **When** the host matches `platform.tenants.host` exactly and JWT tenant claim matches the resolved `tenant_id`,
   **Then** the request executes in that tenant context and no tenant IDs are accepted from body/query.
2. **And** unknown host returns HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` with correlation_id.
3. **And** host/JWT mismatch returns HTTP 200 refusal `{ success:false, reason:"TENANT_CONTEXT_MISMATCH" }`.
4. **And** non-membership returns HTTP 200 refusal `{ success:false, reason:"NOT_A_MEMBER" }`.
5. **And** unknown host refusal does not differ in message shape or status from disabled-app refusal; tests verify identical external envelope/reason.
6. **And** a tenant isolation test case is added covering the three refusal reasons.

## Tasks / Subtasks

- [ ] Implement tenant resolution middleware
  - [ ] Resolve tenant from host header only (exact match to `platform.tenants.host`)
  - [ ] Verify JWT tenant claim matches resolved tenant_id
  - [ ] Reject any tenant_id in body/query
- [ ] Implement refusal envelope helpers
  - [ ] `TENANT_NOT_FOUND`, `TENANT_CONTEXT_MISMATCH`, `NOT_A_MEMBER` with HTTP 200
  - [ ] Include `correlation_id` in all responses
- [ ] Add tenant isolation tests
  - [ ] Unknown host → `TENANT_NOT_FOUND`
  - [ ] Host/JWT mismatch → `TENANT_CONTEXT_MISMATCH`
  - [ ] Not a member → `NOT_A_MEMBER`
  - [ ] Envelope shape identical for unknown host vs app-disabled

## Dev Notes

- Tenant context must be derived only from host + JWT claim match; no tenant from input.
- Refusal vs error semantics are contract-level and must be enforced at the API boundary.
- Tests must prevent cross-tenant enumeration by ensuring identical external refusal shape.

### Project Structure Notes

- Tenant resolution: `apps/api/src/tenancy/`
- Auth/JWT: `apps/api/src/auth/`
- Refusal helpers: shared contracts in `packages/contracts/`
- Tests: `tests/tenant-isolation/`

### References

- Architecture: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- PRD: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic definitions: `_bmad-output/planning-artifacts/epics.md`
- Project context: `_bmad-output/project-context.md`

### Technical Requirements (Latest Versions)

- Next.js 16.x is the required major line; use the latest 16.x patch for scaffolded apps. citeturn2search1turn2search2
- Fastify v5 requires Node.js 20+; runtime must target Node 20 or later. citeturn0search1turn1search0

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

N/A

### Completion Notes List

- Story scaffolded with tenancy/refusal contract requirements.

### File List

- `_bmad-output/implementation-artifacts/1-1-host-based-tenant-resolution-refusal-reasons.md`
