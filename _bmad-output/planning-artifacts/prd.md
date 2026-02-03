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
  - step-01b-continue
  - step-12-complete
inputDocuments:
  - docs/api-contracts-plugin.md
  - docs/component-inventory.md
  - docs/comprehensive-analysis-plugin.md
  - docs/data-models-plugin.md
  - docs/deployment-guide.md
  - docs/development-guide.md
  - docs/source-tree-analysis.md
  - POS_CSV_CONTRACT.md
  - MIGRATION.md
  - DATA_DICTIONARY.md
  - update-redemption-instructions.sql
  - UI_STATES.md
  - TEST_PLAN.md
  - SCOPE.md
  - README.md
  - db/migrations/README.md
  - db/migrations/v0003__20260114__add_store_id.php
  - db/migrations/v0004__20260114__create_catalog_tables.php
  - db/migrations/v0005__20260114__create_authorization_snapshots.php
  - db/migrations/v0006__20260114__create_pos_receipt_tables.php
workflowType: 'prd'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 20
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: brownfield
---

# Product Requirements Document - SVdP-Vouchers

**Author:** Jeremiah
**Date:** 2026-01-14

## Executive Summary

SVdP Vouchers is a brownfield WordPress plugin upgrade to tighten furniture/household voucher issuance, redemption, and reconciliation. The goal is to replace paper without breaking operations by enforcing bounded authorization, immutable snapshots, receipt‑based redemption, and weekly CSV reconciliation.

**Primary users:** Vincentian volunteers, cashiers, store staff/managers, and admins.  
**Differentiator:** Closed catalogs + snapshot authorizations + post‑hoc reconciliation that preserves dignity and minimizes friction (no dollar math at request time, no line‑item entry at checkout).  
**Outcome:** Trustworthy billing (50% up to cap / 100% over), clear requested‑vs‑redeemed visibility, and reduced manual reconciliation.

## Success Criteria

### User Success

**Vincentian volunteers**
- Issue furniture/household vouchers digitally without guessing or paper.
- Never have to explain dollar math to a neighbor.
- Trust that authorizations reflect their judgment.

**Cashiers**
- Checkout flow is not slower than today.
- No adjudicating volunteer intent or negotiating budgets.
- Enter only `receipt_id` and move on.

**Store staff/managers**
- Reconciliation is predictable and defensible.
- Billing aligns with rules; fewer disputes.
- Visibility into gaps and patterns without manual digging.

### Business Success

- Reduced redemption/billing error rate.
- Faster redemption at point of sale.
- Higher reconciliation accuracy with fewer manual fixes.
- Clear visibility into requested vs fulfilled and inventory gaps.
- Conference billing aligns to 50% up to cap / 100% over cap.

### Technical Success

- Data completeness: every voucher has `store_id`; every redeemed voucher has `receipt_id`.
- Snapshot stability: authorizations are immutable after issuance.
- Consistency: requested vs redeemed is explainable.
- Reliability: CSV imports are idempotent; no duplicate/orphaned receipts.
- Performance: request form and cashier station remain responsive.

**Failure modes avoided**
- Live POS coupling.
- Double entry of line items.
- Silent data drift from catalog edits.

### Measurable Outcomes

- Paper elimination rate: % of furniture/household vouchers issued digitally → **>90%**
- Redemption friction: avg added cashier time per voucher → **≤30s**
- Reconciliation accuracy: % vouchers reconciled without manual correction → **≥95%**
- Receipt linkage rate: % redeemed vouchers with `receipt_id` → **≥98%**
- Requested vs redeemed visibility: % vouchers with comparison available → **≥90% post-import**

## Product Scope

### MVP - Minimum Viable Product

- Closed furniture/household catalogs with categories
- Multi-type vouchers gated by conference allowed types
- Catalog snapshots on issuance
- Cashier redemption captures `receipt_id` (+ gross total as needed)
- Weekly CSV import + voucher↔receipt matching
- Basic requested vs redeemed comparison
- Coats cashier-only; no leakage into request flow

### Growth Features (Post-MVP)

- Derived clothing counts/values from receipts
- Better reporting dashboards by conference/store/category
- Unmatched receipt queue + resolution UI
- Smarter category normalization
- Training feedback loops on unfulfilled items

### Vision (Future)

- Evidence-based furniture programs (inventory + woodshop planning)
- Fair, transparent conference billing at scale
- Reduced emotional labor at checkout
- Dignity-first voucher system by design
- Optional future POS integration without rewriting the model

## User Journeys

### Vincentian Volunteer — Happy Path (Request → Voucher Issued)
Opening scene: A Vincentian opens the request form via a conference-specific link. The system loads the conference and allowed voucher types server-side, silently.

Rising action: Only enabled sections render—clothing, furniture, household. Clothing stays minimal (authorize toggle + notes). For furniture/household, they enter the catalog, pick categories, and select items via qty (+/−) with optional notes. Woodshop items show “Out of stock” or “Woodshop paused” but remain selectable.

Climax: Once any qty > 0, the system shows a live min–max estimate. The Vincentian reviews a compact summary (authorized/not authorized, categories + quantities, totals only where applicable).

Resolution: On submit, the system enforces: at least one item for any used furniture/household section, only allowed types included, coats excluded. It creates the voucher and immutable authorization snapshots, and the Vincentian leaves with confidence—no paper, no dollar math.

### Vincentian Volunteer — Edge Case (No Enabled Types)
Opening scene: A Vincentian opens the form, but the conference has `allowed_voucher_types = []`.

Climax: No sections render; the form blocks submission.

Resolution: A clear message instructs them to contact the conference president. No workaround, no partial entry—prevents shadow systems.

### Cashier — Redemption at Counter
Opening scene: Neighbor shops as usual; cashier completes POS transaction and gets a receipt ID.

Rising action: Cashier opens the Cashier Station, finds the voucher, clicks Redeem.

Climax: Cashier scans or enters `receipt_id`, confirms redemption. Fast, barcode-scanner-friendly workflow.

Resolution: Voucher is marked redeemed with receipt_id stored. Billing calculations happen later when receipts are imported from POS system. Typos or mismatches surface during reconciliation—not at the counter. The flow stays fast and judgment-free.

### Store Staff/Manager — Weekly Reconciliation & Reporting
Opening scene: Weekly, staff export ThriftWorks CSV and upload via Receipt Import (store-scoped).

Rising action: System normalizes rows, inserts receipts/items idempotently, links to vouchers.

Climax: For each voucher, staff can compare authorized snapshots vs redeemed items and see requested-not-redeemed.

Resolution: Managers view billing totals, cap utilization, overages, and category trends. Fewer spreadsheet fixes; clearer explanations.

### Admin — Configuration & Support
**Conference configuration:** Admin updates `allowed_voucher_types` and eligibility rules; request forms update immediately.

**Catalog management:** Admin edits catalog items (name, category, min/max, woodshop, availability). Changes apply only to new vouchers; snapshots preserve history.

**Store management:** Admin toggles woodshop pause, manages store records, and reviews unmatched receipts.

### Journey Requirements Summary
- Conference-driven rendering of voucher-type sections; zero types blocks submission.
- Clothing authorization is minimal; no item counts or dollar math.
- Furniture/household use closed catalogs; qty must be > 0; totals shown only after selection.
- Immutable authorization snapshots at issuance.
- Cashier redemption captures receipt_id (+ gross total as needed) without line-item entry.
- Weekly CSV import is idempotent and links receipts to vouchers.
- Reconciliation views show requested vs redeemed with clear reporting.
- Admin can change allowed types and catalog without affecting past vouchers.

## Domain-Specific Requirements

### Compliance & Regulatory
- No external regulatory requirements beyond standard data privacy and least-privilege access.

### Technical Constraints
- Preserve dignity and low-friction workflows; avoid forcing dollar math at request time.
- No live POS coupling; redemption is receipt-based with post-hoc reconciliation.
- Maintain immutable authorization snapshots to prevent historical drift.

### Integration Requirements
- Weekly ThriftWorks CSV import (manual admin-run).
- Receipt linkage via `(store_id, receipt_id)` with idempotency.
- WordPress-native deployment and permissions.

### Risk Mitigations
- Prevent paper/side-channel workarounds by enforcing digital-only issuance.
- Guard against data drift from catalog edits via snapshots.
- Flag unmatched receipts and reconciliation gaps instead of blocking redemption.

## Web App Specific Requirements

### Project-Type Overview
- WordPress MPA with progressive enhancement; avoid SPA conversion.
- Server-rendered request form with lightweight JS for navigation, quantity controls, totals.

### Technical Architecture Considerations
- Keep nonce/session complexity low; avoid SPA-like stateful flows.
- Cashier station remains “app-like” but still jQuery-based and lightweight.
- Real-time limited to existing heartbeat/refresh (optional “last refreshed”).

### Browser & Accessibility Requirements
- Support latest two versions of Chrome, Edge, Safari, Firefox.
- Support iOS Safari current + previous; call out iPadOS Safari as needed.
- Target WCAG 2.1 AA best effort for core flows:
  - Keyboard navigable quantity controls
  - Proper labels/focus states
  - High contrast defaults
  - Error messages not color-only

### SEO & Indexing
- No SEO requirements; mark request/cashier/admin views as noindex/nofollow if publicly reachable.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform MVP (dignity + low friction are constraints, not the primary goal)  
**Core question:** “Does this produce trustworthy records with minimal harm?”  
**Non‑negotiable skills:** WordPress/PHP (incl. migrations) + Data import/reporting (CSV, idempotency, reconciliation)

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Vincentian request with closed catalog and snapshot authorization
- Cashier redemption with `receipt_id` (+ gross total if required)
- Store reconciliation via weekly CSV import and voucher↔receipt linkage

**Must‑Have Capabilities:**
- Catalog snapshot versioning
- Conference‑gated voucher types
- `store_id` foundation
- Receipt ID capture at redemption
- Idempotent CSV import with unmatched receipt handling (even if crude)
- Closed catalog (no “Other”)
- Best‑effort framing, no dollar exposure to neighbors

### Post‑MVP Features

**Phase 2 (Post‑MVP):**
- Derived clothing counts/values from receipts (only after CSV stability)
- Unmatched receipt queue + resolution UI
- Reporting dashboards by conference/store/category
- Smarter category normalization

**Phase 3 (Expansion):**
- Evidence‑based program planning (inventory + woodshop)
- Transparent billing at scale
- Reduced emotional labor at checkout
- Optional future POS integration without rewriting the model

### Risk Mitigation Strategy

**Technical Risks:** Data integrity drift between voucher ↔ POS ↔ billing  
**Mitigations:** snapshotting, receipt capture, idempotent import, store‑scoped keys

**Operational/Market Risks:** Adoption failure due to friction/ambiguity  
**Mitigations:** closed catalog, best‑effort framing, no dollar exposure, no extra cashier steps beyond `receipt_id`

**MVP Cuts (if forced):**
1) Derived clothing item counts from receipts  
2) Requested vs redeemed comparison UI (keep data model, defer UI)

## Functional Requirements

### Voucher Request & Authorization
- FR1 [MVP]: Vincentian users can create a voucher request scoped to a specific conference/partner.
- FR2 [MVP]: The system enforces conference `allowed_voucher_types` on request input.
- FR3 [MVP]: The system supports multi‑type vouchers (clothing, furniture, household) in a single request, with sections conditionally rendered based on `allowed_voucher_types`.
- FR4 [MVP]: The system allows clothing authorization without item counts or dollar amounts.
- FR5 [MVP]: The system allows furniture/household authorization only from a closed catalog, and does not permit free‑form items or dollar‑only authorizations.
- FR6 [MVP]: The system records item quantities and notes for authorized catalog items.
- FR7 [MVP]: The system prevents submission of furniture/household sections with zero selected items.
- FR8 [MVP]: The system creates immutable authorization snapshots at voucher issuance.

### Catalog & Inventory Controls
- FR9 [MVP]: Admins can manage catalog items (category, min/max price, woodshop flag, availability) with category membership restricted to a controlled set.
- FR10 [MVP]: The system preserves historical voucher authorizations when catalog items change.
- FR11 [MVP]: The system supports woodshop item availability states without removing selection ability.
- FR12 [MVP]: The system supports store‑level woodshop pause while keeping items selectable.

### Conference/Organization Management
- FR13 [MVP]: Admins can create and manage conferences/partners and stores, including assignment of organization type.
- FR14 [MVP]: Admins can configure eligibility windows and voucher types per organization.
- FR15 [MVP]: The system applies organization settings to request behavior and validation.

### Cashier Redemption
- FR16 [MVP]: Cashiers can locate vouchers and redeem them at point of sale.
- FR17 [MVP]: Redemption captures `receipt_id` (required). Gross total is obtained from POS receipt import, not manual cashier entry.
- FR18 [MVP]: Redemption updates voucher status and records cashier action details.
- FR19 [MVP]: The system supports coat issuance in the cashier station only.

### Receipt Import & Reconciliation
- FR20 [MVP]: Admins can import ThriftWorks CSV receipts on a weekly basis.
- FR21 [MVP]: Imports are idempotent and prevent duplicate receipts.
- FR22 [MVP]: The system links receipts to vouchers via `store_id` + `receipt_id`.
- FR23 [GROWTH]: The system stores receipt line items when available.
- FR24 [GROWTH]: The system enables requested‑vs‑redeemed comparison for reconciliation.
- FR24a [MVP]: Reconciliation is post‑hoc and does not block redemption at point of sale.

### Billing & Reporting
- FR25 [MVP]: The system computes conference vs store payment shares during receipt import using cap rules (conference pays 50% up to cap; store pays 50% of conference spend plus 100% over cap). Billing shares are calculated and stored when receipts are linked to vouchers.
- FR26 [GROWTH]: The system provides reporting by conference/store for billing totals.
- FR27 [GROWTH]: The system surfaces reconciliation gaps (unmatched receipts or mismatches).

### Security & Access
- FR28 [MVP]: The system enforces role‑based access for cashier features.
- FR29 [MVP]: Admin operations require `manage_options` capability.
- FR30 [MVP]: Public REST endpoints require valid nonces, except explicitly documented public submissions (which must enforce validation and rate‑limiting).

### Overrides & Exceptions
- FR31 [MVP]: Cashiers can perform emergency overrides with manager approval.
- FR32 [MVP]: The system records override reasons and approver metadata.

## Non-Functional Requirements

### Performance
- Request form initial load (server-rendered): ≤ 2.0s p95.
- Request form interactive (catalog JS ready): ≤ 3.0s p95.
- Catalog interactions (category switch, +/−): ≤ 100ms perceived, local state, no spinner.
- Cashier station initial load: ≤ 2.0s p95.
- Cashier search/filter updates: ≤ 300ms for typical daily volumes.
- Redeem action (receipt_id + total saved): ≤ 1.0s p95.
- Performance targets apply under normal production load on standard managed WP hosting; brief cold-start variance acceptable.

### Security
- Data minimization on public surfaces (no internal caps exposed).
- Public write endpoints (voucher request only) require rate limiting and nonce validation.
- Authenticated endpoints require capability checks + nonces.
- Input sanitization and output escaping everywhere (especially notes fields).
- Auditability: redemption stores cashier user ID + timestamp; overrides store manager ID + reason + timestamp.
- Optional: noindex/nofollow on request/cashier pages if URL‑reachable.
- Manager codes stored as hashes.

### Reliability & Data Integrity
- 0 duplicate receipts inserted (strict idempotency).
- 0 silent failures; any unparseable row reported in import summary.
- Orphaned receipts allowed but visible in unmatched queue.
- Target <2% unmatched after 7 days (not a hard blocker).
- 0 vouchers redeemed without receipt_id once import is enabled (hard validation at redemption time, not retroactive).
- Import is “all‑or‑report”: full summary on success; clear error on failure.

### Accessibility
- WCAG 2.1 AA best‑effort for request form + cashier station.
- Keyboard operable controls, labeled inputs, visible focus, non‑color error messaging, reasonable contrast.

### Integration (CSV Import)
- Weekly manual admin‑initiated import (no CLI requirement).
- Handle up to 50,000 line items per import without timeouts.
- Parse/insert in chunks (500–2,000 rows/batch).
- Store import run metadata (started_at, ended_at, rows_read, rows_inserted, rows_skipped, errors).
- CSV import must complete within a single admin session without requiring background workers.
- Resumable imports recommended for Growth (not required for MVP).
