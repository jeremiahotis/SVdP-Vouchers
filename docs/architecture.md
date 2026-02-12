# Architecture (SVdP Vouchers)

## Overview
SVdP Vouchers is a WordPress plugin monolith with clear separation between domain logic, admin UI, and public UI. The plugin uses WordPress hooks, REST endpoints, and admin-ajax actions to drive workflows.

## Components

### Bootstrap
- `svdp-vouchers.php` registers:
  - Activation hooks
  - REST routes
  - Shortcodes
  - Asset enqueues
  - Heartbeat + REST nonce refresh

### Domain Logic (`includes/`)
- `SVDP_Database`: schema creation, defaults, migration runner.
- `SVDP_Voucher`: voucher lifecycle, duplicate detection, redemption updates.
- `SVDP_Conference`: organization CRUD + REST list.
- `SVDP_Settings`: settings storage.
- `SVDP_Catalog`: catalog CRUD for furniture/household.
- `SVDP_Manager` + `SVDP_Override_Reason`: override approval system.
- `SVDP_Admin`: admin page wiring + AJAX handlers.
- `SVDP_Shortcodes`: public/cashier shortcode rendering.

### Admin UI (`admin/`)
- Tabbed admin page: analytics, conferences, managers, override reasons, settings.
- AJAX actions for CRUD and settings updates.

### Public UI (`public/`)
- Voucher request form template.
- Cashier station template with real-time refresh.

## Data Flow
1. Vincentian submits request -> REST `/vouchers/check-duplicate` -> `/vouchers/create`.
2. Cashier station loads vouchers -> REST `/vouchers`.
3. Redemption updates -> REST `/vouchers/{id}/status`.
4. Coat issuance -> REST `/vouchers/{id}/coat`.
5. Admin CRUD -> admin-ajax actions.

## Security
- Nonce-protected REST calls.
- Admin actions gated by `manage_options`.
- Cashier station gated by `svdp_cashier` role.

## Deployment
- Standard WordPress plugin deployment (no build step).
