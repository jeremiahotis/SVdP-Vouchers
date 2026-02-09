---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - _bmad-output/planning-artifacts/voucher-shyft-prd.md
  - _bmad-output/planning-artifacts/voucher-shyft-architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-02-09.md
---

# SVdP-Vouchers - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SVdP-Vouchers, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

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
FR13: App enablement is controlled by the platform tenant registry (platform.tenant_apps).
FR14: Disabled tenants receive a refusal state (per FR0) for VoucherShyft routes (no partial access).
FR15: App enablement is evaluated on every request that requires VoucherShyft access.
FR40: Partner embedded issuance + lookup uses a tenant-scoped, partner-agency token (no user account required); token limited to issue + lookup own vouchers only; form-specific per partner; no auto-expiry; rotate/revoke by admin; default rate limit 20 req/min per token.
FR16: Stewards can initiate and issue vouchers within allowed voucher types for their tenant (or initiate-only if issuance is restricted by role).
FR17: System records immutable authorization snapshots at issuance.
FR18: System supports voucher lookup by voucher ID and by captured voucher fields (name/phone/etc as stored) within tenant scope.
FR19: System supports voucher voiding with reason capture (authorized roles only).
FR20: System presents voucher status (active, redeemed, expired, voided) within tenant scope.
FR21: System checks duplicates within the configured policy window using defined matching criteria (voucher type + identity key) during issuance and returns a refusal or warning per policy.
FR22: System provides an override path for authorized roles only.
FR23: Overrides require reason capture and are written to the audit log.
FR24: System refuses (per FR0) override attempts from unauthorized roles.
FR25: Cashiers can redeem vouchers within their tenant context.
FR26: Redemption requires receipt_id; gross_total required when Manual gross capture mode is enabled (default in MVP until POS import is live).
FR27: System records redemption metadata (who, when, receipt_id, gross_total if applicable).
FR28: System refuses (per FR0) redemption when voucher is expired or already redeemed.
FR29: Store Admins can manage tenant-scoped catalog availability (categories/items).
FR30: Store Admins can manage tenant-scoped rules text and redemption hours.
FR31: System enforces allowed voucher types per tenant at request time.
FR32: Configuration changes apply immediately within tenant scope.
FR0: Business denials return HTTP 200 with { success:false, reason } and are tracked separately from errors; errors use non-200 or { success:false, error } per API standard.
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

NFR1: Issue voucher p95 <= 2.0s on broadband.
NFR2: Issue voucher p95 <= 4.0s on slow 3G.
NFR3: Redeem voucher p95 <= 1.5s on broadband.
NFR4: Redeem voucher p95 <= 3.0s on slow 3G.
NFR5: Search/lookup p95 <= 800ms for ID lookup (tenant-scoped), broadband.
NFR6: Search/lookup p95 <= 1.5s for name/field search (tenant-scoped), broadband.
NFR7: p95 measured end-to-end from UI submit click to UI confirmation rendered, including API + DB.
NFR8: Performance targets hold at >= 25 concurrent active users system-wide.
NFR9: PII minimization: only required fields; no sensitive free-text by default; configurable retention for optional notes.
NFR10: Voucher records retained 7 years (or org-defined).
NFR11: Request logs containing PII retained <= 30 days.
NFR12: Audit events retained >= 7 years (or org-defined).
NFR13: Auth is JWT-based; tenant context derived from host + JWT tenant claim match only; membership required for access.
NFR14: Append-only audit events include actor, tenant, timestamp, and reason where applicable for issuance/override/redemption/void/config changes.
NFR15: TLS 1.2+ in transit; encryption at rest for DB/backups; secrets stored in secrets manager/env, not source control.
NFR16: Backups encrypted at rest and restore test performed monthly (quarterly acceptable MVP).
NFR17: Availability 99.5% monthly for issue/redeem APIs; planned maintenance announced >= 24 hours in advance, total <= 4 hours/month.
NFR18: Redemption idempotent on (tenant_id, voucher_id); duplicate submissions return existing redemption record.
NFR19: Cutover only if 100% per-tenant parity checks pass (counts + spot-checks); rollback is pause writes + re-import, not dual-run.
NFR20: During 30-day WP reference window, 0 successful legacy writes; attempted writes blocked and alerts generated.
NFR21: Supports up to 50 store tenants without architectural change.
NFR22: Supports up to 500 total users and up to 50 concurrent sessions.
NFR23: Supports up to 500k vouchers while meeting p95 targets via indexing and tenant-scoped queries.
NFR24: WCAG 2.1 AA target for web app.
NFR25: Critical flows (issue voucher, redeem voucher, tenant switching, login, export) guaranteed AA.
NFR26: Keyboard-only operation for critical flows; no color-only meaning; visible focus; form errors programmatically associated.
NFR27: Every request has a correlation ID returned to client and logged server-side.
NFR28: Refusals counted separately from errors; dashboards show refusal rate by reason, error rate, and latency p95 per endpoint.
NFR29: Audit events queryable per tenant for authorized roles; exportable for support/audit.
NFR30: Versioned API base path with documented backward-compat guarantees for a major version.
NFR31: Rate limits per tenant: default 60 req/min/user; service accounts configurable (e.g., 300 req/min) with burst control; partner tokens default 20 req/min per token.
NFR32: Requests over limit return HTTP 429 with Retry-After.
NFR33: Breaking changes require new major version; deprecation notice >= 90 days for public/integration endpoints.

### Additional Requirements

- Starter stack: Next.js 16.1.x + Fastify v5 + PostgreSQL 17.x + Caddy + Docker Compose on a single DigitalOcean droplet (Option A).
- Use SQL migrations + lightweight query builder (Knex); canonical schema in SQL; no model magic bypassing tenant helpers.
- Input validation via Zod plus DB constraints (tenant scoping, uniqueness, foreign keys, irreversible state invariants).
- Add tenant-scoped partner_agencies and partner_tokens; vouchers issued via partner tokens record partner_agency_id.
- Human auth via platform-issued JWT only; VoucherShyft does not issue user JWTs; service tokens are tenant-scoped and must pass tenant-asserting middleware (no bypass).
- Tenant host resolution uses exact host match in platform.tenants; unknown host or host/JWT mismatch returns refusal; tenant switch requires host change.
- Partner embedded token constraints: form-specific; no auto-expiry; admin rotation/revocation only; default 20 req/min per token; audit logs include partner agency.
- REST-only API with versioned base path; OpenAPI generated from route schemas.
- Refusal contract enforced at API boundary for all endpoints.
- Security middleware: same-origin only (CORS off); strict Caddy headers (HSTS/CSP/X-Content-Type-Options/Referrer-Policy); WAF deferred to Phase 2.
- Rate limiting middleware per-tenant/per-user; in-process limits acceptable for MVP; Redis later if needed.
- Service-to-service communication is HTTP JSON only (no event bus MVP).
- Tenant isolation tests are release-blocking and must run in CI against real Postgres (no mocks).
- Postgres-on-droplet operational gates are release-blocking.
- UI/UX: cashiers use touch-first POS with scanner-friendly inputs and 44px targets; steward/admin flows mouse/keyboard-first; no offline mode; "Working" state within 150-250ms with safe retries and idempotent redemption.
- UX refusal vs error: refusals are neutral with next-step guidance; errors show "system problem", correlation_id, and retry guidance.
- Accessibility/responsive: WCAG 2.1 AA baseline; visible focus; reduced motion; 200% zoom support; mobile mutations (redeem/void/override) not allowed by default; read-only mobile support view required.
- Modals only for confirmations/overrides; override modal requires reason capture and shows tenant + issuer context.
- CI/tests: add partner-token issuance + lookup scope + rate-limit tests; update CI gates accordingly.

### FR Coverage Map

FR0: Epic 1 - Refusal vs error contract
FR1: Epic 1 - Tenant context derived from host/JWT only
FR2: Epic 1 - One-tenant-per-request execution
FR3: Epic 1 - Refusal on host/JWT tenant mismatch
FR4: Epic 1 - Refusal on missing membership
FR5: Epic 1 - Role assignments per tenant
FR6: Epic 1 - Store Admin invite/disable cashiers
FR7: Epic 1 - District Admin elevated permissions per tenant
FR8: Epic 1 - Auditor read-only access
FR8b: Epic 1 - Integration role read-only
FR9: Epic 1 - Cross-tenant users limited to memberships
FR10: Epic 1 - Tenant switching via host change
FR11: Epic 1 - Active tenant displayed on mutating actions
FR12: Epic 1 - Refuse writes if tenant invalid/membership missing
FR13: Epic 1 - App enablement via platform.tenant_apps
FR14: Epic 1 - Disabled tenants refused
FR15: Epic 1 - App enablement evaluated per request
FR40: Epic 1 - Partner token access for embedded issuance/lookup
FR16: Epic 2 - Steward issuance within allowed types
FR17: Epic 2 - Immutable authorization snapshots
FR19: Epic 2 - Voucher voiding with reason capture
FR21: Epic 2 - Duplicate checks during issuance
FR22: Epic 2 - Override path for authorized roles
FR23: Epic 2 - Override reason captured + audit
FR24: Epic 2 - Refuse unauthorized overrides
FR18: Epic 3 - Voucher lookup by ID/fields
FR20: Epic 3 - Voucher status presentation
FR29: Epic 4 - Tenant-scoped catalog management
FR30: Epic 4 - Tenant-scoped rules text + redemption hours
FR31: Epic 4 - Enforce allowed voucher types per tenant
FR32: Epic 4 - Config changes apply immediately
FR25: Epic 5 - Cashier redemption
FR26: Epic 5 - Receipt_id and gross_total rules
FR27: Epic 5 - Redemption metadata capture
FR28: Epic 5 - Refuse redemption on expired/redeemed
FR33: Epic 5 - Append-only audit events
FR35: Epic 5 - Historical voucher import + parity validation
FR36: Epic 5 - Export artifacts for migration/audit
FR37: Epic 5 - Hard cutover runbook + validation
FR37a: Epic 5 - Block WP writes during reference window
FR37b: Epic 5 - WP reference window duration + archive
FR38: Epic 5 - Tenant-scoped voucher list export
FR39: Epic 5 - Reconciliation summary export
FR34: Epic 1 - Correlation IDs + refusal/error split

## Epic List

### Epic 1: Tenant Spine & Access Control
Enable secure tenant context, app enablement, and access enforcement, including partner token access.
**FRs covered:** FR0, FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR8b, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR34, FR40

### Epic 2: Voucher Issuance & Governance
Enable voucher issuance, duplicate policy enforcement, override governance, and voucher voiding.
**FRs covered:** FR16, FR17, FR19, FR21, FR22, FR23, FR24

### Epic 3: Voucher Lookup & Status
Enable lookup by ID/fields and display voucher status with partner scope respected.
**FRs covered:** FR18, FR20

### Epic 4: Tenant Admin & Partner Management
Enable tenant configuration, catalog/rules management, and partner agency token + embed form management.
**FRs covered:** FR29, FR30, FR31, FR32

### Epic 5: Store Operations & Compliance (Redemption + Audit/Exports + Cutover)
Enable voucher redemption plus audit, export, and cutover support for compliance.
**FRs covered:** FR25, FR26, FR27, FR28, FR33, FR35, FR36, FR37, FR37a, FR37b, FR38, FR39

## Epic 1: Tenant Spine & Access Control

Enable secure tenant context, app enablement, and access enforcement, including partner token access.

### Story 1.0: Initialize VoucherShyft Monorepo Scaffold

As a platform engineer,
I want the starter template scaffold in place,
So that all subsequent stories implement within the approved architecture.

**Acceptance Criteria:**

**Given** the approved architecture stack (Next.js + Fastify + Postgres + Compose),
**When** the repo is initialized,
**Then** monorepo structure, Docker Compose, and baseline config exist and build.
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
**Then** it includes a `correlation_id`.
**And** refusals are tracked separately from errors in structured logs (e.g., `outcome=refusal|error|success` and `reason=...`).
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
**And** a release-gate checklist file exists (e.g., `docs/RELEASE_GATES.md`) and CI fails if it is missing.

### Story 1.6: Partner Token Access (Embedded Issuance + Lookup)

As a platform operator,
I want partner tokens to establish tenant + partner context with scoped permissions,
So that partners can issue and lookup vouchers without user accounts and without cross-tenant access.

**Acceptance Criteria:**

**Given** a request to a tenant host with a valid, active, form-specific partner token,
**When** the token is verified,
**Then** the request context includes `tenant_id` and `partner_agency_id` and does not require a user JWT.
**And** partner-token requests are limited to issuance + lookup routes; other routes are refused.
**And** partner-token lookup only returns vouchers issued by that partner agency; otherwise refused.
**And** audit/log events for partner-token issuance/lookup include `partner_agency_id` attribution.
**And** partner-token requests exceeding 20 req/min return HTTP 429 with `Retry-After`.

## Epic 2: Voucher Issuance & Governance

Enable voucher issuance, duplicate policy enforcement, override governance, and voucher voiding.

### Story 2.1: Issue Voucher (Role-Scoped, Partner-Aware)

As a steward or partner agent,
I want to issue vouchers within allowed types,
So that eligible requests become valid vouchers with immutable authorization snapshots.

**Acceptance Criteria:**

**Given** a steward with issuance permission in a tenant,
**When** they submit an issuance for an allowed voucher type,
**Then** a voucher is issued and an immutable authorization snapshot is recorded.
**And** initiate-only roles create a request record without issuing an active voucher and the response indicates pending status.
**And** partner token issuance succeeds for allowed types with `partner_agency_id` attribution and no user JWT required.

### Story 2.2: Duplicate Detection (Policy Window)

As a steward or partner agent,
I want duplicate detection during issuance,
So that policy is enforced consistently across partners and staff.

**Acceptance Criteria:**

**Given** an issuance request within the configured duplicate policy window,
**When** a duplicate is detected using the defined criteria (voucher type + identity key),
**Then** the system returns a refusal or warning per policy.
**And** the refusal/warning response uses the standard refusal envelope and is tenant-scoped only.

### Story 2.3: Override Path with Reason Capture

As an authorized steward or admin,
I want to override duplicate refusals with a reason,
So that exceptions are allowed but auditable.

**Acceptance Criteria:**

**Given** a duplicate refusal,
**When** an authorized role submits an override with a reason,
**Then** issuance proceeds and the override reason is recorded in the audit log.
**And** unauthorized users or partner tokens attempting an override are refused and no issuance occurs.

### Story 2.4: Voucher Voiding with Reason Capture

As an authorized steward or admin,
I want to void a voucher with a required reason,
So that invalid or rescinded vouchers are tracked and auditable.

**Acceptance Criteria:**

**Given** an authorized role and an active voucher,
**When** a void is submitted with a reason,
**Then** the voucher is marked voided and the reason is recorded in the audit log.
**And** unauthorized users or partner tokens attempting a void are refused.

## Epic 3: Voucher Lookup & Status

Enable lookup by ID/fields and display voucher status with partner scope respected.

### Story 3.1: Voucher Lookup (ID + Fields)

As a steward, cashier, or partner agent,
I want to look up vouchers by ID or captured fields,
So that I can retrieve voucher details within tenant scope.

**Acceptance Criteria:**

**Given** a tenant user,
**When** they lookup by voucher ID or stored fields (name/phone/etc),
**Then** matching vouchers within the tenant are returned.
**And** partner token lookups return only vouchers issued by that partner agency; others are refused or excluded.

### Story 3.2: Voucher Status Presentation

As a steward, cashier, or partner agent,
I want voucher status (active/redeemed/expired/voided) returned on lookup,
So that I can take the appropriate next action.

**Acceptance Criteria:**

**Given** a voucher lookup result,
**When** the response is returned,
**Then** it includes current status (active, redeemed, expired, voided) in the payload.

## Epic 4: Tenant Admin & Partner Management

Enable tenant configuration, catalog/rules management, and partner agency token + embed form management.

### Story 4.1: Tenant Configuration Management

As a store admin,
I want to manage tenant-scoped catalog availability, rules text, and redemption hours,
So that voucher behavior matches store policy.

**Acceptance Criteria:**

**Given** a store admin,
**When** they update catalog availability or rules text or redemption hours,
**Then** the changes apply immediately within that tenant.
**And** allowed voucher types are enforced per tenant configuration.

### Story 4.2: Partner Agency Management

As a store admin,
I want to create and manage partner agencies,
So that partners can be scoped and configured per tenant.

**Acceptance Criteria:**

**Given** a store admin,
**When** they create, edit, or deactivate a partner agency,
**Then** the partner agency is stored tenant-scoped and reflected in admin lists.

### Story 4.3: Partner Tokens + Embed Code Generation

As a store admin,
I want to generate partner tokens and embed code per partner agency,
So that partners can issue and look up vouchers on their website without accounts.

**Acceptance Criteria:**

**Given** a store admin and an active partner agency,
**When** they create or rotate a token,
**Then** a form-specific token is generated and only active tokens are valid.
**And** the admin UI provides embeddable form code including the token and partner-specific settings.

### Story 4.4: Partner Form Customization

As a store admin,
I want partner-specific form customization,
So that each partner’s embedded form matches their allowed voucher types and messaging.

**Acceptance Criteria:**

**Given** a partner agency,
**When** the admin configures allowed voucher types, intro text, and rules list,
**Then** the embedded form reflects those settings in the correct positions.
**And** intro text renders as a `<p>` near the top of the form; rules render as `<ul>` above the name collection field.

## Epic 5: Store Operations & Compliance (Redemption + Audit/Exports + Cutover)

Enable voucher redemption plus audit, export, and cutover support for compliance.

### Story 5.1: Voucher Redemption (Receipt Capture)

As a cashier,
I want to redeem a voucher with required receipt metadata,
So that redemption is recorded accurately and idempotently.

**Acceptance Criteria:**

**Given** a cashier in tenant context,
**When** they redeem a valid active voucher,
**Then** redemption is recorded with receipt_id (and gross_total if manual capture mode is enabled).
**And** redemption is refused if the voucher is expired or already redeemed.
**And** repeat redemption on the same voucher returns the existing redemption (idempotent).

### Story 5.2: Audit Events for Voucher Actions

As a compliance steward,
I want audit events for issuance, overrides, redemption, voids, and config changes,
So that all voucher actions are traceable.

**Acceptance Criteria:**

**Given** issuance, override, redemption, void, or config change actions,
**When** they occur,
**Then** append-only audit events are written with actor, tenant, timestamp, reason, and correlation_id.

### Story 5.3: Migration Import + Parity Validation

As a migration operator,
I want to import historical vouchers with parity validation,
So that cutover can be verified per tenant.

**Acceptance Criteria:**

**Given** historical voucher data for a tenant,
**When** import is executed,
**Then** parity validation reports count + spot-check results and blocks cutover unless 100% passes.

### Story 5.4: Cutover Controls + WP Write Block

As a release manager,
I want cutover controls that block legacy WP writes during the 30-day window,
So that the system enforces zero legacy writes before archive.

**Acceptance Criteria:**

**Given** the 30-day WP reference window is active,
**When** a legacy write attempt occurs,
**Then** it is blocked and an alert is recorded, and success condition is 0 successful writes.

### Story 5.5: Exports (Voucher List + Reconciliation Summary)

As an auditor or support staff,
I want tenant-scoped exports of voucher lists and reconciliation summaries,
So that audits and support requests are fulfilled.

**Acceptance Criteria:**

**Given** an authorized tenant user,
**When** they request exports,
**Then** voucher list and reconciliation summary exports are generated tenant-scoped.