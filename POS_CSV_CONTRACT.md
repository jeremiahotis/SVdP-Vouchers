# POS CSV contract (ThriftWorks)

This contract defines how the weekly ThriftWorks export must be interpreted. The importer must be resilient to missing columns and support a configurable mapping.

## Import frequency
- Weekly, run manually by an admin user.

## Minimum required data (must exist in CSV)
- `receipt_id` (string)
- `description` (string) OR enough data to identify a line item
- `unit_price` OR `line_total` (numeric)

## Strongly recommended fields (if available)
- `receipt_datetime` (datetime)
- `qty` (int)
- `category` (string)
- `sku_or_tag` (string)

## Mapping strategy (opinionated)
Implement an “Import Profile” per store with a UI to map CSV columns to internal fields.

Required mappings:
- receipt_id -> internal `receipt_id`
- price -> internal `unit_price` or `line_total`
Optional mappings:
- datetime, qty, category, sku/tag, description

If ThriftWorks provides only receipt summaries (no line items):
- Import into `svdp_pos_receipts` only.
- Skip `svdp_pos_receipt_items`.
- Clothing counts will be unavailable (or use receipt-level only).
(Developer should treat this as an allowed degraded mode.)

## Idempotency
Importer must prevent duplicates.

Default (preferred):
- Unique constraint on `(store_id, receipt_id)` in `svdp_pos_receipts`.

If ThriftWorks can export multiple rows per receipt without stable receipt ids (unlikely):
- Use a file checksum + row checksum strategy (secondary fallback).

## Sample CSV (mock)

The importer must handle headers in any order.

```csv
ReceiptID,DateTime,SKU,Description,Category,Qty,UnitPrice
A102938,2026-01-12 14:33:12,FT-9931,Kitchen Table,Furniture/Tables,1,49.99
A102938,2026-01-12 14:33:12,FT-2210,Dining Chair,Furniture/Seating,4,9.99
A102938,2026-01-12 14:33:12,WS-1002,Woodshop End Table,Woodshop,1,75.00
A102940,2026-01-12 15:02:48,CL-7781,Mens Jeans,Clothing,2,6.00
```

## Normalization (category mapping)
If the CSV includes a `category` field:
- Store raw value in `category_raw`
- Normalize to a controlled value in `category_normalized` using a mapping table:
  - Clothing
  - Furniture: Beds/Mattresses, Kids, Seating, Tables, Storage, Appliances, Accessibility, Woodshop
  - Household: Bedding, Bath, Kitchenware, Food Storage, Window Coverings, Cleaning, Small Appliances, Home Basics

Normalization is used for reporting only; it must never block import.

