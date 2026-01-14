# Test plan (manual)

This is a manual verification checklist intended for local dev + staging.

## Setup
- Enable feature flags one by one to isolate failures.
- Ensure at least:
  - 1 store org
  - 1 conference with allowed types set to each combination (clothing only, furniture only, household only, clothing+furniture, all three)

## Voucher Request form: gating
1) Conference allowed types = [] (none)
   - Expect: message shown, no submit possible.
2) Conference allowed types = ["furniture"]
   - Expect: only furniture UI rendered (no clothing/household sections in DOM).
3) Conference allowed types = ["clothing","furniture"]
   - Expect: clothing + furniture sections only.

Attempt to submit a crafted POST that includes a disallowed type.
- Expect: server rejects with clear error.

## Voucher Request form: catalog UX rules
1) Open furniture section
   - Expect: categories display
   - Expect: item quantities start at 0
   - Expect: totals hidden
2) Increase quantity on an item
   - Expect: totals appear
   - Expect: totals update live
3) Submit furniture voucher with no items selected
   - Expect: server rejects

## Coats exclusion
- Search request form HTML and JS bundles for the string “coat”.
  - Expect: none related to coat issuance appears.
- Ensure cashier station coat issuance still works.

## Catalog versioning
1) Create voucher with selected items.
2) Edit catalog item name/min/max.
3) Re-open voucher view.
   - Expect: voucher still shows original snapshot values, not edited values.

## Woodshop states
1) Set store woodshop_paused = true
   - Expect: woodshop items labeled “Woodshop paused (temporary)” and selectable.
2) Set a woodshop item to out_of_stock
   - Expect: label “Currently out of stock” and selectable.

## Cashier station: redemption receipt capture
1) Redeem voucher with receipt_id and gross_total.
   - Expect: voucher marked redeemed
   - Expect: receipt info persisted

## Billing math
Use known cap + gross totals:
- Cap 200, gross 180
  - Expect: conference pays 90, store pays 90
- Cap 200, gross 260
  - Expect: conference pays 100, store pays 160

## CSV import
1) Import a file containing receipts and items.
   - Expect: receipts stored, items stored.
2) Re-import same file.
   - Expect: no duplicates created.
3) Link voucher to a receipt_id, then import.
   - Expect: voucher links and reconciliation can display.
4) Import receipts not linked to vouchers.
   - Expect: appear in “unmatched receipts” view/queue.

## Clothing derivation (once line items exist)
- For a clothing voucher linked to a receipt:
  - Expect: item count and value derived from receipt items.

