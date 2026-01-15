# API Contracts (SVdP Vouchers)

## Overview
The plugin exposes WordPress REST API endpoints under `/wp-json/svdp/v1/` and admin-only AJAX actions under `admin-ajax.php`.

## REST API

### GET /wp-json/svdp/v1/vouchers
- Auth: `svdp_cashier` role or Administrator (nonce required).
- Purpose: Return voucher list for cashier station.
- Response: Array of voucher objects with computed fields (status, coat eligibility).

### POST /wp-json/svdp/v1/vouchers/check-duplicate
- Auth: Public (nonce required).
- Purpose: Duplicate check for voucher requests.
- Body:
  - firstName, lastName, dob, voucherType, createdBy
- Response:
  - found (bool)
  - matchType (exact|similar)
  - voucherCreatedDate, nextEligibleDate, conference, vincentianName (if found)

### POST /wp-json/svdp/v1/vouchers/create
- Auth: Public (nonce required).
- Purpose: Create new voucher request.
- Body:
  - firstName, lastName, dob, adults, children, conference, voucherType, vincentianName, vincentianEmail
- Response:
  - success details and nextEligibleDate, coatEligibleAfter (if applicable)

### POST /wp-json/svdp/v1/vouchers/create-denied
- Auth: Public (nonce required).
- Purpose: Log denied voucher attempt.
- Body: voucher identity and denial_reason.

### PATCH /wp-json/svdp/v1/vouchers/{id}/status
- Auth: `svdp_cashier` role or Administrator (nonce required).
- Purpose: Update voucher status to Redeemed; stores redemption details.
- Body:
  - status
  - itemsAdult/itemsChildren
  - redemption_total_value

### PATCH /wp-json/svdp/v1/vouchers/{id}/coat
- Auth: `svdp_cashier` role or Administrator (nonce required).
- Purpose: Issue coats and update coat-related counts.
- Body:
  - coatStatus, coatAdultsIssued, coatChildrenIssued

### GET /wp-json/svdp/v1/conferences
- Auth: Public (nonce required).
- Purpose: List active conferences/organizations.

### POST /wp-json/svdp/v1/auth/refresh-nonce
- Auth: Logged-in users (nonce not required).
- Purpose: Refresh REST nonce for cashier station.

### POST /wp-json/svdp/v1/managers/validate
- Auth: Public (nonce required).
- Purpose: Validate manager override code.
- Body:
  - code

### GET /wp-json/svdp/v1/override-reasons
- Auth: Public (nonce required).
- Purpose: Load active override reasons for cashier modal.

## Admin AJAX (admin-ajax.php)
All actions require `svdp_admin_nonce` and `manage_options` capability.

- svdp_add_conference
- svdp_delete_conference
- svdp_update_conference
- svdp_save_settings
- svdp_update_voucher_types
- svdp_get_custom_text
- svdp_save_custom_text
- svdp_apply_analytics_filters
- svdp_add_manager
- svdp_get_managers
- svdp_deactivate_manager
- svdp_regenerate_code
- svdp_add_reason
- svdp_get_reasons
- svdp_update_reason
- svdp_delete_reason
- svdp_reorder_reasons

## Notes
- All REST endpoints use `X-WP-Nonce` header for auth where applicable.
- Cashier station uses heartbeat + nonce refresh to keep sessions alive.
