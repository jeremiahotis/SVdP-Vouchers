# Sprint Change Proposal — VoucherShyft Standalone Pivot

**Date:** 2026-02-02
**Mode:** Incremental
**Change Type:** Strategic pivot / market change

---

## 1) Issue Summary

**Problem statement:** The Voucher program must transition from a WordPress plugin to a standalone Shyft Ecosystem module (VoucherShyft) with no CMS dependency. **Stores are tenants (store_id = tenant_id)**, and tenant context is **host/JWT-derived** only. Cross‑tenant users must be supported, and the system must support a **hard cutover** with a **WP read‑only reference window (30 days)** post‑migration.

**Trigger:** Owner decision (platform pivot).

**Evidence:** Ecosystem governance requirements (tenancy, routing, auth, refusal semantics, RLS discipline, observability) and the goal of a coherent Shyft product family.

---

## 2) Impact Analysis

### 2.1 Epic Impact (Current → New)

**Current epics:** All impacted due to WordPress runtime assumptions (WP REST, nonces/capabilities, WP hosting constraints). No single triggering epic; this is a platform pivot.

**New Epic Set (redefined):**

**Epic 1 — Ecosystem Compliance + Tenancy Hard Gates (Day‑0)**
- Tenant resolution model (host/JWT‑derived)
- Auth model consistent with ecosystem constraints
- Refusal vs error contract at all API boundaries
- CSP-at-ingress assumption compatibility
- Observability + correlation IDs

**Epic 2 — Core Data Model + Isolation (RLS or equivalent)**
- Tenant‑scoped schema with `tenant_id = store_id` everywhere
- Isolation enforcement (RLS/helpers) + “no cross‑tenant query” tests
- Tenant‑scoped configuration (catalog/limits/templates)

**Epic 3 — Data Continuity Migration (Historical Vouchers Only)**
- Export WP vouchers
- Transform/import into new schema with explicit tenant mapping
- Idempotent batch runs
- Validation suite: per‑store parity, spot‑checks, hard failures on ambiguous mappings

**Epic 4 — Voucher Domain API (Standalone)**
- Request/issue/redeem/void/lookup/search
- Business denials as refusals (HTTP 200 with `{ success: false, reason }`)
- Tenant‑scoped rate limits and abuse controls

**Epic 5 — Admin + Cashier Web App MVP**
- Admin: store config, voucher templates, limits, basic reporting
- Cashier: redemption flow + lookup + print
- Role model rebuilt outside WordPress

**Epic 6 — Tenant Provisioning + Cross‑Tenant Access**
- Tenant onboarding workflow
- Cross‑tenant memberships/roles and safe tenant switching (host change)
- Isolation test gates in CI

**Epic 7 — Cross‑Module Integration Contracts**
- Service‑to‑service auth patterns
- Event/outbox (if needed)
- Single authoritative state transition path

**Epic 8 — Operational Readiness + Cutover**
- Backups/restore drills, monitoring, runbooks
- Cutover execution plan (freeze → export/import → validate → switch)
- Read‑only enforcement plan (defense in depth; MariaDB‑backed)

**Priorities (Top‑3):**
1) Epic 1 — Ecosystem Compliance + Tenancy Hard Gates
2) Epic 2 — Core Data Model + Isolation
3) Epic 3 + 4 + 5 as a vertical slice (migration → API → UI MVP)

---

### 2.2 Artifact Conflict Summary

**PRD:** Full rewrite required (WP assumptions conflict with ecosystem rules). Add **Traceability Delta** appendix: old section → new section (Kept / Reframed / Dropped).

**Architecture:** Full rewrite required, with explicit sections for tenancy/routing, cross‑tenant user model, RLS discipline, refusal semantics, and observability gates. Retire WP MPA, WP REST, nonce/capability model, WP hosting assumptions.

**UI/UX:** Preserve behavioral invariants (allowed voucher types gating, closed catalog, totals hidden until qty > 0, coat‑only cashier flow). Replace WP templates/shortcodes with Decision Surface‑compliant UI and **cross‑tenant navigation that changes host** (no tenant from request body/query).

**Other artifacts:** Immediate updates required for
- `SCOPE.md` (standalone SaaS, stores=tenants, cross‑tenant users, hard cutover, WP read‑only window)
- `DATA_DICTIONARY.md` (tenant_id everywhere, membership model)
- `MIGRATION.md` (WP → VoucherShyft historical voucher migration; validation gates)
- `UI_STATES.md` (tenant‑origin switching rules)
- `TEST_PLAN.md` (tenant isolation, cross‑tenant access, refusal vs error, migration parity)
- `POS_CSV_CONTRACT.md` (per‑tenant import profiles)
- `README.md` (SaaS dev/deploy; mark WP as legacy reference)
- Implementation artifacts (epics/stories/tech specs) re‑based on ecosystem invariants

**New required artifacts:**
- `CUTOVER.md` (freeze window, validation gates, rollback posture, WP read‑only duration)
- `TENANCY_AND_ACCESS.md` (tenant model + cross‑tenant membership/role rules)

---

## 3) Path Forward Evaluation

**Option 1 — Direct Adjustment:** Partially viable. Reuse domain acceptance criteria only; rewrite infra/story structure to fit ecosystem constraints. **Effort: High. Risk: High** if treated as minor edits.

**Option 2 — Rollback:** Not viable as a strategy. Pivot is strategic. Freeze WP, keep it read‑only as legacy reference. Only rollback action: ensure deterministic export capability.

**Option 3 — PRD MVP Review:** **Required.** Define VoucherShyft MVP around tenancy, cross‑tenant access, and migration. **Effort: Medium. Risk: Low‑to‑Medium** (mitigated by narrow vertical slice).

**Recommendation:** **Hybrid (Option 3 + selective Option 1)**
- Rewrite PRD and architecture for ecosystem invariants
- Salvage only domain acceptance criteria
- Freeze WP as legacy reference and migration source

---

## 4) Detailed Change Proposals (Incremental)

### 4.1 PRD (Full Rewrite)
- New **VoucherShyft PRD** aligned to Ecosystem Rule Book.
- Add **Traceability Delta** appendix mapping old PRD sections to new (Kept / Reframed / Dropped).
- Explicitly include: stores=tenants, host/JWT tenant context, cross‑tenant users, hard cutover + read‑only WP window.

### 4.2 Architecture (Full Rewrite)
- Add Tenancy & Routing section (host/JWT only; no tenant from input; same‑origin; no CORS).
- Add Cross‑Tenant Access model (membership‑scoped permissions; single‑tenant context per request).
- Add RLS/Isolation enforcement section (request‑scoped transactions; forbid root ORM outside tenant‑asserted helpers).
- Add refusal vs error contract at API boundary.
- Add observability gates (structured logs, correlation IDs; refusal vs error metrics).

### 4.3 Epics & Stories (Rebase)
- Replace WP‑specific epics with the 8‑epic set above.
- Map old epics → new epics; retain domain‑level acceptance criteria.

### 4.4 Migration & Cutover
- Create `CUTOVER.md` runbook: freeze → export/import → validate → switch.
- Create `MIGRATION.md` for historical vouchers only; idempotent runs; parity checks.
- Maintain WP as read‑only reference for **30 days** post‑cutover.
- **WP Read‑only Enforcement (30 days, MariaDB‑backed):**
  1) **Plugin hard gate (primary):** global `READ_ONLY_MODE` blocks all voucher writes at server entrypoints and disables write UI; log attempted writes.
  2) **Role/capability strip (secondary):** remove voucher write capabilities from all roles; retain view/export only (optional “Legacy Admin” view/export role).
  3) **MariaDB enforcement (safety net):** prevent writes to voucher plugin tables during the window via one of:
     - **Preferred:** revoke `INSERT/UPDATE/DELETE` on plugin tables for the WP DB user (if privileges can be isolated without breaking core tables), or
     - **Fallback:** **BEFORE INSERT/UPDATE/DELETE triggers** on plugin tables that block writes during the window.
  4) **Operational controls:** restrict access (IP allowlist/VPN if feasible) + alert on blocked write attempts.

### 4.5 UI/UX Compliance
- Keep UI state invariants; replace WP implementation.
- Enforce Decision Surface structure and Shyft design tokens.
- Add cross‑tenant navigation rule: any tenant switch must navigate to tenant origin.

---

## 5) MVP Impact & High‑Level Action Plan

**MVP is redefined.** The vertical slice must prove:
- **Tenant‑safe voucher lifecycle** (request → issue → redeem → lookup)
- **Cross‑tenant user access** (membership + safe switching)
- **Historical voucher migration** (export/import + validation gates)
- **Refusal semantics** at API boundary
- **RLS/isolation enforcement**
- **Cutover readiness** (hard cutover + WP read‑only reference window)

**Sequencing:**
1) Tenancy hard gates + auth/routing rules
2) Tenant‑scoped schema + RLS helpers
3) Migration tooling + parity validation
4) Core API (refusals vs errors enforced)
5) Minimal Admin/Cashier UI
6) Cutover rehearsal + runbook validation

**Release‑blocking gates (must pass before cutover rehearsal is a “pass”):**
- Tenant isolation tests: no cross‑tenant data access possible.
- Cross‑tenant membership checks: non‑membership returns **refusal** (not error).
- Refusal contract: business denials always HTTP 200 with `{ success:false, reason }`.
- RLS/helpers discipline: no DB access outside tenant‑asserted helpers.
- Same‑origin browser flows: no production dependency on CORS.
- Migration parity: per‑store counts match; ambiguous mappings hard‑fail.

---

## 6) Handoff Plan

**PM/Architect (single owner preferred):**
- PRD rewrite
- Tenancy/access spec
- Cutover requirements (freeze/read‑only window)

**Tech Lead / Architect:**
- Architecture rewrite (service boundaries, routing, auth, RLS helpers, refusal contract, observability gates)

**Dev Team:**
- Migration tooling (export/import + parity checks)
- Core API thin slice
- UI MVP thin slice

**PO/SM:**
- Backlog re‑sequencing
- Epic/story rewrite
- Acceptance criteria alignment to ecosystem rule book

---

## 7) Approval & Next Steps

**Recommendation Approved:** Hybrid (Option 3 + selective Option 1)

**Next Actions:**
1) Draft new VoucherShyft PRD + Traceability Delta appendix
2) Draft VoucherShyft architecture aligned to Ecosystem Rule Book
3) Produce new epic/story set based on the 8‑epic structure
4) Draft CUTOVER.md and TENANCY_AND_ACCESS.md
5) Start vertical slice implementation plan

**Approval Required to Proceed:** Yes
