---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - ecosystem-rule-book.md
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-02-02.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/tech-spec.md
  - SCOPE.md
  - DATA_DICTIONARY.md
  - MIGRATION.md
  - POS_CSV_CONTRACT.md
  - UI_STATES.md
  - TEST_PLAN.md
  - README.md
  - db/migrations/README.md
  - _bmad-output/planning-artifacts/ui/shyft_ux_design_and_brand_system_source_of_truth_v_1.md
  - _bmad-output/planning-artifacts/ui/system-invariants.md
  - _bmad-output/planning-artifacts/ui/shyft_ux_do_dont_appendix_v_1.md
  - _bmad-output/planning-artifacts/ui/decision-surface-review-checklist.md
  - _bmad-output/planning-artifacts/ui/ui/guided-steward-decision-form.md
workflowType: 'prd'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 20
classification:
  projectType: saas_b2b
  domain: general
  complexity: high
  projectContext: brownfield
date: '2026-02-03'
---

# Product Requirements Document - VoucherShyft

**Author:** Jeremiah
**Date:** 2026-02-02

## Executive Summary

VoucherShyft is a standalone Shyft Ecosystem module that replaces the WordPress plugin with a tenant‑safe SaaS platform. Stores are tenants (`tenant_id = store_id`), tenant context is derived from host + JWT claim match only, and cross‑tenant users operate via explicit membership with safe switching. The MVP proves the end‑to‑end voucher lifecycle (issue → redeem → lookup) with immutable authorization snapshots, refusal‑first policy outcomes, and a hard cutover backed by a 30‑day WP read‑only reference window. The product differentiator is dignity‑first workflows that reduce staff friction while enforcing clear rules and auditability. **Tenant Context Policy (TCP):** all tenant context statements below refer to the Tenant Model in “SaaS B2B Specific Requirements.”

## Success Criteria

### User Success
- **Voucher creation is fast and reliable:** a steward can issue a standard voucher in **under 2 minutes** end-to-end, with **no re-entry** of catalog rules and **no workarounds** needed.
- **Cashier redemption adds minimal friction:** requires only voucher lookup + receipt_id (**+ gross_total during MVP if import not live**); failed redemptions due to software/process issues **< 0.5%** (excludes policy refusals).
- **Fewer mistakes and reversals:** **< 1%** of vouchers require staff correction due to wrong store/tenant, wrong person, or wrong voucher type; overrides are rare and traceable.
- **Search and lookup are dependable:** voucher lookup **p95 ≤ 10 seconds** in normal conditions; duplicate detection prevents re‑issuing within the policy window with **< 1% false blocks**.
- **Admins can operate without IT:** store-level configuration (allowed voucher types, catalog availability, hours/rules text) is editable in **< 5 minutes**, with changes taking effect immediately and safely per store.
- **Policy refusals are expected and tracked separately from system errors and process failures.**

### Business Success
**3 months**
- **Cutover succeeds cleanly:** historical vouchers migrated with **per‑store parity**, and WordPress operates **reference‑only for 30 days** without drift incidents.
- **Multi‑tenant expansion works quickly:** onboard **2–5 additional store tenants within 1 business day each** without code changes; cross‑tenant users operate safely across them.
- **Operational load drops:** measurable reduction in “where is this voucher” calls and manual reconciliation time.

**12 months**
- **Standardized, portable module:** VoucherShyft becomes a reusable Shyft module with stable contracts for other modules and external partners.
- **Stronger governance and trust:** demonstrable tenant isolation and auditability reduces risk posture and enables partner adoption.
- **Lower total cost / faster change:** new voucher types or policy changes can ship routinely (not as special events).

### Technical Success
- **Tenant isolation is structural:** stores are tenants (`tenant_id = store_id`); no API path can access cross‑tenant data; isolation is proven by tests and enforced in DB access patterns.
- **Cross‑tenant users are safe:** users can have memberships across tenants, but every request executes in exactly **one tenant context** (per TCP), with membership‑scoped authorization.
- **Refusal semantics are consistent:** business denials return HTTP 200 with `{ success:false, reason }` and are observable/metric’d separately from errors.
- **RLS/helpers discipline:** DB access occurs only through tenant‑asserted helpers / request‑scoped transactions; **enforced via code-level restriction + CI gate** that fails on non-helper DB access patterns.
- **Same‑origin browser flows:** production does not depend on CORS; web app and API are same‑origin per tenant.
- **Cutover safety:** hard cutover is supported by **30‑day WP read‑only reference mode** with a **4‑layer enforcement stack** (plugin gate, capability strip, MariaDB write prevention, operational controls) and migration parity gates.

### Measurable Outcomes
- Steward voucher issuance time ≤ **2 minutes** for standard cases.
- Cashier redemption time ≤ **30 seconds** per voucher.
- Failed redemptions due to software/process issues **< 0.5%** (policy refusals excluded).
- Voucher lookup **p95 ≤ 10 seconds**.
- Cross‑tenant onboarding of **2–5 stores within 3 months**, **≤ 1 business day each**.
- **100% per‑store migration parity** (counts + spot checks) at cutover.
- **0 successful voucher writes in WP during the 30‑day reference window** (attempts must be blocked + alerted).

## Product Scope

### MVP - Minimum Viable Product
- Tenant‑safe core lifecycle: **request/issue/redeem/void/lookup** (on full tenancy spine, not a special case).
- **Cross‑tenant membership model** (internal staff) plus tenant switching that preserves **one‑tenant‑per‑request** execution (per TCP).
- **Historical voucher migration** (WP export/import) with per‑store parity validation and cutover readiness.
- Cashier/admin UI sufficient to operate day‑to‑day (no polish commitments beyond required flows).
- Observability plus refusal/error contract wired end‑to‑end.

### Growth Features (Post‑MVP)
- **POS CSV import automation** per tenant with idempotency, reconciliation dashboards, and exception queues.
- **Gross_total sourced from import** (no manual entry once import is live and reliable).
- **Stronger configuration management** per store (catalog availability windows, policy text, store hours/redemption rules, voucher templates).
- **Role/permission refinement** (district staff, store cashiers, auditors) with least‑privilege defaults.
- **Operational tenant provisioning** workflow to onboard new stores in hours (domains/hosts, keys, baseline config).
- **Basic integration hooks** (webhooks/outbox) for reporting and other Shyft modules.

### Vision (Future)
- VoucherShyft is a mature Shyft module supporting many stores and partners with strong governance: tenant isolation, clear contracts, and auditability.
- Near‑real‑time reconciliation and insight: policy adherence, utilization patterns, and outcomes **without turning people into data exhaust**.
- Deep ecosystem integration: unified identity and consent‑aligned coordination across modules with minimal staff friction and maximum dignity.

## User Journeys

### Steward issues voucher (happy path)
**User:** Maria, Vincentian steward  
**Opening scene:** Maria is on a call with a neighbor who needs help this week. She wants to issue a voucher quickly, correctly, and with minimal “form wrestling.”  
**Rising action:**  
- Maria signs in and lands in her store/tenant context.  
- She starts a new voucher and enters the minimum identity details required for issuance.  
- VoucherShyft shows only the voucher types her conference is allowed to issue.  
- She selects the voucher type and completes the minimum required fields.  
- The system checks duplicates within the policy window and flags any conflicts.  
**Climax:** Duplicate detection triggers. If authorized, Maria follows the override path (with reason captured); otherwise she stops and escalates.  
**Resolution:** Voucher is issued with an immutable authorization snapshot. Maria can share the voucher ID or print instructions immediately. She feels confident she did the right thing without creating downstream confusion.

### Cashier redeems voucher at POS (fast path + recovery)
**User:** DeShawn, cashier  
**Opening scene:** DeShawn is mid‑checkout with a line forming. A customer presents a voucher. DeShawn needs redemption to be fast, reliable, and not derail the checkout flow.  
**Rising action:**  
- DeShawn opens the redemption screen scoped to his store/tenant.  
- He scans/enters voucher ID and the system returns status: valid, expired, already redeemed, or requires review.  
- If valid, he enters receipt_id (and gross_total if required in MVP).  
- VoucherShyft confirms redemption and returns a clear success state.  
- If the voucher is not redeemable, DeShawn sees a refusal reason; if the system fails, he sees an error state with a recovery step.  
**Climax:** VoucherShyft returns “already redeemed” or “expired.” DeShawn must decide whether to pause and request help or proceed without redemption, without arguing with the customer or inventing a workaround.  
**Resolution:** Redemption completes in seconds, or a refusal provides a clean, non‑accusatory explanation and next step (“please contact issuing conference”). DeShawn feels protected from ambiguity and doesn’t feel like the bad guy.

### Admin configures store, catalog, and rules (tenant‑scoped)
**User:** Elena, store admin  
**Opening scene:** Elena needs to adjust store rules and availability: what voucher types are accepted, which catalog items are active, and what printed instructions should say, all without involving IT.  
**Rising action:**  
- Elena signs in and lands in her store/tenant admin area.  
- She reviews allowed voucher types and the conference-level constraints currently in effect.  
- She updates catalog availability (enable/disable categories/items; set constraints if supported).  
- She edits store hours and redemption rules text used in prints/views.  
- She previews the result and saves.  
**Climax:** Elena toggles a rule that affects real‑world operations (e.g., disabling a category due to stock). She needs confidence this change applies only to her store and won’t break redemption.  
**Resolution:** Changes apply immediately within her tenant only, with no cross‑store bleed. Elena feels in control and trusts the system not to surprise other stores.

### Cross‑tenant user switches tenants safely (membership‑scoped)
**User:** Jordan, district staff  
**Opening scene:** Jordan supports multiple stores. They need to review vouchers and help troubleshoot, moving between stores without accidentally acting in the wrong tenant.  
**Rising action:**  
- Jordan signs in and sees only stores they are a member of.  
- Jordan selects a store context using the approved switching mechanism.  
- Tenant context is derived from host/JWT and each action executes in exactly one tenant.  
- The app confirms the active store clearly in the UI and routes Jordan into that tenant context.  
- Jordan performs a support task (lookup, view status, confirm rules).  
- Jordan switches to another store when needed.  
**Climax:** Jordan is about to take an action (void, override, or admin edit). The system must make the active store unmistakable and refuse any action if tenant context/membership is not correct.  
**Resolution:** Jordan moves quickly between stores without second‑guessing, and the system prevents “wrong store” mistakes by design. Jordan feels safe and efficient, not nervous.

### Partner agency issues + looks up vouchers via embedded form (no user account)
**User:** Partner agency staff  
**Opening scene:** A partner agency needs to issue vouchers from their own website without creating user accounts.  
**Rising action:**  
- Partner uses a store‑provided embedded form that includes a tenant‑scoped, partner‑specific token.  
- The form enforces allowed voucher types and displays partner‑specific introduction text and rules.  
- On submit, the API issues a voucher scoped to that partner agency within the tenant.  
- Partner can look up vouchers they issued to confirm status.  
**Climax:** A lookup attempts to access a voucher not issued by that partner.  
**Resolution:** The system refuses access; partners can only issue/lookup their own vouchers. The partner can operate without accounts while tenant isolation and auditability remain intact.

### External system consumes VoucherShyft API (read/reporting)
**User:** Ravi, partner system analyst  
**Opening scene:** Ravi maintains a reporting or partner system that needs voucher redemption and reconciliation data to produce weekly summaries, without manual exports.  
**Rising action:**  
- Ravi authenticates using the approved integration credential flow.  
- The integration credential is read-only and tenant-scoped.  
- He requests read‑only data scoped to one store/tenant (or iterates over authorized tenants).  
- He consumes voucher issuance/redemption status and reconciliation summaries.  
- His system records correlation IDs for traceability on failures.  
- If a request is not permitted, he receives a refusal reason rather than an ambiguous error.  
**Climax:** The integration requests data outside its authorized scope. VoucherShyft must refuse cleanly and consistently, without leaking cross‑tenant information.  
**Resolution:** Ravi gets stable, predictable responses that support automation and auditing. He feels confident the integration won’t create security incidents or brittle edge cases.

### Journey Requirements Summary
- Tenant‑scoped context must be explicit and enforced at every user touchpoint.  
- Duplicate detection and override paths must be clear and auditable.  
- Redemption flow must be fast, with refusal reasons that protect staff from conflict.  
- Admin changes must apply immediately within a tenant without cross‑tenant side effects.  
- Cross‑tenant users need safe switching with unmistakable active‑tenant cues.  
- External integrations must be tenant‑scoped, refusal‑aware, and correlation‑ID traceable.  
- Partner embedded issuance + lookup must be token‑scoped to the partner agency’s own vouchers only.  
- Business denials are refusals (HTTP 200 `{ success:false, reason }`) and are tracked separately from errors.

## Domain-Specific Requirements

### Compliance & Regulatory
- No explicit external regulatory requirements at launch beyond standard security/privacy practices.
- Regulated requirements (HIPAA/FERPA/PCI/Gov procurement) are **out of scope unless entered later**.
- Treat all stored identity details (names/addresses/phone numbers) as PII with internal policy controls.

### Technical Constraints
- **PII minimization:** store only what is required to issue and reconcile vouchers; avoid free‑text fields that invite sensitive detail.
- **Retention policy defined upfront:**
  - Voucher records retained per operational/legal needs.
  - Logs with PII minimized and shorter retention windows.
  - Legacy WordPress retained **30 days read‑only**, then archived/offlined.
- **Audit trail depth:** append‑only events for issuance, override, redemption, void, and config changes (who/what/when/tenant).
- **Consent logging (lightweight):** optional unless shared‑data flows emerge; log consent decisions if/when data is shared across modules.
- **Export capability:** tenant‑scoped exports for audit/reconciliation/support.

### Integration Requirements
- **MVP:** no live integrations required; manual input + optional exports.
- **Early post‑MVP:** POS CSV import (idempotent) per store tenant.
- **Post‑MVP:** reporting feeds + hooks for other Shyft modules; external partner read‑only API as needed.

### Risk Mitigations
- **Incorrect tenant context:** enforce host/JWT‑derived tenant context only; unmistakable active‑tenant UI cues; refusal on membership mismatch; automated cross‑tenant access tests.
- **Policy misapplication / override abuse:** rule‑driven UI gating (allowed voucher types), duplicate detection with constrained override roles, mandatory override reasons in append‑only audit trail; reporting on override frequency.
- **Data leakage / over‑collection:** strict PII minimization, structured fields over free‑text, tenant‑scoped exports, and retention limits for logs; quarterly field review and deletion of unnecessary data.

## Innovation & Novel Patterns

### Detected Innovation Areas
- **Dignity‑first voucher workflow design:** authorization without “poverty accounting,” minimal cashier friction, and rules that prevent staff from becoming gatekeepers of humiliation.
- **Store‑as‑tenant + cross‑tenant membership:** multi‑tenant governance and safe switching in a small nonprofit ops product without enterprise bloat.
- **Refusal semantics as a product feature:** predictable “not allowed / not eligible / already redeemed” outcomes that reduce conflict and staff improvisation.
- **Immutable authorization snapshots + reconciliation split:** clean separation between “what was authorized” and “what was redeemed” without line‑item double entry.

### Market Context & Competitive Landscape
- Most voucher/aid workflows either **overfit to case‑management** (heavy forms, intrusive data capture), **underfit retail ops** (no fast redemption, weak reconciliation), or **collapse into spreadsheets** (no policy enforcement, no auditability).
- Generic POS systems don’t manage authorization policy, duplicate prevention, or refusal outcomes as first‑class behavior.

### Validation Approach
- **Dignity‑first workflow:** time studies + qualitative check‑ins: steward issuance time, cashier redemption time, and checkout conflict incidents.
- **Multi‑tenant + cross‑tenant membership:** onboard multiple stores quickly with **zero cross‑tenant leakage incidents** in tests and monitoring; measure time‑to‑onboard and “wrong store” mistakes.
- **Refusal semantics:** telemetry on refusal rates by reason and error rates separately; verify reduced manual corrections and overrides.
- **Immutable snapshots + reconciliation:** track % of vouchers reconciled automatically, time spent on exceptions, and reduction in disputes.

### Risk Mitigation
- **If minimal data is insufficient:** add structured fields gradually (not free‑text); optional extended notes with guardrails and retention limits.
- **If cross‑tenant switching causes mistakes:** default cross‑tenant actions to read‑only, require explicit elevation for writes, add stronger active‑tenant confirmations.
- **If refusal semantics confuse staff/customers:** refine refusal copy + “what to do next” scripts; fallback to limited manual override with reason for authorized roles.
- **If POS import is messy:** keep MVP manual gross_total capture longer; add exception queues; treat import as a progressively hardened feature.

## SaaS B2B Specific Requirements

### Project‑Type Overview
VoucherShyft is a multi‑tenant B2B web app + API. Stores are tenants. Every request executes in exactly one tenant context derived from host + JWT tenant claim match, never from request body/query or UI selection alone. Cross‑tenant users switch context explicitly; membership is required for access.

### Technical Architecture Considerations
- **One‑tenant‑per‑request:** no district‑wide views spanning tenants in a single request.  
- **Tenant context sources are exclusive:** host + JWT tenant claim match only.  
- **Membership‑scoped access:** explicit membership records required; no implicit district‑wide access.  
- **Tenant‑scoped identifiers:** voucher IDs may be globally unique, but lookups always enforce tenant scoping.  
- **Tenant‑scoped configuration by default:** catalogs, rules text, allowed voucher types, and import profiles are per‑tenant unless explicitly global.

### Tenant Model
- Stores are tenants (`tenant_id = store_id`).  
- Cross‑tenant users have explicit memberships and must switch context; actions only occur inside the active tenant.  
- No multi‑tenant queries or district‑wide endpoints in MVP.
**Tenant Context Policy (TCP):** tenant context is derived only from host + JWT tenant claim match; never from request body/query or client‑only switching.

### RBAC / Permission Matrix (Least‑Privilege Defaults)
- **Steward (Vincentian):** create/request vouchers within allowed types; issue vouchers if part of workflow; view vouchers they created or within scope; **no redemption, no config, no user management**.
- **Cashier:** redeem vouchers (receipt_id + gross_total if required); view eligibility/status needed for redemption; **no creation/issue, no config, no user management**.
- **Store Admin:** manage tenant config (catalog availability, rules text, templates, redemption hours); manage cashier accounts; view reconciliation dashboards; optional void/override with reason (if enabled).
- **District Admin (cross‑tenant):** read access across assigned stores for support; elevated actions only if explicitly granted and always within active tenant.
- **Auditor (read‑only):** view vouchers, redemptions, config change history, reconciliation; export reports; **no write actions**.
- **Integration (service account, tenant‑scoped):** read‑only endpoints for reporting/reconciliation initially; write endpoints only if explicitly designed (e.g., import submission) with tight scoping and idempotency.
- **Partner (embedded token):** issue vouchers + look up vouchers issued by that partner only; no user account; rate‑limited; no admin/config access.

### Subscription Tiers / Entitlement
- No pricing tiers at launch. Entitlement is managed via `platform.tenant_apps` only.  
- Per‑tenant enablement = app enabled + user role/membership. Avoid feature flags as pricing levers until stable.

### Integration List
- **MVP:** none required for core operations; manual redemption capture + exports (optional CSV export).  
- **Early post‑MVP:** POS weekly CSV import per tenant (idempotent) + reconciliation pipeline; basic reporting feed via read‑only API (tenant‑iterated, not cross‑tenant per request).  
- **Later:** Shyft modules (reporting/outcomes, donor, logistics, referral/case coordination); external partner read‑only APIs; accounting export for reimbursements.

### Compliance Requirements
- No explicit external regulatory regime required at launch.  
- Internal constraints: PII minimization, append‑only audit trail for issuance/override/redemption/config changes, retention policy (incl. 30‑day WP reference window), and least‑privilege access controls.  
- Regulated environments (Gov procurement, formal retention, accessibility) added only if/when needed.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**MVP Approach:** Problem‑solving + platform spine + focused experience. Prove the voucher lifecycle end‑to‑end while enforcing tenancy/RLS/refusal semantics from day‑0 (no single‑tenant shortcuts).  
**Resource Requirements:** PM/PO, Tech Lead/Architect, Backend, Frontend, QA/Test owner; optional DevOps/infra for deploy + observability.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Steward issues voucher (happy path with duplicate detection + authorized override path)
- Cashier redeems voucher at POS (fast path + recovery)
- Admin configures store, catalog, and rules (tenant‑scoped, minimal config)
- Cross‑tenant user switches tenants safely (membership‑scoped, read + basic support)
- Partner agency issues + looks up their own vouchers via embedded form (no user account; tenant‑scoped partner token)

**Must‑Have Capabilities:**
- Tenancy spine: stores‑as‑tenants; host/JWT‑derived context; membership‑scoped auth; one‑tenant‑per‑request.
- Core data model: vouchers, redemption records, immutable authorization snapshots; tenant‑scoped config.
- Voucher lifecycle API: request/issue/redeem/void/lookup/search with refusal semantics.
- UI for issuance + redemption: minimal but fast; unmistakable tenant context; refusal vs error states.
- Cross‑tenant switching: membership‑only; active tenant explicit; actions refused on mismatch.
- Historical voucher migration: WP export/import tool + parity validation gates.
- Cutover readiness: hard cutover runbook + **30‑day WP read‑only reference window** enforced (plugin gate + capability strip + MariaDB write prevention + monitoring).
- Observability: structured logs + correlation IDs; refusal metrics separated from error metrics.

### Post‑MVP Features

**Phase 2 (Growth):**
- POS CSV import automation per tenant (idempotent) + reconciliation dashboards + exception queues.
- Role refinement (auditor role, least‑privilege defaults, explicit override privileges with reason capture).
- Tenant provisioning workflow (onboard stores quickly; baseline configs; import profiles).
- Reporting exports/API (read‑only) for district summaries via tenant iteration, not cross‑tenant queries.
- Config enhancements (availability windows, improved templates, granular catalog controls).

**Phase 3 (Expansion):**
- Deeper ecosystem integrations (events/webhooks/outbox; reporting/outcomes module integration).
- Accounting integration/export for reimbursements (if needed).
- Advanced duplicate/fraud signals (staff‑protective warnings, non‑punitive).
- Self‑serve partner onboarding (if external adoption becomes a goal).
- Advanced audit tooling (config diffs, override analytics, tenant compliance reports).

### Risk Mitigation Strategy

**Technical Risks:** tenant isolation or tenant switching errors cause cross‑store leakage or wrong‑store actions.  
**Mitigations:** host/JWT‑derived context only; RLS/helpers discipline; release‑blocking isolation tests; explicit active‑tenant UI cues; refusals on mismatch; cutover gates require **0 successful WP writes** during the 30‑day window.

**Market Risks:** staff adoption fails if workflow isn’t faster or adds checkout friction.  
**Mitigations:** measure issuance/redemption times in real conditions; iterate on the two critical flows first; treat refusal copy as operational tooling; keep MVP narrow.

**Resource Risks:** capacity insufficient for tenancy + migration + UI in timeline.  
**Mitigations:** collapse scope to vertical slice; defer integrations/reporting; assign single technical owner for tenancy/auth/RLS and a single owner for migration/cutover; enforce “no platform shortcuts” to avoid rework.

## Functional Requirements

### Tenant Resolution & Access Control
- FR1: System derives tenant context only from host + JWT tenant claim match; tenant is never taken from request body/query.
- FR2: Every request executes in exactly one tenant context.
- FR3: System refuses (per FR0) requests when host/JWT tenant mismatch occurs.
- FR4: System refuses (per FR0) any action when user lacks membership in the active tenant.

### User & Role Management
- FR5: System supports role assignments per tenant (Steward, Cashier, Store Admin, District Admin, Auditor, Integration).
- FR6: Store Admins can invite/disable Cashier accounts within their tenant.
- FR7: District Admins can be granted explicit elevated permissions per tenant.
- FR8: Auditors have read‑only access to vouchers, redemptions, and config history for assigned tenants.
- FR8b: Integration role is non‑human, tenant‑scoped, and read‑only in MVP.

### Tenant Switching UX (Cross‑tenant Membership)
- FR9: Cross‑tenant users can view only tenants they are members of.
- FR10: Tenant switching results in navigation to a new tenant origin/context such that subsequent requests derive tenant context from host/JWT match (no client‑only switching).
- FR11: Active tenant is clearly displayed during all actions that can mutate data.
- FR12: System refuses (per FR0) any write action if tenant context is invalid or membership is missing.

### Entitlements / App Enablement (platform.tenant_apps)
- FR13: App enablement is controlled by the platform tenant registry (`platform.tenant_apps`).
- FR14: Disabled tenants receive a refusal state (per FR0) for VoucherShyft routes (no partial access).
- FR15: App enablement is evaluated on every request that requires VoucherShyft access.

### Partner Embedded Access (No‑Account)
- FR40: Partner embedded issuance + lookup uses a tenant‑scoped, partner‑agency token (no user account required).
  - Token is limited to voucher issuance and voucher lookup for that partner’s own vouchers only.
  - Token is form‑specific and configured per partner agency.
  - Token does not expire automatically; rotation/revocation require explicit admin action.
  - Default rate limit: 20 req/min per token.

### Voucher Lifecycle (request/issue/void/lookup)
- FR16: Stewards can initiate and issue vouchers within allowed voucher types for their tenant (or initiate‑only if issuance is restricted by role).
- FR17: System records immutable authorization snapshots at issuance.
- FR18: System supports voucher lookup by voucher ID and by captured voucher fields (name/phone/etc as stored) within tenant scope.
- FR19: System supports voucher voiding with reason capture (authorized roles only).
- FR20: System presents voucher status (active, redeemed, expired, voided) within tenant scope.

### Duplicate Detection & Overrides
- FR21: System checks duplicates within the configured policy window using defined matching criteria (voucher type + identity key) during issuance and returns a refusal or warning per policy.
- FR22: System provides an override path for authorized roles only.
- FR23: Overrides require reason capture and are written to the audit log.
- FR24: System refuses (per FR0) override attempts from unauthorized roles.

### Redemption & Receipt Capture
- FR25: Cashiers can redeem vouchers within their tenant context.
- FR26: Redemption requires receipt_id. gross_total is required when “Manual gross capture mode” is enabled (default in MVP until POS import is live).
- FR27: System records redemption metadata (who, when, receipt_id, gross_total if applicable).
- FR28: System refuses (per FR0) redemption when voucher is expired or already redeemed.

### Catalog & Configuration (tenant‑scoped)
- FR29: Store Admins can manage tenant‑scoped catalog availability (categories/items).
- FR30: Store Admins can manage tenant‑scoped rules text and redemption hours.
- FR31: System enforces allowed voucher types per tenant at request time.
- FR32: Configuration changes apply immediately within the tenant scope.

### Audit & Observability
- FR0: Business denials return HTTP 200 with `{ success:false, reason }` and are tracked separately from errors; errors use non‑200 or `{ success:false, error }` per API standard.
- FR33: System records append‑only audit events for issuance, overrides, redemption, voids, and config changes.
- FR34: System logs correlation IDs per request and separates refusals from errors in telemetry.

### Migration & Cutover Support
- FR35: System supports importing historical vouchers with per‑tenant parity validation.
- FR36: System provides export artifacts for migration and audit as needed.
- FR37: System supports a hard cutover runbook and tracks migration validation results.
- FR37a: During the 30‑day WP reference window, the system must prevent all voucher writes in WP (plugin gate + capability strip + database enforcement) and alert on any blocked attempt; success condition is 0 successful legacy writes.
- FR37b: WP reference window is 30 days; after window, WP is archived/offlined per runbook.

### Reporting & Exports (MVP minimal)
- FR38: System provides tenant‑scoped voucher list export for audit/support.
- FR39: System provides a tenant‑scoped reconciliation summary export based on available redemption data (manual capture in MVP; import‑enhanced later).

## Non-Functional Requirements

### Performance
- **Issue voucher (submit → confirmation):** p95 **≤ 2.0s** on broadband; **≤ 4.0s** on “slow 3G” simulation.
- **Redeem voucher (submit → confirmation/refusal):** p95 **≤ 1.5s** on broadband; **≤ 3.0s** on slow 3G.
- **Search/lookup (query → results):** p95 **≤ 800ms** for ID lookup; **≤ 1.5s** for name/field search (tenant‑scoped), broadband.
- **Measurement scope:** p95 measured end‑to‑end from **UI submit click → UI confirmation rendered**, including API + DB.
- **Concurrency condition:** targets must hold at **≥ 25 concurrent active users** system‑wide.

### Security & Privacy
- **PII minimization:** only fields required for issuance/redemption/reconciliation; no sensitive free‑text by default; configurable retention for optional notes.
- **Default retention:** voucher records retained **7 years** (or org‑defined); request logs containing PII **≤ 30 days**; audit events **≥ 7 years** (or org‑defined).
- **Auth:** JWT‑based; tenant context derived from host + JWT tenant claim match only (per TCP); membership required for access.
- **Audit:** append‑only events for issuance, override, redemption, void, config changes; includes actor, tenant, timestamp, reason where applicable.
- **Encryption:** TLS **1.2+** in transit; encryption at rest for DB/backups (platform‑managed acceptable); secrets stored in a secrets manager/env, not source control.
- **Backup validation:** backups encrypted at rest; restore test performed **monthly** (MVP: **quarterly** acceptable).

### Reliability
- **Availability (MVP):** **99.5% monthly** for voucher issue/redeem APIs (excluding planned maintenance windows announced ≥ 24 hours in advance, total ≤ 4 hours/month).
- **Idempotency:** redemption is idempotent on `(tenant_id, voucher_id)`; duplicate submissions return the existing redemption record.
- **Migration safety:** cutover only if **100% per‑tenant parity** checks pass (counts + spot‑checks); rollback posture is “pause writes + re‑import,” not dual‑run.
- **WP read‑only window:** during the 30‑day reference window, **0 successful legacy writes**; any attempted write is blocked and alerts are generated.

### Scalability
- **Tenants:** supports **up to 50 store tenants** without architectural change.
- **Users:** supports **up to 500 total users** across tenants; **up to 50 concurrent** sessions.
- **Data volume:** supports **up to 500k vouchers** total while meeting p95 targets via indexing and tenant‑scoped queries.

### Accessibility
- **Target:** **WCAG 2.1 AA** for the web app.
- **Critical flows guaranteed AA:** issue voucher, redeem voucher, tenant switching, login, export.
- **Non‑negotiables:** keyboard‑only operation for critical flows; no color‑only meaning; visible focus; form errors programmatically associated.

### Observability
- **Correlation IDs:** every request has a correlation ID returned to client and logged server‑side.
- **Metrics split:** refusals counted separately from errors; dashboards show refusal rate by reason, error rate, and latency p95 per endpoint.
- **Audit visibility:** audit events are queryable per tenant for authorized roles; exportable for support/audit.

### Integration
- **API versioning:** versioned base path (e.g., `/v1`) with documented backward‑compat guarantees for a major version.
- **Rate limits (per tenant):** default **60 req/min/user** for UI calls; service accounts configurable (e.g., **300 req/min**) with burst control; **partner tokens default 20 req/min per token**.
- **Rate‑limit contract:** requests over limit return **HTTP 429** with `Retry-After`.
- **Change policy:** breaking changes require a new major version; deprecation notice **≥ 90 days** for public/integration endpoints.

## Appendix A: Traceability Delta (Legacy WP PRD → VoucherShyft PRD)

| Legacy WP PRD Section | VoucherShyft PRD Section | Status | Notes |
|---|---|---|---|
| Executive Summary | Executive Summary | Reframed | Rewritten for standalone SaaS + ecosystem constraints. |
| Success Criteria | Success Criteria | Reframed | Updated for tenancy, cutover, refusal semantics. |
| Product Scope | Product Scope | Reframed | MVP/Growth/Vision aligned to VoucherShyft vertical slice. |
| User Journeys | User Journeys | Reframed | Added cross‑tenant switching + integration journey. |
| Domain Requirements | Domain‑Specific Requirements | Reframed | Added retention, audit, PII minimization, consent posture. |
| Innovation Analysis | Innovation & Novel Patterns | Added | New section for dignity‑first + refusal‑first differentiation. |
| Project‑Type Requirements | SaaS B2B Specific Requirements | Added | Tenant model, RBAC, entitlement, integration list. |
| Functional Requirements | Functional Requirements | Reframed | Updated for tenancy, refusal semantics, cutover enforcement. |
| Non‑Functional Requirements | Non‑Functional Requirements | Reframed | Added performance/availability/retention/observability gates. |
| WP Auth/Nonces/Capabilities | N/A | Dropped | Replaced by host/JWT + membership model. |
| WP REST/Shortcodes/Admin‑Ajax | N/A | Dropped | Replaced by standalone API + web app. |
| WP Hosting/Deployment | N/A | Dropped | Replaced by SaaS runtime assumptions. |

## Appendix B: Ecosystem Alignment Summary

- **ECO‑TEN (Tenancy):** Tenant Model + Tenant Context Policy (host/JWT only, no tenant from input). See “SaaS B2B Specific Requirements,” FR1–FR4.
- **ECO‑NET (Routing):** Same‑origin per tenant; tenant switching implies new origin; no CORS dependency. See FR10 and NFR Integration.
- **ECO‑AUTH (Authentication):** JWT‑based auth, one‑time code exchange readiness, membership‑scoped access. See NFR Security & Privacy and FR5–FR15.
- **ECO‑DB (RLS/Data Access):** Tenant‑scoped access enforced; one‑tenant‑per‑request; RLS/helpers discipline. See Technical Success + FR1–FR4 + NFR Reliability.
- **ECO‑UX (Refusal vs Error):** Business denials return HTTP 200 `{ success:false, reason }` and are tracked separately. See FR0 + NFR Observability.
- **ECO‑OBS (Observability):** Structured logs with correlation IDs; refusals vs errors metrics. See NFR Observability + FR34.
