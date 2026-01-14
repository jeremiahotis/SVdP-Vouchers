# Scope lock

This document is the **non-negotiable** behavioral contract for the next development phase. If an implementation choice conflicts with anything below, **the implementation is wrong**.

## Voucher composition

- A single voucher may include **any combination** of:
  - Clothing
  - Furniture
  - Household Goods
- The Voucher Request form must show **only** the voucher-type sections enabled for the selected Conference/Partner (`allowed_voucher_types`).
- If exactly **one** voucher type is enabled, the UI should go directly to that picker (no extra card/section chooser).
- If **zero** types are enabled, show an informational message and do not allow submission.

## Coats

- **Coats are cashier-station only.**
- Coats must not appear anywhere on the Voucher Request form:
  - not as a voucher type
  - not as a catalog category or item
  - not in “common items”
  - not in request-form templates or scripts
- Coat issuance continues to be handled in the Cashier Station.

## Furniture + household authorizations

- Furniture and Household authorizations come from a **closed catalog**:
  - No “Other Furniture” / “Other Household”
  - No free-form “$X to spend” authorizations
  - No “Required” / “Optional” semantics — vouchers are **best-effort**
- Default quantity for every catalog item is **0**.
- An item is not considered authorized unless the volunteer sets quantity **> 0**.
- The running estimated total (min/max) is shown **only after** at least one item has quantity > 0.

## Catalog versioning

- When a voucher is issued, the system stores an **immutable snapshot** of each selected catalog item:
  - name, category, min/max price, woodshop flags, availability-at-issue, quantity, notes
- Future catalog edits must not change past vouchers.

## Woodshop availability

- Only woodshop items support availability state.
- The system supports:
  - per-item `out_of_stock` state
  - store-level `woodshop_paused` flag
- Woodshop categories/items must remain **visible and selectable** even when out of stock or paused; they must be clearly labeled.

## Redemption and reconciliation

- Do not introduce line-item double entry at checkout.
- Cashier redemption captures:
  - POS receipt/transaction id (`receipt_id`)
  - gross total (required until CSV import is proven reliable)
- Item-level analytics are achieved via **weekly CSV import** (admin-run) and reconciliation post-hoc.

## Out of scope

- Christmas “dollar amount” vouchers are out of scope for this version (handled as a separate workflow/type later).
