# Development Guide (SVdP Vouchers)

## Prerequisites
- Local by Flywheel (WordPress runtime)
- PHP (handled by Local)
- MySQL (handled by Local)

## Local Setup
1. Start the Local site.
2. Ensure plugin directory is in `wp-content/plugins/SVdP-Vouchers`.
3. Activate the plugin in WordPress admin.

## Common Workflows
- Voucher request form: create a page with `[svdp_voucher_request]`.
- Cashier station: create a page with `[svdp_cashier_station]`.
- Admin settings: WP Admin → SVdP Vouchers.

## Database
- Schema is managed in `includes/class-database.php`.
- Planned migrations live in `db/migrations/`.
- One-off SQL updates live in `update-redemption-instructions.sql`.

## Assets
- Front-end JS/CSS: `public/js/`, `public/css/`.
- Admin JS/CSS: `admin/js/`, `admin/css/`.
- Assets are enqueued in `svdp-vouchers.php` and `includes/class-admin.php`.

## Testing
- Manual checklist lives in `TEST_PLAN.md`.
- Suggested quick checks:
  - Submit voucher request.
  - Redeem voucher at cashier station.
  - Verify duplicate detection.

## Notes
- No build step or package manager.
- Changes are reflected after page refresh.
