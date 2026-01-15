# Comprehensive Analysis (SVdP Vouchers)

## Architecture Summary
- WordPress plugin monolith with clear separation:
  - `includes/` domain logic and data access
  - `admin/` wp-admin UI (views, JS/CSS)
  - `public/` front-end templates and JS/CSS
- REST API under `/wp-json/svdp/v1/` for front-end and cashier station.
- admin-ajax endpoints for admin-only management workflows.

## Entry Points
- Plugin bootstrap: `svdp-vouchers.php`
  - Registers activation hooks, REST routes, assets, and heartbeat/session handling.
- Shortcodes:
  - `[svdp_voucher_request]` -> `public/templates/voucher-request-form.php`
  - `[svdp_cashier_station]` -> `public/templates/cashier-station.php`

## Authentication and Authorization
- Cashier station access: `svdp_cashier` role or Administrator.
- Admin actions require `manage_options` and `svdp_admin_nonce`.
- REST endpoints use WordPress nonces (`X-WP-Nonce`).

## Configuration & Settings
- Settings stored in `wp_svdp_settings` (adult/child item values, store hours, redemption instructions, voucher types).
- Conference-specific behavior stored in `wp_svdp_conferences` (eligibility_days, allowed_voucher_types, custom form text/rules).

## Shared Utilities
- `SVDP_Settings` for global settings.
- `SVDP_Conference` for org CRUD.
- `SVDP_Voucher` for voucher lifecycle + duplicate detection.
- `SVDP_Database` for schema and migrations.

## Async/Events
- WordPress hooks: `plugins_loaded`, `admin_init`, `rest_api_init`, `wp_enqueue_scripts`, `heartbeat_settings`, `heartbeat_received`.
- Heartbeat + REST nonce refresh for long cashier sessions.

## CI/CD / Deployment
- No build step; deploy as WordPress plugin.
- Local dev via Local by Flywheel (manual refresh).

## Localization
- Text domain: `svdp-vouchers`.
- No dedicated i18n folder detected.

## Risks / Gaps
- Migration stubs exist but not implemented (v0003–v0006).
- Catalog tables referenced by code are not created in current schema.
