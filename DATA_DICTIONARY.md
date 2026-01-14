# Data dictionary

This document describes the core tables/fields for the next phase, what each field means, and what is source-of-truth vs derived.

## Source-of-truth principles

- **POS is the system of record** for what was actually redeemed (line items and totals).
- The plugin is the system of record for:
  - authorization intent (voucher + catalog snapshots)
  - governance (conference settings, allowed types)
  - billing math (conference share vs store share)
  - reporting aggregates and reconciliation views

## Existing tables (already in plugin)

### `{prefix}svdp_vouchers` (existing)
Stores the voucher header record and cashier actions.

Key fields (current + planned additions):
- `id` (PK)
- `conference_id` (FK to conferences/orgs)
- Neighbor identity fields (name/address/phone, etc.)
- Household fields (adults/children counts, etc.)
- `status` (Issued / Redeemed / Denied, etc.)
- `created_at`, `redeemed_at`
- `is_emergency` (cashier-created emergency voucher)
- **Planned:** `store_id` (FK to store organization)
- **Planned:** `pos_receipt_id` (string) – captured at redemption
- **Planned:** `pos_gross_total` (decimal) – captured at redemption (until CSV proven)
- **Optional helper flags:** `has_clothing`, `has_furniture`, `has_household` (can be derived)

### `{prefix}svdp_conferences` (already used as org table)
Planned to include both conferences and stores.

- `id`
- `name`
- `slug`
- **Planned:** `organization_type` enum: `conference` | `store`
- `allowed_voucher_types` JSON array (e.g., `["clothing","furniture"]`)
- Eligibility / custom text fields (already present)

## New tables (next phase)

### `{prefix}svdp_catalog_items` (editable)
Closed catalog for furniture and household goods.

- `id` (PK)
- `voucher_type` enum: `furniture` | `household`
- `category` (controlled vocab)
- `name` (display name)
- `min_price` (decimal)
- `max_price` (decimal)
- `is_woodshop` (bool)
- `availability_status` enum: `available` | `out_of_stock` (meaningful only for woodshop)
- `active` (bool)
- `sort_order` (int)
- `synonyms` (text; optional; used only for search)
- `created_at`, `updated_at`

### `{prefix}svdp_voucher_authorizations` (immutable snapshots)
One row per authorized catalog item on a voucher.

- `id` (PK)
- `voucher_id` (FK to vouchers)
- `catalog_item_id` (FK to catalog_items)
- Snapshot fields at issuance:
  - `voucher_type_at_issue`
  - `category_at_issue`
  - `name_at_issue`
  - `min_price_at_issue`
  - `max_price_at_issue`
  - `is_woodshop_at_issue`
  - `availability_status_at_issue`
- Authorization fields:
  - `quantity_issued` (int)
  - `note_at_issue` (text; optional)
- `created_at`

**Truth:** These rows must never be edited after voucher issuance (except possibly adding notes if you explicitly choose to allow it later).

### `{prefix}svdp_pos_receipts` (imported)
One row per POS receipt/transaction imported from ThriftWorks.

- `id` (PK)
- `store_id` (FK)
- `receipt_id` (string)
- `receipt_datetime` (datetime; optional if not provided)
- `gross_total` (decimal; optional if not provided)
- `source_filename` (string; optional)
- `source_checksum` (string; optional; used for idempotency)
- `imported_at` (datetime)

Unique key: `(store_id, receipt_id)`.

### `{prefix}svdp_pos_receipt_items` (imported)
One row per receipt line item (if CSV includes line details).

- `id` (PK)
- `store_id`
- `receipt_id`
- `line_no` (int; optional)
- `sku_or_tag` (string; optional)
- `description` (string)
- `category_raw` (string; optional)
- `category_normalized` (string; optional)
- `qty` (int; default 1 if missing)
- `unit_price` (decimal)
- `line_total` (decimal; optional; can be derived as qty*unit_price)

### `{prefix}svdp_voucher_receipt_links` (link table)
Connects a voucher to a POS receipt.

- `voucher_id`
- `store_id`
- `receipt_id`
- `linked_at`

Unique key: `(voucher_id)` (one receipt per voucher) and/or `(store_id, receipt_id)` (one voucher per receipt). Decide based on your operational rule; default: **one voucher ↔ one receipt**.

## Billing math (conference pays 50% up to cap, store pays 50% up to cap + 100% over)

Definitions:
- `gross_total` = total value of goods on receipt (pre-discount)
- `conference_cap` = max gross amount the conference authorizes (internal)

Formula:
- If `gross_total <= conference_cap`:
  - `conference_pays = gross_total * 0.50`
  - `store_pays = gross_total * 0.50`
- If `gross_total > conference_cap`:
  - `conference_pays = conference_cap * 0.50`
  - `store_pays = (conference_cap * 0.50) + (gross_total - conference_cap)`

Worked examples:
- Cap $200, gross $180:
  - Conference pays $90, store pays $90
- Cap $200, gross $260:
  - Conference pays $100
  - Store pays $100 + $60 = $160

