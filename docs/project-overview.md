# Project Overview: SVdP Vouchers

**Type:** WordPress plugin
**Repository:** Monolith (single plugin codebase)

## Purpose
SVdP Vouchers manages virtual vouchers for St. Vincent de Paul organizations. It supports voucher requests, cashier redemption, duplicate detection, and optional integrations.

## Key Capabilities
- Voucher request form for conferences/partners
- Cashier station for redemption + coat issuance
- Duplicate detection with eligibility windows
- Admin management (conferences, managers, override reasons, settings)

## Tech Stack
| Category | Technology | Notes |
| --- | --- | --- |
| Platform | WordPress | Plugin hooks, shortcodes, REST API |
| Backend | PHP | Core logic in `includes/` |
| Frontend | jQuery | Admin + public UI |
| DB | MySQL | Custom tables via `dbDelta` |

## Architecture Pattern
WordPress plugin monolith with clear separation of domain logic, admin UI, and public templates.

## Repository Structure
- `includes/` domain logic + REST handlers
- `admin/` admin screens + assets
- `public/` front-end templates + assets
- `db/migrations/` planned schema migrations

## Related Docs
- API Contracts: `docs/api-contracts-plugin.md`
- Data Models: `docs/data-models-plugin.md`
- Source Tree: `docs/source-tree-analysis.md`
- Comprehensive Analysis: `docs/comprehensive-analysis-plugin.md`
