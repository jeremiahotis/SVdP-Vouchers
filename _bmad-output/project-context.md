---
project_name: "SVdP-Vouchers"
user_name: "Jeremiah"
date: "2026-01-15 05:21"
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - code_style_rules
  - workflow_rules
  - critical_rules
status: "complete"
rule_count: 57
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- WordPress core: 6.9 (current per WordPress API)
- PHP: unpinned (use site runtime)
- jQuery: WordPress-bundled (no explicit version)
- WordPress REST API: primary integration surface (REST-only for new APIs)
- MySQL via `$wpdb` (WordPress DB)
- Redis object cache: optional if available (no hard dependency)

## Critical Implementation Rules

### Language-Specific Rules

- PHP: always sanitize/escape (`sanitize_text_field`, `sanitize_email`, `sanitize_textarea_field`, `esc_html`, `esc_attr`).
- PHP: use `$wpdb` + `dbDelta` for schema changes; keep migrations idempotent.
- PHP: use `WP_Error` and convert via a single helper to the standard JSON error schema.
- JS: jQuery-based; no build step—write plain JS in `public/js/` and `admin/js/`.
- JS/PHP: REST and admin-ajax requests require nonces (see `svdpVouchers` / `svdpAdmin` localization).
- JSON fields: `snake_case`; dates as ISO‑8601 UTC with `Z` suffix.
- Indentation: 4 spaces in PHP and JS (keep existing brace/spacing style).

### Framework-Specific Rules (WordPress)

- Register REST endpoints under `/wp-json/svdp/v1/` in `svdp-vouchers.php`; REST-only for new APIs (no new admin-ajax).
- Use shortcodes as the public entry points (`[svdp_voucher_request]`, `[svdp_cashier_station]`).
- Admin UI lives under `SVdP Vouchers` menu with tab views in `admin/views/`.
- Cashier access must enforce `svdp_cashier` capability (avoid role-name checks).
- Public request form must use `allowed_voucher_types` and conference-scoped custom text/rules.
- Keep “coat” issuance strictly in cashier station (per `SCOPE.md` and `UI_STATES.md`).

### Testing Rules

- Manual tests are required; follow `TEST_PLAN.md` (no automated harness).
- Always validate voucher create, duplicate detection, status updates, and cashier station refresh.
- If touching date logic, test 90-day eligibility and Aug 1 coat reset edge cases.
- For multi-type vouchers, ensure disallowed types are rejected server-side (not just hidden in UI).
- For request form, verify 0/1/2–3 allowed types render correctly (see `UI_STATES.md`).
- For imports: verify idempotency, unmatched receipts visibility, and batch processing.

### Code Quality & Style Rules

- 4-space indentation in PHP and JS; keep braces and spacing consistent with existing files.
- Class names: `SVDP_*`; file names: `class-*.php`.
- REST routes live under `/wp-json/svdp/v1/` and are registered in `svdp-vouchers.php`.
- Errors: use `WP_Error` and convert to standard JSON error schema.
- JSON fields are `snake_case`; dates are ISO‑8601 UTC with `Z` suffix.
- Preserve nonce usage and capability checks on all write endpoints.
- Keep admin views in `admin/views/`, public templates in `public/templates/`.

### Development Workflow Rules

- Local dev runs in Local by Flywheel; no build step or package manager.
- Edit files directly, refresh page for changes.
- DB migrations must be idempotent and update `svdp_schema_version` (see `db/migrations/README.md`).
- Feature flags gate new UI/routes (see `MIGRATION.md`).
- REST-only for new APIs; avoid adding new admin-ajax endpoints.
- CSV import runs in REST batches; store run metadata in `svdp_import_runs`.
- Rate-limit thresholds live in a single place (constants or `RATE_LIMITS.md`) to avoid drift.

### Critical Don't-Miss Rules

- Coats are cashier-station only; never expose coats in voucher request form (`SCOPE.md`).
- Voucher request form must render only allowed types; if none enabled, block submission (`UI_STATES.md`).
- Furniture/household must use closed catalog; no “Other” or free-form $ amounts (`SCOPE.md`).
- Catalog selections default qty = 0; totals shown only after qty > 0 (`UI_STATES.md`).
- Voucher authorization snapshots are immutable after issuance (`DATA_DICTIONARY.md`).
- Store receipt capture is required at redemption until CSV import is proven reliable (`SCOPE.md`).
- POS CSV import must be idempotent; unique `(store_id, receipt_id)` (`POS_CSV_CONTRACT.md`).
- CSV import must be batch/resumable (no single long request).
- REST-only for new APIs; do not add new admin-ajax endpoints.
- Audit events must be persisted for redemption, overrides, and imports.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update when technology stack changes.
- Review quarterly for outdated rules.
- Remove rules that become obvious over time.

Last Updated: 2026-01-15 05:21
