# Repository Guidelines

## Project Structure & Module Organization
- `svdp-vouchers.php` boots the WordPress plugin and wires core classes.
- `includes/` holds PHP domain logic (database setup, vouchers, conferences, admin, shortcodes).
- `admin/` contains wp-admin UI assets and tab views (`admin/views/`, `admin/js/`, `admin/css/`).
- `public/` contains front-end templates and assets for shortcodes (`public/templates/`, `public/js/`, `public/css/`).
- `update-redemption-instructions.sql` contains one-off database updates.

## Build, Test, and Development Commands
- This plugin runs inside a **Local by Flywheel** WordPress environment. Start/stop the site and access DB/logs via the Local UI.
- There is no local build step or package manager in this repo. Edit files directly and refresh the site.
- Example runtime check: load a page with `[svdp_voucher_request]` or `[svdp_cashier_station]` and confirm REST calls in the browser console.
- **VoucherShyft API tests require Postgres in Docker Compose.** When running test scripts (for example `pnpm test:tenant`), run them inside the compose environment. Use `docker compose -f infra/docker/docker-compose.yml run --rm api-test pnpm test:tenant`. Do not assume `db` is resolvable on the host.
- **Mandatory testing rule (repo-wide):** Always run the full relevant test suite for any change before considering the work complete. Do not skip tests. If tests fail, diagnose and fix. We do not release untested changes. Use Murat’s test designs as the source of truth for coverage.

## Coding Style & Naming Conventions
- PHP and JS use 4-space indentation; keep braces and spacing consistent with existing files.
- Class names follow `SVDP_*` (e.g., `SVDP_Voucher`) and file names are `class-*.php`.
- REST endpoints live under `/wp-json/svdp/v1/`; keep new routes in `includes/class-admin.php` or related classes.
- Keep WordPress sanitization/escaping patterns and nonce checks consistent with existing handlers.

## Testing Guidelines
- No automated test harness in this repository.
- Manual checks should cover: voucher create, duplicate detection, status updates, and cashier station DataTables refresh.
- If touching date logic, test edge cases around the 90-day window and August 1 coat reset.

## Commit & Pull Request Guidelines
- Recent commits use concise, imperative subjects (e.g., “Update voucher-request.js”).
- When applicable, include a short scope or phase tag in the subject (e.g., “Phase 8-9”).
- PRs should describe user-visible changes, list affected pages/shortcodes, and include screenshots for UI changes.

## Security & Configuration Notes
- Public endpoints are intentional; preserve nonce usage and capability checks.
- Monday.com sync is optional and guarded by feature checks; avoid hard dependencies.
- See `CLAUDE.md` for deeper architecture and business rules before modifying core logic.
