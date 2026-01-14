# UI states

This document defines the required screens and state behaviors (no Figma required). Implementations must match these states.

## Voucher Request form

### Conference selection
The request form is scoped to a Conference/Partner either by:
- shortcode attribute `conference="slug"` (preferred), or
- an on-page selector (if you support it)

Once the conference is known, the form must load:
- `allowed_voucher_types` (source of truth)
- any conference custom text/rules (existing)

### Voucher-type section rendering
- Only render the sections enabled by `allowed_voucher_types`.
- Do not render disallowed sections at all (not hidden with CSS).

States:
1) **0 enabled types**
   - Show: “This partner is not currently enabled for voucher requests.”
   - Disable submission.
2) **1 enabled type**
   - Skip the “three-card chooser” and show that section expanded.
3) **2–3 enabled types**
   - Render each section as a collapsed card:
     - title
     - short instruction line
     - “Add items” button
     - summary line when items selected

### Clothing section
- Clothing is allowed only if `clothing` is enabled.
- Keep it minimal:
  - A simple “Authorize clothing voucher” toggle or a short notes field.
- Do not ask for item counts (those will be derived from receipts after CSV import).

### Furniture and Household sections
Shared UX pattern:
1) Category tiles view (large targets)
2) Item list view within a category:
   - Item name (large)
   - Quantity control `+ / −` (default 0)
   - Optional “Add note” link (collapsed by default)
   - Woodshop labels where applicable

### Running totals
- For furniture/household:
  - Running min/max estimate is hidden until **any** item quantity > 0 in that section.
  - After visible, it updates live.
- Do not show totals when the section is empty.

### Submission rules
- Furniture/household: submission must include at least one catalog item with quantity > 0 **for each section that is present and opened**.
- If a section is enabled but unused, it may remain empty and that’s valid (multi-type voucher).

## Woodshop state labeling

### Per-item out of stock (woodshop only)
- Items remain visible and selectable.
- Label shown inline: “Currently out of stock”
- Visual treatment: muted/greyed but still clickable.

### Store-level woodshop paused
- Woodshop category remains visible.
- All woodshop items show label: “Woodshop paused (temporary)”
- Items remain selectable.

## Cashier Station

### Coats
- Coat issuance UI is available only on the cashier station.
- No coat options appear on request form.

### Redemption modal (minimal)
Required fields:
- Receipt ID (`receipt_id`)
- Gross total (`gross_total`) until CSV import is confirmed reliable

Behavior:
- On redeem, store receipt info on voucher
- Apply billing math using conference cap rules (if present)
- Mark voucher redeemed

## Admin screens (minimum)

### Stores (organization_type=store)
- Create/edit store
- woodshop_paused toggle
- active/inactive

### Catalog management
- List items with category, min/max, woodshop flag, availability status, active, sort order
- Inline edit or edit screen is fine; prioritize clarity over clever UI
