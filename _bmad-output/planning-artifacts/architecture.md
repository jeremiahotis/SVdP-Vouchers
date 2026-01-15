---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/project-context.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/source-tree-analysis.md
  - docs/component-inventory.md
  - docs/development-guide.md
  - docs/deployment-guide.md
  - docs/api-contracts-plugin.md
  - docs/data-models-plugin.md
  - docs/comprehensive-analysis-plugin.md
  - docs/document-project-validation-summary.yaml
  - docs/supporting-documentation-summary.yaml
  - docs/document-project-step3-template-outputs.yaml
  - docs/document-project-step2-template-outputs.yaml
  - docs/document-project-template-outputs.yaml
  - docs/document-project-final-summary.yaml
  - docs/project-scan-report.json
  - README.md
  - SCOPE.md
  - TEST_PLAN.md
  - UI_STATES.md
  - MIGRATION.md
  - DATA_DICTIONARY.md
  - POS_CSV_CONTRACT.md
  - update-redemption-instructions.sql
  - db/migrations/README.md
  - db/migrations/v0003__20260114__add_store_id.php
  - db/migrations/v0004__20260114__create_catalog_tables.php
  - db/migrations/v0005__20260114__create_authorization_snapshots.php
  - db/migrations/v0006__20260114__create_pos_receipt_tables.php
workflowType: 'architecture'
project_name: 'SVdP-Vouchers'
user_name: 'Jeremiah'
date: '2026-01-14 17:52'
lastStep: 8
status: 'complete'
completedAt: '2026-01-15 05:21'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The system extends an existing WordPress voucher plugin to support multi‑type vouchers (clothing, furniture, household), closed catalogs, and immutable authorization snapshots. Cashier redemption must capture receipt IDs without line‑item entry. Weekly CSV imports link POS receipts to vouchers and enable reconciliation and billing rules (50% up to cap, 100% over). Admins manage conferences, stores, catalogs, and overrides. Feature flags gate rollout.

**Non-Functional Requirements:**
Performance targets for request form and cashier station (p95 constraints), WCAG 2.1 AA best‑effort for core flows, strict idempotency for imports, zero silent failures, nonce + capability enforcement, rate limiting for any public write endpoints, and auditability of redemption/override actions.

**Scale & Complexity:**
Medium complexity in a brownfield WordPress plugin, with data integrity as the critical axis (voucher ↔ receipt ↔ billing). No real‑time constraints beyond periodic cashier refresh. No external compliance requirements.

- Primary domain: WordPress plugin (PHP) with REST/REST-ajax and jQuery UI
- Complexity level: medium
- Estimated architectural components: 6–8 (request form, catalog management, voucher lifecycle, redemption, import/reconciliation, reporting/admin)

### Technical Constraints & Dependencies

- Must remain WordPress MPA; no SPA framework.
- Use WordPress REST API + admin-ajax, nonce-based auth, and role checks.
- Feature flags required for rollout and safe backward compatibility.
- Schema migrations must be idempotent; migration runner updates `svdp_schema_version`.
- No build tooling; assets are plain JS/CSS.
- POS import is manual, weekly, chunked to avoid PHP timeouts.

### Cross-Cutting Concerns Identified

- Data integrity and immutability (snapshots, receipt linkage).
- Idempotent import and reconciliation visibility (unmatched receipts).
- Security (nonces, role gating, public write rate limiting).
- Performance under cashier load.
- Backward-compatible rollout via flags.

## Starter Template Evaluation

### Primary Technology Domain

WordPress plugin (PHP + jQuery) based on existing codebase and deployment constraints.

### Starter Options Considered

**Option 1: WordPress Plugin Boilerplate (DevinVinson/WordPress-Plugin-Boilerplate)**
- Maintained reference structure for WP plugins.
- Establishes OOP structure, clear admin/public separation, and organized includes.
- Useful for greenfield plugins; less relevant for a brownfield system already structured similarly.

**Option 2: WP‑CLI scaffold plugin**
- Official WordPress CLI generator.
- Creates a minimal, standard plugin skeleton quickly.
- Best for greenfield; does not match current architecture or existing tables/routes.

### Selected Starter: None (use existing codebase)

**Rationale for Selection:**
This is a brownfield WordPress plugin with established structure, custom tables, REST endpoints, and front‑end templates. Introducing a starter would add churn without benefit. Architecture decisions will layer onto the existing plugin layout and feature‑flagged migrations.

**Reference (if greenfield were needed):**

```bash
wp scaffold plugin svdp-vouchers
```

**Architectural Decisions Provided by Starter (Not Adopted):**

**Language & Runtime:** PHP, WordPress plugin API  
**Styling Solution:** None (starter‑agnostic)  
**Build Tooling:** None  
**Testing Framework:** None by default (depends on starter)  
**Code Organization:** Conventional WP plugin layout  
**Development Experience:** Standard WP CLI workflow

**Note:** Project initialization via a starter is out of scope for this brownfield upgrade.

## Core Architectural Decisions

### Data Architecture

**Schema strategy:** Add new tables exactly as defined in `DATA_DICTIONARY.md`: `svdp_catalog_items`, `svdp_voucher_authorizations`, `svdp_pos_receipts`, `svdp_pos_receipt_items`, `svdp_voucher_receipt_links`.

**Deviations (approved, minimal):**
- Keep `svdp_voucher_receipt_links` even with 1:1 enforcement to allow future split receipts/refunds without schema churn.
- Add an `svdp_import_runs` table (or equivalent persisted store) to track import metadata: `started_at`, `ended_at`, `rows_read`, `rows_inserted`, `rows_skipped`, `errors`.

**Linking rule (voucher <-> receipt):** Default 1 voucher to 1 receipt. Enforce uniqueness at the application layer for MVP, but keep schema flexible for future multi-receipt scenarios.
- Enforce unique on `svdp_voucher_receipt_links.voucher_id` for MVP.
- Do not rely on a single `receipt_id` column in vouchers as the only linkage.

**Receipt linkage key:** `(store_id, receipt_id)` is the unique receipt identity.
- Unique index on `svdp_pos_receipts(store_id, receipt_id)`.
- Unique index on `svdp_voucher_receipt_links(store_id, receipt_id)`.

**Snapshot immutability:** Strict immutability after issuance.
- `svdp_voucher_authorizations` is append-only at issuance; no edit UI or update endpoints.
- Changes to authorizations require cancel/reissue or override flow; no mutation of history.
- Operational updates allowed only on voucher header (status, redemption, override metadata).

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Schema additions per `DATA_DICTIONARY.md` plus `svdp_import_runs` and `svdp_audit_events`.
- Strict snapshot immutability for voucher authorizations.
- REST-only API expansion under `/wp-json/svdp/v1/`.
- CSV import as resumable, batch-processed REST workflow.
- Nonce + capability enforcement with IP throttling on public write endpoints.

**Important Decisions (Shape Architecture):**
- REST standard error schema using `WP_Error` conversion.
- Transient-based throttling for public endpoints.
- Audit logging in DB (not file logs).
- Use Redis object cache if available; no mandatory cache layer.

**Deferred Decisions (Post-MVP):**
- Multi-receipt per voucher (schema supports; application currently enforces 1:1).
- Advanced abuse analytics or dedicated rate-limit tables.
- External monitoring/alerting services.

### Authentication & Security

- **Auth model:** WordPress capabilities + REST nonces.
  - Admin operations gated by `manage_options`.
  - Cashier operations gated by `svdp_cashier` capability (not role-name checks).
- **Public write endpoints:** Nonce required + IP-based throttling using transients.
  - Default policy: 10 requests / 5 minutes; 50 requests / day per IP key.
  - Optional User-Agent hash for collision reduction.
  - 429 response on limit.
- **Manager overrides:** Hash-only codes, `hash_equals` for comparison, per-IP throttling on validation.
  - Log `voucher_id`, `manager_id`, `reason_id`, `cashier_user_id`, `created_at`.
- **Data protection:** No field-level encryption beyond hashing secrets; minimize stored sensitive data.

### API & Communication Patterns

- **New APIs:** REST-only under `/wp-json/svdp/v1/` (no new admin-ajax).
- **Error schema:** Consistent JSON error format with WP-native `WP_Error` mapping.
- **CSV import:** Multi-step batch processing via REST:
  - `POST /imports` -> create run + store file.
  - `POST /imports/{id}/process` -> batch rows.
  - `GET /imports/{id}` -> status.
- **Admin UI:** Server-rendered shells, data loaded via REST with nonces.

### Frontend Architecture

- **Pattern:** WordPress MPA + progressive enhancement.
- **Client:** jQuery only; no SPA framework, no build step.
- **Behavior:** Dynamic catalog selection and totals handled client-side; data saved via REST.

### Infrastructure & Deployment

- **Hosting:** Managed WordPress with Redis object cache available; no other services.
- **Auditability:** DB table `svdp_audit_events` for redemption/overrides/imports.
- **Caching:** No explicit caching layer required; use request-scope caching and optional short TTL transients with simple invalidation.
- **Monitoring:** Import runs tracked in DB; UI shows last import status and error counts; optional wp_mail alerts on import failure.

### Decision Impact Analysis

**Implementation Sequence:**
1. Schema migrations + versioning
2. REST endpoints (catalog, imports, reconciliation)
3. Request form + catalog UI
4. Redemption updates + receipt linkage
5. Import UI + batch processor
6. Reconciliation views + reporting

**Cross-Component Dependencies:**
- Import processing depends on receipt tables + import run metadata.
- Reconciliation depends on immutable snapshots and receipt linkage.
- Admin UI depends on REST endpoints + error schema.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
Naming conventions, API error schema, REST-only APIs, date formats, validation flow, and rate limiting thresholds.

### Naming Patterns

**Database Naming Conventions:**
- Tables: `wp_svdp_*`
- Columns: `snake_case` (`voucher_id`, `receipt_id`)
- Foreign keys: `*_id`
- Indexes: `idx_{table}_{column}` (e.g., `idx_svdp_pos_receipts_store_id`)

**API Naming Conventions:**
- REST path names use plural nouns and kebab-case: `/catalog-items`, `/voucher-authorizations`
- Query params use `snake_case` (e.g., `store_id`, `receipt_id`)

**Code Naming Conventions:**
- PHP classes: `SVDP_*`
- PHP files: `class-*.php`
- JS files: `public/js/*.js`, `admin/js/*.js` (no build step)

### Structure Patterns

**Project Organization:**
- REST handlers and domain logic live in `includes/`.
- REST routes registered in `svdp-vouchers.php`.
- Admin pages are server-rendered shells; data loaded via REST.

**File Structure Patterns:**
- Public templates: `public/templates/`
- Admin templates: `admin/views/`
- Assets remain in `public/js`, `public/css`, `admin/js`, `admin/css`

### Format Patterns

**API Response Formats:**
- Success responses return data directly.
- Errors use standard JSON schema:
  ```
  { "code": "...", "message": "...", "details": { "field_errors": { ... } } }
  ```

**Data Exchange Formats:**
- JSON fields are `snake_case`.
- Dates are ISO‑8601 UTC with `Z` suffix (e.g., `2026-01-15T14:32:10Z`).
- Booleans are `true/false` (never `1/0`).

### Process Patterns

**Validation:**
- Server-side validation is required for all writes; UI validation is additive only.

**Error Handling:**
- Use `WP_Error` internally; convert in a single helper to the standard error schema.

**Rate Limiting:**
- Transient-based throttling.
- Thresholds documented in one place (constants or `RATE_LIMITS.md`) to avoid drift.

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow naming and file placement rules.
- Use REST-only endpoints for new functionality.
- Return errors using the standard schema.

**Pattern Enforcement:**
- Review PRs against this section.
- Update this section if a pattern changes.

## Project Structure & Boundaries

### Complete Project Directory Structure
```
SVdP-Vouchers/
├── svdp-vouchers.php
├── includes/
│   ├── class-database.php
│   ├── class-voucher.php
│   ├── class-conference.php
│   ├── class-settings.php
│   ├── class-catalog.php
│   ├── class-manager.php
│   ├── class-override-reason.php
│   ├── class-admin.php
│   ├── class-shortcodes.php
│   ├── class-import.php              # NEW: import run + batch processing
│   ├── class-reconciliation.php       # NEW: requested vs redeemed views
│   ├── class-audit.php                # NEW: audit event logging
│   ├── class-rest-errors.php          # NEW: WP_Error -> JSON error schema helper
│   └── class-rate-limits.php          # NEW: transient throttling utilities
├── admin/
│   ├── views/
│   │   ├── admin-page.php
│   │   ├── tab-analytics.php
│   │   ├── tab-conferences.php
│   │   ├── tab-household-goods.php
│   │   ├── tab-furniture.php
│   │   ├── tab-settings.php
│   │   ├── managers-tab.php
│   │   ├── override-reasons-tab.php
│   │   └── tab-imports.php            # NEW: import UI + reconciliation status
│   ├── js/
│   │   ├── admin.js
│   │   ├── managers.js
│   │   ├── override-reasons.js
│   │   └── imports.js                 # NEW: import runner + polling
│   └── css/
│       └── admin.css
├── public/
│   ├── templates/
│   │   ├── voucher-request-form.php
│   │   └── cashier-station.php
│   ├── js/
│   │   ├── voucher-request.js
│   │   └── cashier-station.js
│   └── css/
│       └── voucher-forms.css
├── db/
│   └── migrations/
│       ├── README.md
│       ├── v0003__20260114__add_store_id.php
│       ├── v0004__20260114__create_catalog_tables.php
│       ├── v0005__20260114__create_authorization_snapshots.php
│       ├── v0006__20260114__create_pos_receipt_tables.php
│       └── v0007__YYYYMMDD__audit_and_import_runs.php  # NEW
├── docs/
│   └── ...
├── README.md
├── DATA_DICTIONARY.md
├── MIGRATION.md
├── POS_CSV_CONTRACT.md
├── SCOPE.md
├── TEST_PLAN.md
├── UI_STATES.md
└── update-redemption-instructions.sql
```

### Architectural Boundaries

**API Boundaries:**
- REST routes under `/wp-json/svdp/v1/` registered in `svdp-vouchers.php`.
- Admin screens are server-rendered; all data mutations occur through REST.

**Component Boundaries:**
- `includes/` classes own business logic and REST handlers.
- `admin/` holds admin UI shells + JS for REST calls.
- `public/` holds front-end templates + JS for request/cashier flows.

**Data Boundaries:**
- Custom tables hold voucher, catalog, receipt, and audit data.
- No external services; POS import is offline CSV.

### Requirements to Structure Mapping

**Voucher Request & Authorization**
- UI: `public/templates/voucher-request-form.php`, `public/js/voucher-request.js`
- Logic: `includes/class-voucher.php`, `includes/class-catalog.php`

**Catalog Management**
- Admin UI: `admin/views/tab-furniture.php`, `admin/views/tab-household-goods.php`
- Logic: `includes/class-catalog.php`

**Cashier Redemption**
- UI: `public/templates/cashier-station.php`, `public/js/cashier-station.js`
- Logic: `includes/class-voucher.php`

**Imports & Reconciliation**
- Admin UI: `admin/views/tab-imports.php`, `admin/js/imports.js`
- Logic: `includes/class-import.php`, `includes/class-reconciliation.php`

**Audit & Overrides**
- Logic: `includes/class-audit.php`, `includes/class-manager.php`, `includes/class-override-reason.php`

### Integration Points

**Internal Communication:**
- UI layers call REST endpoints with nonces.
- REST handlers call domain classes in `includes/`.

**External Integrations:**
- POS CSV import via admin upload; no real-time POS coupling.

**Data Flow:**
- Request → voucher + snapshots → redemption with receipt ID → import receipts → reconciliation + reporting.

### File Organization Patterns

- REST helpers live in `includes/`.
- Admin UI and scripts in `admin/`.
- Public templates and scripts in `public/`.
- Migrations in `db/migrations/`.

### Development Workflow Integration

- No build step; edit files directly.
- Feature flags gate new routes/UI in `includes/class-settings.php`.
- Migration runner in `includes/class-database.php` applies `db/migrations/`.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All core decisions align: WordPress MPA + REST-only APIs + nonce auth + transient throttling + idempotent imports. The Redis object cache requirement is optional and does not conflict with no-build workflow.

**Pattern Consistency:**
Naming, error schema, and validation rules are consistent with the chosen REST-only approach and WP conventions.

**Structure Alignment:**
Proposed file layout maps cleanly to existing `includes/`, `admin/`, and `public/` boundaries and supports new features without new top-level subsystems.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All FR categories are supported by structure and decisions:
- Multi-type requests, closed catalogs, snapshots: covered by `class-catalog.php`, `class-voucher.php`, snapshot table.
- Redemption + receipt capture: covered by `class-voucher.php` + receipt tables.
- CSV import + reconciliation: covered by `class-import.php`, `class-reconciliation.php`, import runs table.
- Admin management + overrides: covered by admin views + manager/override classes.

**Non-Functional Requirements Coverage:**
- Performance: batch import flow + no SPA.
- Security: nonce/capability + rate limiting.
- Reliability: idempotent imports + audit trails.
- Accessibility: MPA + progressive enhancement.
- Integration: manual CSV + batch processing.

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions documented; versions verified (WordPress core via API; Redis optional).

**Structure Completeness:**
All new components have explicit file locations and mapping.

**Pattern Completeness:**
Conflict points addressed (naming, errors, date formats, validation, throttling).

### Gap Analysis Results

**Critical Gaps:** None found.  
**Important Gaps:** None found.  
**Nice-to-Have Gaps:** Optional email notifications on import failure (already noted), and a `RATE_LIMITS.md` if preferred over constants.

### Validation Issues Addressed

No blocking issues identified.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context analyzed
- [x] Constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Data architecture locked
- [x] Security & auth decisions locked
- [x] REST API and import patterns locked
- [x] Hosting + audit logging locked

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Error schema standardized
- [x] Date/time format standardized
- [x] Rate limiting approach documented

**✅ Project Structure**
- [x] Directory structure defined
- [x] Boundaries mapped
- [x] Requirements mapped to files

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION  
**Confidence Level:** High

**Key Strengths:**
- Clear data model + immutable snapshots
- Cohesive REST-only API strategy
- Resumable import design aligned with hosting constraints

**Areas for Future Enhancement:**
- Optional alerting on import failures
- Enhanced rate-limit analytics (if needed)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow architecture decisions and patterns as canonical.
- Use REST endpoints for all new functionality.
- Keep immutable snapshot behavior enforced.

**First Implementation Priority:**
- Implement migrations + schema versioning, then REST endpoints for catalog/imports.
