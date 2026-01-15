---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - user-provided: Epic C-H and Migration Plan (inline)
---

# SVdP-Vouchers - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SVdP-Vouchers, decomposing the requirements from the PRD, Architecture, and user-provided epic notes into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Vincentian users can create a voucher request scoped to a specific conference/partner.
FR2: The system enforces conference allowed_voucher_types on request input.
FR3: The system supports multi-type vouchers (clothing, furniture, household) in a single request, with sections conditionally rendered based on allowed_voucher_types.
FR4: The system allows clothing authorization without item counts or dollar amounts.
FR5: The system allows furniture/household authorization only from a closed catalog, and does not permit free-form items or dollar-only authorizations.
FR6: The system records item quantities and notes for authorized catalog items.
FR7: The system prevents submission of furniture/household sections with zero selected items.
FR8: The system creates immutable authorization snapshots at voucher issuance.
FR9: Admins can manage catalog items (category, min/max price, woodshop flag, availability) with category membership restricted to a controlled set.
FR10: The system preserves historical voucher authorizations when catalog items change.
FR11: The system supports woodshop item availability states without removing selection ability.
FR12: The system supports store-level woodshop pause while keeping items selectable.
FR13: Admins can create and manage conferences/partners and stores, including assignment of organization type.
FR14: Admins can configure eligibility windows and voucher types per organization.
FR15: The system applies organization settings to request behavior and validation.
FR16: Cashiers can locate vouchers and redeem them at point of sale.
FR17: Redemption captures receipt_id (required) and gross total (configurable required/optional via settings).
FR18: Redemption updates voucher status and records cashier action details.
FR19: The system supports coat issuance in the cashier station only.
FR20: Admins can import ThriftWorks CSV receipts on a weekly basis.
FR21: Imports are idempotent and prevent duplicate receipts.
FR22: The system links receipts to vouchers via store_id + receipt_id.
FR23: The system stores receipt line items when available.
FR24: The system enables requested-vs-redeemed comparison for reconciliation.
FR24a: Reconciliation is post-hoc and does not block redemption at point of sale.
FR25: The system computes conference vs store payment shares using cap rules (conference pays 50% up to cap; store pays 50% of conference spend plus 100% over cap).
FR26: The system provides reporting by conference/store for billing totals.
FR27: The system surfaces reconciliation gaps (unmatched receipts or mismatches).
FR28: The system enforces role-based access for cashier features.
FR29: Admin operations require manage_options capability.
FR30: Public REST endpoints require valid nonces, except explicitly documented public submissions (which must enforce validation and rate-limiting).
FR31: Cashiers can perform emergency overrides with manager approval.
FR32: The system records override reasons and approver metadata.

### NonFunctional Requirements

NFR1: Performance targets for request form and cashier station (p95 constraints; responsive interactions).
NFR2: Security requirements for nonces, capability checks, rate limiting, and auditability of privileged actions.
NFR3: Reliability requirements for strict import idempotency, no silent failures, and unmatched receipt visibility.
NFR4: Accessibility requirements targeting WCAG 2.1 AA best-effort for core flows.
NFR5: Integration requirements for weekly, manual CSV import with chunked processing and import metadata.

### Additional Requirements

- REST-only for new APIs under /wp-json/svdp/v1/; no new admin-ajax endpoints.
- Standard JSON error schema with WP_Error conversion helper.
- CSV import must be batch/resumable; store import run metadata (svdp_import_runs).
- Add audit events table for redemption, overrides, and imports (svdp_audit_events).
- Use transient-based rate limiting with centralized thresholds.
- JSON fields are snake_case; dates are ISO-8601 UTC with Z suffix.
- Store-scoped receipt identity uses (store_id, receipt_id) unique indexes; enforce 1:1 link at app layer.
- Managed WP hosting with optional Redis object cache (no hard dependency).
- Feature-flag all new UI/routes; use svdp_schema_version for migrations.
- Migration plan constraints: additive-only schema changes, backfill store_id, seed catalogs, and maintain backward compatibility with legacy voucher flow.
- User-provided epic requirements (C-H) and migration phases are included as implementation constraints.

### FR Coverage Map

FR1: Epic 1 - Organization and conference controls
FR2: Epic 1 - Allowed voucher types enforcement
FR3: Epic 2 - Multi-type request composition
FR4: Epic 2 - Clothing request behavior
FR5: Epic 3 - Closed catalog requirement
FR6: Epic 3 - Quantities and notes for catalog items
FR7: Epic 2/3 - Submission rules for catalog items
FR8: Epic 4 - Snapshot at issuance
FR9: Epic 3 - Catalog admin CRUD
FR10: Epic 3/4 - Catalog changes do not affect history
FR11: Epic 3 - Woodshop availability state
FR12: Epic 3 - Woodshop paused flag
FR13: Epic 1 - Organization CRUD
FR14: Epic 1 - Eligibility and voucher types config
FR15: Epic 1 - Org rules applied
FR16: Epic 5 - Cashier redeem flow
FR17: Epic 5 - Receipt capture
FR18: Epic 5 - Redemption audit fields
FR19: Epic 5 - Coat issuance restricted to cashier
FR20: Epic 6 - CSV import
FR21: Epic 6 - Idempotency
FR22: Epic 6 - Receipt linking
FR23: Epic 6 - Line items storage
FR24: Epic 7 - Requested vs redeemed
FR24a: Epic 7 - Reconciliation post-hoc
FR25: Epic 5 - Billing math
FR26: Epic 7 - Reporting
FR27: Epic 7 - Reconciliation gaps
FR28: Epic 5/8 - Cashier access control
FR29: Epic 8 - Admin access control
FR30: Epic 8 - Nonce and rate limiting
FR31: Epic 5 - Overrides
FR32: Epic 5 - Override audit

## Epic List

### Epic 1: Organization and Conference Controls
Enable admins to define stores and conferences so voucher behavior is correctly gated per organization.
**FRs covered:** FR1, FR2, FR13, FR14, FR15

### Epic 2: Multi-Type Voucher Request Composition
Enable Vincentians to request clothing, furniture, and household vouchers with conference-gated sections and no coats.
**FRs covered:** FR3, FR4, FR7, FR19

### Epic 3: Closed Catalog UX (Furniture + Household)
Provide closed catalogs, category-first UI, and low-friction item selection for furniture/household.
**FRs covered:** FR5, FR6, FR7, FR9, FR10, FR11, FR12

### Epic 4: Catalog Snapshot Versioning
Persist immutable authorization snapshots at issuance for auditability and reconciliation.
**FRs covered:** FR8, FR10

### Epic 5: Cashier Redemption and Receipt Capture
Enable fast redemption with receipt capture and enforce coat issuance at cashier only.
**FRs covered:** FR16, FR17, FR18, FR19, FR25, FR28, FR31, FR32

### Epic 6: POS Receipt Import and Linking
Enable weekly CSV imports, idempotent receipt storage, and voucher-to-receipt linking.
**FRs covered:** FR20, FR21, FR22, FR23

### Epic 7: Reconciliation and Reporting
Enable requested-vs-redeemed comparison, unmatched receipts visibility, and conference/store reporting.
**FRs covered:** FR24, FR24a, FR26, FR27

### Epic 8: Security and Access Controls
Enforce nonces, capability checks, and public endpoint validation/rate limiting.
**FRs covered:** FR28, FR29, FR30

## Epic 1: Organization and Conference Controls

Enable admins to define stores and conferences so voucher behavior is correctly gated per organization.

### Story 1.1: Formalize Store Organizations and store_id

As an admin,
I want to manage store organizations and persist store_id on vouchers,
So that vouchers and receipts are correctly scoped for multi-store growth.

**Acceptance Criteria:**

**Given** an admin is managing organizations
**When** they create or edit an organization with organization_type = store
**Then** the store record includes name, active flag, and woodshop_paused flag

**Given** a voucher is created or redeemed
**When** the operation occurs in a specific store context
**Then** the voucher persists store_id and redemption uses that store_id

**Given** a receipt is linked
**When** it is stored or matched
**Then** linkage uses (store_id, receipt_id) internally

### Story 1.2: Conference allowed_voucher_types as Source of Truth

As a Vincentian volunteer,
I want the request form to show only the voucher types my conference allows,
So that I never select disallowed voucher types.

**Acceptance Criteria:**

**Given** a conference has allowed_voucher_types configured
**When** the request form loads
**Then** only those voucher-type sections render server-side

**Given** a disallowed voucher type is submitted via crafted POST
**When** the server validates the request
**Then** it rejects the submission with a validation error

**Given** no voucher types are enabled
**When** the form loads
**Then** a clear informational message is shown and submission is blocked

**Given** exactly one voucher type is enabled
**When** the form loads
**Then** it skips the multi-card UI and goes directly to that picker

## Epic 2: Multi-Type Voucher Request Composition

Enable Vincentians to request clothing, furniture, and household vouchers with conference-gated sections and no coats.

### Story 2.1: Multi-Type Voucher Request Form

As a Vincentian volunteer,
I want a request form that supports clothing, furniture, and household in any combination,
So that I can authorize what’s needed without extra steps.

**Acceptance Criteria:**

**Given** a conference allows multiple voucher types
**When** the request form loads
**Then** it renders one card per allowed type and keeps them collapsed until used

**Given** a conference allows a single voucher type
**When** the form loads
**Then** it goes directly to that section without the multi-card UI

**Given** a voucher is submitted
**When** multiple types were selected
**Then** the voucher records included types (flags or derived from authorizations)

### Story 2.2: Coats Restricted to Cashier Station Only

As a cashier,
I want coats to be issued only at the cashier station,
So that request forms never expose coats.

**Acceptance Criteria:**

**Given** a user is on the voucher request form
**When** they view voucher types or catalog items
**Then** no coat options appear anywhere in the UI or JS

**Given** a request submission includes coats
**When** the server validates the request
**Then** it rejects the request with a validation error

**Given** a cashier uses the cashier station
**When** coat issuance is needed
**Then** coats remain available only in the cashier station flow

## Epic 3: Closed Catalog UX (Furniture + Household)

Provide closed catalogs, category-first UI, and low-friction item selection for furniture/household.

### Story 3.1: Closed Catalog (No “Other” Categories)

As a Vincentian volunteer,
I want a closed, authoritative catalog for furniture and household,
So that authorizations are consistent and reconcilable.

**Acceptance Criteria:**

**Given** the catalog tables exist
**When** categories are seeded
**Then** no “Other” categories exist

**Given** a volunteer submits a furniture/household voucher
**When** no catalog items are selected
**Then** submission is rejected

**Given** a volunteer attempts to authorize an uncataloged item
**When** the request is validated
**Then** it is rejected (no free-form or dollar-only authorizations)

### Story 3.2: Final Furniture & Household Category Sets

As a volunteer,
I want clear category tiles for furniture and household goods,
So that I can quickly find items.

**Acceptance Criteria:**

**Given** the catalog is seeded
**When** categories are displayed
**Then** furniture and household categories match the finalized sets

**Given** a catalog item
**When** it is created or edited
**Then** it belongs to exactly one controlled category

**Given** categories are updated
**When** new vouchers are issued
**Then** category sets remain stable and versioned for historical readability

### Story 3.3: Volunteer Item Picker UX (Low-Friction)

As a volunteer,
I want a category-first item picker with simple quantity controls,
So that I can select items without confusion.

**Acceptance Criteria:**

**Given** the furniture/household section is opened
**When** the user enters the catalog
**Then** category tiles are the first interaction

**Given** a user views items in a category
**When** quantities are shown
**Then** each item defaults to 0 and is not selected until quantity > 0

**Given** at least one item is selected
**When** quantities change
**Then** the running min/max total appears and updates live

### Story 3.4: Woodshop Availability + Pause Support
**Status:** Completed

As a store manager,
I want woodshop availability states without hiding items,
So that volunteers can still request items even if paused/out of stock.

**Acceptance Criteria:**

**Given** a catalog item is woodshop
**When** its availability is set to out_of_stock
**Then** it remains visible, selectable, and labeled “Currently out of stock”

**Given** a store has woodshop_paused enabled
**When** woodshop items are displayed
**Then** they show “Woodshop paused (temporary)” and remain selectable

**Given** a non-woodshop item
**When** availability is set
**Then** no stock tracking is applied (woodshop only)

## Epic 4: Catalog Snapshot Versioning

Persist immutable authorization snapshots at issuance for auditability and reconciliation.

### Story 4.1: Catalog Snapshot on Voucher Issuance
Status: Completed

As an admin,
I want voucher authorizations stored as immutable snapshots,
So that historical vouchers remain auditable.

**Acceptance Criteria:**

**Given** a voucher is issued with catalog items
**When** authorizations are stored
**Then** snapshots include name, category, min/max price, woodshop flags, availability, quantity, and notes at issue

**Given** a catalog item is later edited
**When** a historical voucher is viewed
**Then** the original snapshot values are shown (unchanged)

**Given** a snapshot exists
**When** edits are attempted
**Then** there is no UI or endpoint to update snapshot data

## Epic 5: Cashier Redemption and Receipt Capture

Enable fast redemption with receipt capture and enforce coat issuance at cashier only.

### Story 5.1: Redeem Voucher with Receipt Capture
Status: Completed

As a cashier,
I want to redeem vouchers and record receipt_id (and gross total if required),
So that redemption is linked to receipts for reconciliation.

**Acceptance Criteria:**

**Given** a cashier is redeeming a voucher
**When** they submit receipt_id (and gross total if required)
**Then** the voucher is marked redeemed and receipt data is saved

**Given** the system is in a store context
**When** redemption is saved
**Then** the voucher is linked by store_id and receipt_id

### Story 5.2: Billing Math on Redemption

As store staff,
I want billing math computed at redemption,
So that conference vs store shares are consistent.

**Acceptance Criteria:**

**Given** a voucher has a conference cap and gross_total
**When** redemption is saved
**Then** conference pays 50% up to cap and store pays 50% up to cap plus 100% over cap

**Given** the gross_total is below cap
**When** billing is computed
**Then** both conference and store pay 50% of gross_total

### Story 5.3: Emergency Overrides with Audit Trail

As a cashier,
I want emergency overrides recorded with manager approval,
So that exceptions are accountable.

**Acceptance Criteria:**

**Given** an override is needed
**When** a manager code is validated
**Then** the override is recorded with manager_id, reason_id, cashier_user_id, and timestamp

**Given** an override is recorded
**When** it is reviewed
**Then** it includes an auditable reason and approver metadata

### Story 5.4: Coats Issuance in Cashier Station Only

As a cashier,
I want coat issuance to remain in the cashier station flow,
So that coat rules are enforced consistently.

**Acceptance Criteria:**

**Given** a voucher is eligible for coats
**When** the cashier station issues coats
**Then** coat counts and timestamps are recorded

**Given** coat issuance is attempted from request endpoints
**When** the server validates
**Then** the request is rejected

## Epic 6: POS Receipt Import and Linking

Enable weekly CSV imports, idempotent receipt storage, and voucher-to-receipt linking.

### Story 6.1: Weekly CSV Import (Store-Scoped)

As an admin,
I want to upload weekly POS CSVs scoped to a store,
So that receipts can be reconciled to vouchers.

**Acceptance Criteria:**

**Given** an admin uploads a CSV for a store
**When** the import begins
**Then** receipts persist with store_id, receipt_id, gross_total, and datetime

**Given** a CSV is imported twice
**When** duplicate rows are processed
**Then** duplicates are rejected based on (store_id, receipt_id)

### Story 6.2: Receipt Line Item Storage

As a store manager,
I want receipt line items stored when available,
So that clothing and reconciliation data can be derived.

**Acceptance Criteria:**

**Given** a CSV includes line items
**When** the import runs
**Then** receipt items are stored with qty and price data

**Given** a CSV contains only receipt summaries
**When** the import runs
**Then** receipts are stored without line items and import still succeeds

### Story 6.3: Voucher ↔ Receipt Linking

As a store manager,
I want vouchers linked to receipts via (store_id, receipt_id),
So that reconciliation is automatic.

**Acceptance Criteria:**

**Given** a voucher is redeemed with receipt_id
**When** the receipt exists in imports
**Then** the voucher is linked to that receipt

**Given** a receipt exists without a voucher
**When** reconciliation is viewed
**Then** it appears as an unmatched receipt

## Epic 7: Reconciliation and Reporting

Enable requested-vs-redeemed comparison, unmatched receipts visibility, and conference/store reporting.

### Story 7.1: Requested vs Redeemed View

As a store manager,
I want to compare authorized items to redeemed receipt items,
So that gaps are visible without cashier intervention.

**Acceptance Criteria:**

**Given** a furniture/household voucher with snapshots
**When** a linked receipt exists
**Then** the view shows requested items, redeemed items, and requested-not-redeemed items

**Given** no receipt is linked
**When** the reconciliation view loads
**Then** it shows requested items and indicates no receipt found

### Story 7.2: Unmatched Receipts Queue

As a store manager,
I want to see receipts that aren’t linked to vouchers,
So that reconciliation gaps are visible.

**Acceptance Criteria:**

**Given** receipts are imported
**When** they are not linked to vouchers
**Then** they appear in an unmatched receipts list by store and date

### Story 7.3: Reporting by Conference and Date Range

As a manager,
I want reporting by conference and date range,
So that billing totals and reconciliation gaps are clear.

**Acceptance Criteria:**

**Given** a conference and date range
**When** reporting is generated
**Then** totals and reconciliation gaps are shown for that scope

## Epic 8: Security and Access Controls

Enforce nonces, capability checks, and public endpoint validation/rate limiting.

### Story 8.1: REST Nonces and Capability Checks

As an admin,
I want REST endpoints protected by nonces and capabilities,
So that only authorized users can act.

**Acceptance Criteria:**

**Given** a protected REST endpoint
**When** a request lacks nonce or capability
**Then** it is rejected with 401/403

**Given** a public write endpoint
**When** a request is valid
**Then** it still requires a nonce and validates all inputs

### Story 8.2: Rate Limiting for Public Endpoints

As a system owner,
I want basic rate limiting on public endpoints,
So that abuse is reduced without extra infrastructure.

**Acceptance Criteria:**

**Given** an IP exceeds the burst or daily threshold
**When** requests continue
**Then** the system returns 429 with a short message

**Given** thresholds are updated
**When** limits are enforced
**Then** they come from a single centralized definition
