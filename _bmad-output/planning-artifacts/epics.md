---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/voucher-shyft-prd.md
  - _bmad-output/planning-artifacts/voucher-shyft-architecture.md
  - _bmad-output/planning-artifacts/ui/shyft_ux_design_and_brand_system_source_of_truth_v_1.md
  - _bmad-output/planning-artifacts/ui/system-invariants.md
  - _bmad-output/planning-artifacts/ui/decision-surface-review-checklist.md
  - _bmad-output/planning-artifacts/ui/redesign-mode-rules.md
  - _bmad-output/planning-artifacts/ui/shyft_ux_do_dont_appendix_v_1.md
---

# SVdP-Vouchers - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SVdP-Vouchers, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR0: Business denials return HTTP 200 with `{ success:false, reason }` and are tracked separately from errors; errors use non-200 or `{ success:false, error }` per API standard.
FR1: System derives tenant context only from host + JWT tenant claim match; tenant is never taken from request body/query.
FR2: Every request executes in exactly one tenant context.
FR3: System refuses (per FR0) requests when host/JWT tenant mismatch occurs.
FR4: System refuses (per FR0) any action when user lacks membership in the active tenant.
FR5: System supports role assignments per tenant (Steward, Cashier, Store Admin, District Admin, Auditor, Integration).
FR6: Store Admins can invite/disable Cashier accounts within their tenant.
FR7: District Admins can be granted explicit elevated permissions per tenant.
FR8: Auditors have read-only access to vouchers, redemptions, and config history for assigned tenants.
FR8b: Integration role is non-human, tenant-scoped, and read-only in MVP.
FR9: Cross-tenant users can view only tenants they are members of.
FR10: Tenant switching results in navigation to a new tenant origin/context such that subsequent requests derive tenant context from host/JWT match (no client-only switching).
FR11: Active tenant is clearly displayed during all actions that can mutate data.
FR12: System refuses (per FR0) any write action if tenant context is invalid or membership is missing.
FR13: App enablement is controlled by the platform tenant registry (`platform.tenant_apps`) and evaluated on every VoucherShyft request.
FR14: Disabled tenants receive HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` and internal logs record `APP_DISABLED` (no enumeration).
FR15: App enablement is enforced as part of tenancy resolution (no partial access).
FR16: Stewards can initiate and issue vouchers within allowed voucher types for their tenant (or initiate-only if issuance is restricted by role).
FR17: System records immutable authorization snapshots at issuance.
FR18: System supports voucher lookup by voucher ID and by captured voucher fields (name/phone/etc as stored) within tenant scope.
FR19: System supports voucher voiding with reason capture (authorized roles only).
FR20: System presents voucher status (active, redeemed, expired, voided) within tenant scope.
FR21: System checks duplicates within the configured policy window using defined matching criteria (voucher type + identity key) during issuance and returns a refusal or warning per policy.
FR22: System provides an override path for authorized roles only.
FR23: Overrides require reason capture and are written to the audit log.
FR24: System refuses (per FR0) override attempts from unauthorized roles.
FR25: Redemption actions are restricted to Cashier role (and explicitly granted roles) within tenant context.
FR26: Redemption requires receipt_id. gross_total is required when “Manual gross capture mode” is enabled (default in MVP until POS import is live).
FR27: System records redemption metadata (who, when, receipt_id, gross_total if applicable).
FR28: System refuses (per FR0) redemption when voucher is expired or already redeemed.
FR29: Store Admins can manage tenant-scoped catalog availability (categories/items).
FR30: Store Admins can manage tenant-scoped rules text and redemption hours.
FR31: System enforces allowed voucher types per tenant at request time.
FR32: Configuration changes apply immediately within the tenant scope.
FR33: System records append-only audit events for issuance, overrides, redemption, voids, and config changes.
FR34: System logs correlation IDs per request and separates refusals from errors in telemetry.
FR35: System supports importing historical vouchers with per-tenant parity validation.
FR36: System provides export artifacts for migration and audit as needed.
FR37: System supports a hard cutover runbook and tracks migration validation results.
FR37a: During the 30-day WP reference window, the system must prevent all voucher writes in WP (plugin gate + capability strip + database enforcement) and alert on any blocked attempt; success condition is 0 successful legacy writes.
FR37b: WP reference window is 30 days; after window, WP is archived/offlined per runbook.
FR38: System provides tenant-scoped voucher list export for audit/support.
FR39: System provides a tenant-scoped reconciliation summary export based on available redemption data (manual capture in MVP; import-enhanced later).

### NonFunctional Requirements

NFR1: Issue voucher p95 ≤ 2.0s on broadband; ≤ 4.0s on slow 3G.
NFR2: Redeem voucher p95 ≤ 1.5s on broadband; ≤ 3.0s on slow 3G.
NFR3: Search/lookup p95 ≤ 800ms for ID lookup; ≤ 1.5s for name/field search (tenant-scoped), broadband.
NFR4: p95 measured end-to-end from UI submit click → UI confirmation rendered, including API + DB.
NFR5: Performance targets must hold at ≥ 25 concurrent active users system-wide.
NFR6: PII minimization; no sensitive free-text by default; configurable retention for optional notes.
NFR7: Default retention: voucher records 7 years (or org-defined); request logs with PII ≤ 30 days; audit events ≥ 7 years (or org-defined).
NFR8: Auth is JWT-based; tenant context derived from host + JWT claim match only; membership required for access.
NFR9: Append-only audit events for issuance/override/redemption/void/config changes.
NFR10: TLS 1.2+ in transit; encryption at rest for DB/backups; secrets not in source control.
NFR11: Backups encrypted; restore test monthly (MVP quarterly acceptable).
NFR12: Availability 99.5% monthly for issue/redeem APIs (excluding planned maintenance ≤ 4 hours/month with ≥ 24h notice).
NFR13: Redemption idempotent on (tenant_id, voucher_id); duplicate submissions return existing redemption.
NFR14: Migration safety: 100% per-tenant parity (counts + spot checks); rollback is pause writes + re-import (no dual-run).
NFR15: WP read-only window: 0 successful legacy writes; attempted writes blocked + alerted.
NFR16: Supports up to 50 store tenants without architectural change.
NFR17: Supports up to 500 total users and 50 concurrent sessions.
NFR18: Supports up to 500k vouchers with p95 targets via indexing and tenant-scoped queries.
NFR19: WCAG 2.1 AA for critical flows (issue, redeem, tenant switching, login, export).
NFR20: Keyboard-only operation for critical flows; visible focus; no color-only meaning; programmatic error associations.
NFR21: Correlation IDs on every request; refusal/error metrics split; audit events queryable and exportable.
NFR22: API versioned base path (e.g., /v1) with backward-compat guarantees per major version.
NFR23: Rate limits per tenant: default 60 req/min/user; service accounts configurable; 429 with Retry-After.
NFR24: Breaking changes require new major; deprecation notice ≥ 90 days.

### Additional Requirements

- Canonical tenant registry is `platform.tenants`; app enablement via `platform.tenant_apps` on every request; VoucherShyft must not define its own tenant registry.
- Tenant switching must be a host change; tenant context is host + JWT claim match only; no tenant from body/query or client-only switching.
- Unknown host → HTTP 200 refusal `TENANT_NOT_FOUND` with no tenant enumeration; host/JWT mismatch → `TENANT_CONTEXT_MISMATCH` refusal.
- Refusal contract enforced at API boundary; refusal vs error metrics split; correlation_id on all responses.
- Refusal reason codes are mandatory: `TENANT_NOT_FOUND`, `TENANT_CONTEXT_MISMATCH`, `NOT_A_MEMBER`.
- Admin API uses 401/403 for access denials; user-facing app routes use HTTP 200 refusals for authorization denials within valid tenant context.
- Tenant-asserted DB access discipline: all queries tenant-scoped through enforced helpers; no root DB access outside tenant context.
- UX governance: Decision Surface invariants (context-first, identity-first, progressive disclosure, one primary decision).
- Quiet Authority design posture; token-only styling; no raw hex values; calm density; no urgency framing.
- Stillness after key actions: no auto-advance after refusal; no nudging into alternatives.
- Read-only context must never look editable; decision cards for consequential choices.
- Coats are cashier-only; never on request form; closed catalog + immutable snapshots at issuance.
- Redemption captures receipt_id + gross_total until CSV import is reliable; weekly CSV import is admin-run, idempotent, per-store profile.
- Tech stack: TypeScript end-to-end; Next.js App Router (web), Fastify (API), Postgres 17.x on DO droplet, Caddy reverse proxy, Docker Compose.
- OpenAPI generated from route schemas; CI fails on spec drift; admin OpenAPI is CI artifact only.
- Postgres-on-droplet operational gates: nightly off-droplet backups (30 days), weekly full backups (12 weeks), monthly restore drill, disk alert at 80%, IO wait >20% for 5 min.

### FR Coverage Map

### FR Coverage Map

FR0: Epic 1 - Refusal contract enforcement
FR1: Epic 1 - Tenant context from host/JWT only
FR2: Epic 1 - One-tenant-per-request execution
FR3: Epic 1 - Host/JWT mismatch refusal
FR4: Epic 1 - Non-membership refusal
FR5: Epic 4 - Tenant-scoped role assignments
FR6: Epic 4 - Store Admin manages cashier accounts
FR7: Epic 4 - District Admin explicit elevation per tenant
FR8: Epic 4 - Auditor read-only access
FR8b: Epic 1 - Integration role baseline (tenant-scoped, read-only MVP)
FR9: Epic 1 - Cross-tenant memberships visible
FR10: Epic 1 - Host-change tenant switching
FR11: Epic 1 - Active tenant display for actions
FR12: Epic 1 - Refuse writes on invalid tenant context
FR13: Epic 1 - App enablement registry control
FR14: Epic 1 - Disabled tenant external TENANT_NOT_FOUND + internal APP_DISABLED
FR15: Epic 1 - Enablement evaluated on every request
FR16: Epic 2 - Steward initiate/issue within allowed types
FR17: Epic 2 - Immutable authorization snapshots
FR18: Epic 2 - Voucher lookup by ID and fields (tenant-scoped)
FR19: Epic 2 - Voucher voiding with reason (authorized roles)
FR20: Epic 2 - Voucher status visibility
FR21: Epic 2 - Duplicate checks within policy window
FR22: Epic 2 - Authorized override path
FR23: Epic 2 - Override reason capture + audit
FR24: Epic 2 - Refuse unauthorized override
FR25: Epic 3 - Redemption role restrictions
FR26: Epic 3 - Receipt/gross capture mode
FR27: Epic 3 - Redemption metadata capture
FR28: Epic 3 - Refuse expired/redeemed
FR29: Epic 4 - Tenant-scoped catalog availability
FR30: Epic 4 - Tenant-scoped rules text/hours
FR31: Epic 4 - Enforce allowed voucher types per tenant
FR32: Epic 4 - Config changes apply immediately per tenant
FR33: Epic 1 - Audit event write path (minimum viable)
FR34: Epic 1 - Correlation IDs + refusal/error split metrics (minimum viable)
FR35: Epic 6 - Historical voucher import + parity validation
FR36: Epic 6 - Export artifacts for migration/audit
FR37: Epic 6 - Hard cutover runbook + validation tracking
FR37a: Epic 6 - 30-day WP write-block enforcement + alerts
FR37b: Epic 6 - WP archive/offline after window
FR38: Epic 5 - Tenant-scoped voucher export
FR39: Epic 5 - Reconciliation summary export

## Epic List

### Epic 1: Tenant Spine + Platform Registry + Platform Admin (Day-0)
Tenant resolution is enforceable; platform registry is authoritative; platform admin can provision tenants/apps; observability proves enforcement.
**FRs covered:** FR0–FR4, FR8b–FR15, FR33–FR34 (minimum slice)

### Epic 2: Steward Voucher Issuance + Duplicate Governance
Stewards can issue vouchers within policy, with duplicate checks and authorized overrides.
**FRs covered:** FR16–FR24 (depends on FR31–FR32 from Epic 4)

### Epic 3: Cashier Redemption Flow
Cashiers can redeem vouchers quickly with receipt capture and clear refusals.
**FRs covered:** FR25–FR28

## Epic 3: Cashier Redemption Flow

Cashiers can redeem vouchers quickly with receipt capture and clear refusals.

### Story 3.1: Redeem Voucher (Cashier-Only + Receipt Capture)

As a cashier,
I want to redeem a voucher with minimal input,
So that checkout flow remains fast and accurate.

**Acceptance Criteria:**

**Given** a cashier role within an active tenant and a voucher that exists in the active tenant,
**When** the cashier submits redemption with receipt_id (and gross_total if manual gross capture mode is enabled),
**Then** the voucher is marked redeemed and redemption metadata is recorded.
**And** redemption is refused if the voucher is expired with reason `VOUCHER_EXPIRED`.
**And** redemption is refused if the voucher is already redeemed with reason `VOUCHER_ALREADY_REDEEMED`.
**And** redemption is refused if the voucher is voided with reason `VOUCHER_VOIDED`.
**And** redemption is refused if the voucher is not found in the active tenant with reason `VOUCHER_NOT_FOUND`.
**And** redemption is refused if the user is not permitted to redeem with reason `REDEEM_NOT_PERMITTED`.
**And** redemption responses include correlation_id.
**And** redemption writes an audit event via the Epic 1 audit write path (must exist before this story ships).

### Story 3.2: Redemption Idempotency and Receipt Constraints

As a cashier,
I want redemption to be idempotent on retries,
So that double-submissions do not create duplicate redemptions.

**Acceptance Criteria:**

**Given** a redemption request for the same `(tenant_id, voucher_id)`,
**When** the request is repeated,
**Then** the system returns the existing redemption record without creating a duplicate.
**And** receipt_id is unique per tenant; duplicate receipt_id for a different voucher is refused with `RECEIPT_ID_CONFLICT`.
**And** the same receipt_id for the same voucher returns the existing redemption.
**And** if manual gross capture is enabled, gross_total is required and validated as a non-negative number; invalid values are refused with `VALIDATION_FAILED`.
**And** a test verifies idempotency behavior for redemption.

### Story 3.3: Redemption Status Surface (Cashier View)

As a cashier,
I want to see clear redemption status and refusal reasons,
So that I can respond quickly at the point of sale.

**Acceptance Criteria:**

**Given** a voucher lookup during redemption,
**When** the voucher is valid,
**Then** the UI indicates it can be redeemed and prompts for receipt_id (and gross_total if required).
**And** the UI maps refusal reasons to explicit states: valid, not_found, expired, redeemed, voided, not_permitted, error.
**And** when redemption is refused, the UI displays the refusal reason without escalating or auto-advancing.
**And** refusal vs error states are visually distinct and follow Decision Surface invariants.

### Epic 4: Store Configuration & Staff Management (Tenant-Scoped)
Store Admin config + cashier account management; no platform registry CRUD here.
**FRs covered:** FR5–FR8, FR29–FR32

## Epic 4: Store Configuration & Staff Management (Tenant-Scoped)

Store Admin config + cashier account management; no platform registry CRUD here.

### Story 4.1: Store Configuration (Catalog + Rules Text + Hours)

As a store admin,
I want to manage tenant-scoped configuration for catalog availability and rules,
So that my store’s redemption policies and availability are accurate.

**Acceptance Criteria:**

**Given** a store admin in an active tenant,
**When** they update catalog availability, rules text, or redemption hours,
**Then** changes apply immediately within that tenant only.
**And** MVP catalog availability supports category enable/disable only; item-level controls are deferred.
**And** store admin can manage allowed voucher types per tenant (MVP tenant-level only).
**And** rules text is tenant-scoped, limited in length, and excludes PII.
**And** configuration changes are visible to stewardship and cashier flows that read allowed voucher types and rules.
**And** unauthorized users are refused with reason `NOT_AUTHORIZED_FOR_ACTION`.
**And** config changes write audit events via the Epic 1 audit write path.

### Story 4.2: Staff Management (Cashier Accounts)

As a store admin,
I want to create or disable cashier memberships for existing platform users,
So that only authorized staff can redeem vouchers.

**Acceptance Criteria:**

**Given** a store admin in an active tenant,
**When** they create or disable a cashier membership for a known platform user identity,
**Then** the cashier role is granted or revoked only within that tenant.
**And** if the target user does not exist, return refusal `USER_NOT_FOUND`.
**And** cross-tenant target modifications are refused with `TARGET_NOT_IN_TENANT`.
**And** non-membership or unauthorized actor actions are refused with `NOT_A_MEMBER` or `NOT_AUTHORIZED_FOR_ACTION`.
**And** these actions write audit events via the Epic 1 audit write path.

### Story 4.3: Read-Only Auditor Access

As an auditor,
I want read-only access to vouchers, redemptions, and config history for assigned tenants,
So that I can review compliance without making changes.

**Acceptance Criteria:**

**Given** an auditor membership for a tenant,
**When** they access GET-only endpoints for vouchers, redemptions, or config history,
**Then** data is read-only and scoped to that tenant.
**And** mutation routes return refusal `NOT_AUTHORIZED_FOR_ACTION`.
**And** auditor cannot access platform admin routes (401/403).
**And** auditor reads emit an audit/access event (or structured log) including actor_id, tenant_id, correlation_id.

### Epic 5: Audit Surfaces + Exports (MVP)
Tenant-scoped export endpoints plus audit viewing surfaces for authorized roles.
**FRs covered:** FR38–FR39 (plus read surfaces for FR33–FR34)

## Epic 5: Audit Surfaces + Exports (MVP)

Tenant-scoped export endpoints plus audit viewing surfaces for authorized roles.
These endpoints use refusal semantics; platform admin endpoints use 401/403 (per Epic 1).

### Story 5.1: Tenant-Scoped Voucher Export

As an auditor or district admin,
I want to export a tenant-scoped voucher list,
So that I can perform audit and reconciliation support tasks.

**Acceptance Criteria:**

**Given** an authorized auditor or district admin membership,
**When** they request a voucher export for the active tenant,
**Then** the export includes only that tenant’s vouchers and includes correlation_id in response headers.
**And** export format is CSV (UTF-8) with a pinned header row.
**And** pinned columns include: voucher_id, issued_at, status, voucher_type, identity_key (or masked name fields), amount/limits (if applicable), redeemed_at, receipt_id, gross_total (if captured), voided_at, tenant_id (optional internal).
**And** exports are bounded (default last 90 days); requests beyond the hard cap are refused `EXPORT_TOO_LARGE`.
**And** if actor lacks membership/assignment in active tenant, refuse `NOT_A_MEMBER`.
**And** unauthorized actors are refused with `NOT_AUTHORIZED_FOR_ACTION`.
**And** export access is logged (audit or structured log).

### Story 5.2: Reconciliation Summary Export (MVP)

As an auditor or district admin,
I want a tenant-scoped reconciliation summary export,
So that I can reconcile issued vs redeemed vouchers from available data.

**Acceptance Criteria:**

**Given** redemption data for a tenant,
**When** a reconciliation summary export is requested,
**Then** the export includes count_issued, count_redeemed, count_voided, count_expired, sum_gross_total (if captured), and a date range.
**And** export format is CSV (UTF-8).
**And** the export is tenant-scoped only.
**And** if actor lacks membership/assignment in active tenant, refuse `NOT_A_MEMBER`.
**And** unauthorized actors are refused with `NOT_AUTHORIZED_FOR_ACTION`.

### Story 5.3: Audit Event Viewing (Read-Only)

As an auditor or district admin,
I want to view audit events for an assigned tenant,
So that I can review issuance, overrides, redemption, and config changes.

**Acceptance Criteria:**

**Given** an authorized auditor or district admin,
**When** they query audit events for the active tenant,
**Then** results are read-only, tenant-scoped, and include correlation_id and event_id.
**And** supports filter by date range and event_type with default last 30 days.
**And** results are ordered newest-first and paginated.
**And** retention defaults are enforced per NFR policy and documented.
**And** if actor lacks membership/assignment in active tenant, refuse `NOT_A_MEMBER`.
**And** write attempts return refusal `NOT_AUTHORIZED_FOR_ACTION`.

### Epic 6: Migration + Cutover Readiness
Historical voucher migration, parity validation, and 30-day WP read-only enforcement.
**FRs covered:** FR35–FR37b

## Epic 6: Migration + Cutover Readiness

Historical voucher migration, parity validation, and 30-day WP read-only enforcement.

### Story 6.1: WP Export + Transform (Historical Vouchers)

As a migration lead,
I want a repeatable export + transform pipeline for historical vouchers,
So that data continuity is preserved without ambiguous tenant mapping.

**Acceptance Criteria:**

**Given** WP voucher data,
**When** export and transform are run,
**Then** vouchers are mapped to explicit `tenant_id = store_id` with a hard fail on ambiguous mapping.
**And** export produces a versioned artifact directory `exports/<batch_id>/` with a manifest (row counts per tenant, checksum per file).
**And** transform is deterministic: same input → same output files and checksums.
**And** transform refuses if tenant mapping table is missing or ambiguous for any row.
**And** mapping is driven by an explicit store mapping file/table (e.g., `migration/store_map.csv` or `platform.tenants` host→tenant_id) used as an input.
**And** prerequisites are documented: Epic 1 host resolution/refusal reasons locked and tested.

### Story 6.2: Import + Parity Validation (Per Tenant)

As a migration lead,
I want a tenant-scoped import with parity validation,
So that cutover proceeds only when counts and samples match.

**Acceptance Criteria:**

**Given** transformed voucher batches,
**When** import runs,
**Then** per-tenant counts match between source and destination.
**And** spot checks include oldest + newest voucher per tenant; if tenant > N vouchers, add 5 random sample rows with a fixed seed.
**And** import batches are idempotent by `(tenant_id, source_voucher_id)` with a unique constraint; re-import updates nothing (no duplicates).
**And** if source IDs are not stable, `source_voucher_id` is computed as a hash of immutable source fields.
**And** parity failures block cutover.
**And** export artifacts and parity report formats from Epic 5 are available as prerequisites.

### Story 6.3: WP Read-Only Enforcement (30 Days)

As a release manager,
I want WP locked to read-only during the reference window,
So that no legacy writes occur after cutover.

**Acceptance Criteria:**

**Given** the 30-day reference window,
**When** write attempts occur,
**Then** plugin gate + capability strip + MariaDB enforcement blocks all writes and alerts are generated.
**And** alerting MVP is a log line with `legacy_write_blocked=true` and captured timestamp, actor (if available), and action type.
**And** preferred MariaDB enforcement is privilege revoke on plugin tables; fallback is BEFORE triggers.
**And** a verification step proves enforcement is active (attempted write is blocked).
**And** success condition is 0 successful legacy writes.
**And** rollback posture is pause writes + re-import (no dual-run).

### Story 6.4: Cutover Runbook + Evidence Log

As a release manager,
I want a documented cutover runbook and evidence log,
So that execution is consistent and auditable.

**Acceptance Criteria:**

**Given** cutover readiness,
**When** the runbook is used,
**Then** it captures export batch id, checksums, per-tenant counts, import batch id, validation pass/fail, cutover timestamp, and reference window end timestamp.
**And** evidence log is a single append-only file per cutover: `cutover/evidence-<date>.md` (or JSON).
**And** it references release gates from Epic 1 (operational) and Epic 5 (exports/parity artifacts).

## Epic 1: Tenant Spine + Platform Registry + Platform Admin (Day-0)

Tenant resolution is enforceable; platform registry is authoritative; platform admin can provision tenants/apps; observability proves enforcement.

### Story 1.0: Initialize VoucherShyft Monorepo Scaffold

As a platform engineer,
I want the starter template scaffold in place,
So that all subsequent stories implement within the approved architecture.

**Acceptance Criteria:**

**Given** the approved architecture stack (Next.js + Fastify + Postgres + Compose),
**When** the repo is initialized,
**Then** monorepo structure, docker compose, and baseline config exist and build.
**And** OpenAPI generation from route schemas is available for later stories.

### Story 1.1: Host-Based Tenant Resolution + Refusal Reasons

As a platform operator,
I want tenant context derived only from host + JWT and explicit refusal reasons,
So that tenant isolation is enforceable without enumeration.

**Acceptance Criteria:**

**Given** a request to a tenant host matching `{tenant_slug}.voucher.{root_domain}`,
**When** the host matches `platform.tenants.host` exactly and JWT tenant claim matches the resolved `tenant_id`,
**Then** the request executes in that tenant context and no tenant IDs are accepted from body/query.
**And** unknown host returns HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` with correlation_id.
**And** host/JWT mismatch returns HTTP 200 refusal `{ success:false, reason:"TENANT_CONTEXT_MISMATCH" }`.
**And** non-membership returns HTTP 200 refusal `{ success:false, reason:"NOT_A_MEMBER" }`.
**And** unknown host refusal does not differ in message shape or status from disabled-app refusal; tests verify identical external envelope/reason.
**And** a tenant isolation test case is added covering the three refusal reasons.

### Story 1.2: Platform Registry + App Enablement Enforcement

As a platform admin,
I want authoritative tenant/app enablement enforced at the API boundary,
So that disabled tenants cannot access VoucherShyft and enablement is auditable.

**Acceptance Criteria:**

**Given** `platform.tenants` and `platform.tenant_apps`,
**When** app enablement is evaluated on every request,
**Then** disabled tenants return HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` and internal logs record `APP_DISABLED`.
**And** platform admin endpoints for tenant/app provisioning require 401/403 on access denial (not refusals).
**And** OpenAPI includes admin routes and is generated from the same Fastify route schemas used for validation.
**And** CI drift check runs in the repo (no deployment required).

### Story 1.3: Correlation IDs + Refusal/Error Metrics Split

As an operator,
I want correlation IDs and refusal/error metrics split at the API boundary,
So that tenancy enforcement and business denials are observable from day one.

**Acceptance Criteria:**

**Given** any API response,
**When** it is returned to the client,
**Then** it includes a correlation_id.
**And** refusals are tracked separately from errors in structured logs (e.g., outcome=refusal|error|success and reason=...).
**And** at least one test asserts the structured refusal vs error fields exist.

### Story 1.4: Minimal Audit Write Path (Append-Only)

As a compliance steward,
I want append-only audit events written for tenant/auth/admin actions,
So that later voucher workflows inherit auditability without rework.

**Acceptance Criteria:**

**Given** tenant resolution outcomes (success/refusal reason), app enablement refusals, or admin create/enable actions,
**When** those actions occur,
**Then** an append-only audit event is written with event_id, actor, tenant, timestamp, reason (if applicable), and correlation_id.
**And** audit write failure is treated as an error for admin actions.
**And** a test asserts audit event creation for at least one admin action.

### Story 1.5: Operational Gates Hooks (Release-Blocking)

As a release manager,
I want droplet Postgres operational gates represented in docs/CI hooks,
So that release readiness includes backup/restore and alert thresholds.

**Acceptance Criteria:**

**Given** the cutover and ops requirements,
**When** Epic 1 is completed,
**Then** documentation/runbook hooks exist for nightly backups, weekly full backups, monthly restore drills, disk alert at 80%, and IO wait >20% for 5 minutes.
**And** a release-gate checklist file exists (e.g., docs/RELEASE_GATES.md) and CI fails if it is missing.

## Epic 2: Steward Voucher Issuance + Duplicate Governance

Stewards can issue vouchers within policy, with duplicate checks and authorized overrides.

### Story 2.1: Issue Voucher (Allowed Types + Identity Minimums)

As a steward,
I want to issue a voucher within my tenant using only allowed voucher types,
So that the request complies with conference policy and tenant rules.

**Acceptance Criteria:**

**Given** steward access within an active tenant and allowed voucher types configured (FR31–FR32 dependency),
**When** the steward submits a voucher issuance with minimum required identity fields (identity_key computed deterministically from configured identity fields),
**Then** the system issues the voucher and records an immutable authorization snapshot.
**And** voucher issuance is refused with reason `VOUCHER_TYPE_NOT_ALLOWED` if the voucher type is not allowed for the tenant.
**And** voucher issuance is refused with reason `VALIDATION_FAILED` when required fields are missing or invalid.
**And** issuance responses include correlation_id.
**And** issuance supports an optional idempotency key; repeated submissions with the same key do not create multiple vouchers.
**And** issuance writes an audit event via the Epic 1 audit write path (must exist before this story ships).

### Story 2.2: Duplicate Detection (Policy Window)

As a steward,
I want the system to check for duplicates within the policy window,
So that vouchers are not re-issued in violation of policy.

**Acceptance Criteria:**

**Given** a voucher issuance request within a tenant,
**When** matching criteria (identity_key + voucher_type + window) indicate a duplicate in the policy window,
**Then** the system returns HTTP 200 refusal `{ success:false, reason:"DUPLICATE_IN_WINDOW" }` with correlation_id.
**And** duplicate checks do not cross tenant boundaries.
**And** a test verifies duplicate detection behavior within a tenant.

### Story 2.3: Authorized Override with Reason + Audit

As an authorized steward or admin,
I want to override a duplicate block with a required reason,
So that legitimate exceptions are recorded and traceable.

**Acceptance Criteria:**

**Given** a duplicate detection refusal,
**When** an authorized role submits an override with a reason,
**Then** the voucher can be issued and the override reason is stored.
**And** unauthorized override attempts return a refusal with reason `OVERRIDE_NOT_PERMITTED`.
**And** empty override reasons return a refusal with reason `VALIDATION_FAILED`.
**And** overrides write an audit event via the Epic 1 audit write path (must exist before this story ships).

### Story 2.4: Voucher Lookup, Status, and Void (Tenant-Scoped)

As a steward,
I want to look up voucher status and void a voucher when authorized,
So that I can confirm eligibility and correct mistakes within my tenant.

**Acceptance Criteria:**

**Given** a voucher ID or captured voucher fields within a tenant,
**When** a steward performs lookup,
**Then** the system returns the voucher status (active/redeemed/expired/voided) scoped to that tenant.
**And** voucher not found in the active tenant returns refusal `{ success:false, reason:"VOUCHER_NOT_FOUND" }` with correlation_id and does not reveal cross-tenant existence.
**And** authorized roles can void a voucher with a reason; unauthorized roles are refused with reason `VOID_NOT_PERMITTED`.
**And** void is idempotent: voiding an already-voided voucher returns success with current status.
**And** void actions write an audit event via the Epic 1 audit write path (must exist before this story ships).
