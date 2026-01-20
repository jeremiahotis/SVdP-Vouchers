# Story 8.3: Public Voucher Request Access

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a conference/partner requester,
I want voucher request submission to work without authentication or nonce,
so that neighbors can request help without logging in while cashier/admin access remains protected.

## Acceptance Criteria

1. Unauthenticated voucher request submissions
   - Given an unauthenticated user submits the voucher request form
   - When the client calls `/wp-json/svdp/v1/vouchers/check-duplicate`, `/vouchers/create`, or `/vouchers/create-denied`
   - Then the request succeeds without requiring login or nonce

2. Public endpoints still enforce validation + rate limiting
   - Given a public voucher-request endpoint is called
   - When inputs are invalid or rate limits are exceeded
   - Then the request fails with standard validation errors or 429 per rate-limit rules
   - And rate limits use centralized thresholds: 20 requests / 5 minutes; 100 requests / day per IP (optional User-Agent hash)

3. Cashier/admin endpoints remain authenticated
   - Given an unauthenticated user calls cashier/admin endpoints (`/vouchers`, `/vouchers/{id}/status`, `/vouchers/{id}/coat`, `/managers/validate`, `/override-reasons`, `/auth/refresh-nonce`)
   - Then the request is rejected with 401/403

4. Logged-in cashier/admin unaffected
   - Given a logged-in user with `svdp_cashier` or `administrator` role
   - When they use cashier/admin endpoints
   - Then behavior is unchanged from current functionality

## Tasks / Subtasks

- [x] Task 1: Public voucher-request permission path (AC: 1, 2)
  - [x] Subtask 1.1: Update REST permission callbacks so voucher-request endpoints allow anonymous access
  - [x] Subtask 1.2: Ensure public endpoints run rate-limit checks using centralized thresholds

- [x] Task 2: Preserve cashier/admin protections (AC: 3, 4)
  - [x] Subtask 2.1: Verify cashier/admin permission callbacks still require login and capability
  - [x] Subtask 2.2: Confirm `handle_rest_authentication` does not block anonymous access to voucher-request endpoints

- [x] Task 3: Manual verification (AC: 1-4)
  - [x] Subtask 3.1: Incognito voucher request submit succeeds (no login)
  - [x] Subtask 3.2: Logged-out cashier endpoint calls fail with 401/403
  - [x] Subtask 3.3: Logged-in cashier/admin flow unchanged

### Review Follow-ups (AI)

- [x] [AI-Review][High] Tighten `handle_rest_authentication` to keep nonce bypass scoped to public routes. [svdp-vouchers.php:322]
- [ ] [AI-Review][Medium] Confirm whether `/conferences` should require nonce per docs; validate public request flow remains intact. [svdp-vouchers.php:175] [docs/api-contracts-plugin.md:50]

## Dev Notes

- Public voucher-request endpoints MUST be unauthenticated and nonce-free. This is a hard requirement. [Source: _bmad-output/planning-artifacts/prd.md#L303, _bmad-output/planning-artifacts/architecture.md#L174]
- Cashier/admin endpoints remain auth-gated via `svdp_cashier` or `manage_options`. [Source: _bmad-output/planning-artifacts/architecture.md#L174, docs/api-contracts-plugin.md#L1]
- Rate limits are doubled to 20/5min and 100/day per IP, defined in one centralized place (see Story 8.2). [Source: _bmad-output/planning-artifacts/prd.md#L303, _bmad-output/planning-artifacts/architecture.md#L174]
- REST routes are registered in `svdp-vouchers.php`; permission callbacks live on the plugin class. [Source: svdp-vouchers.php]

### Project Structure Notes

- REST routes: `svdp-vouchers.php` `register_rest_routes()`
- Permission callbacks: `check_public_access`, `check_cashier_access`, `check_admin_access`
- REST auth filter: `handle_rest_authentication` in `svdp-vouchers.php`
- Rate limiting utilities (if present): `includes/class-rate-limits.php` (Story 8.2)

### References

- _bmad-output/planning-artifacts/prd.md (Security)
- _bmad-output/planning-artifacts/architecture.md (Authentication & Security)
- docs/api-contracts-plugin.md (Public endpoints)
- SCOPE.md (Security non-negotiable)
- TEST_PLAN.md (public request + cashier login checks)
- svdp-vouchers.php (REST routes + auth callbacks)

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

- `php tools/phpunit.phar --testsuite "SVdP Vouchers"`

### Completion Notes List

- Implemented public rate limit enforcement with centralized thresholds and kept cashier/admin auth intact.
- Added unit tests for anonymous public access, rate limit enforcement, and REST auth passthrough.
- Bypassed nonce validation for public voucher-request routes to avoid cookie check failures.
- Manual verification complete for public request and cashier access paths.
- Tightened REST auth bypass scope for public routes and added test coverage.
- Adjusted cashier access checks to capability-based gating and logged review follow-ups.

### File List

- includes/class-rate-limits.php
- includes/class-rest-errors.php
- svdp-vouchers.php
- tests/bootstrap.php
- tests/PermissionCallbacksTest.php
- phpunit.xml
- tools/phpunit.phar
- README.md
- SCOPE.md
- TEST_PLAN.md
- UI_STATES.md
- docs/api-contracts-plugin.md

## Change Log

- 2026-01-20: Implemented public REST access + rate limits; added PHPUnit harness and permission tests; verified manual access flows.
- 2026-01-20: Scoped REST auth nonce bypass to public routes; added protected-route test coverage.
