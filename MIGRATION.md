# SVdP Vouchers — Migration Plan (Feature: Furniture + Multi-Type + Receipt Import)

This document is the operational checklist for migrating the plugin from the current **v2 schema** (feature/furniture branch) to the next set of features:

- Store organizations (`organization_type=store`) + `store_id`
- Conference-gated voucher type sections on request form
- Closed catalogs (Furniture + Household) with **catalog snapshot versioning**
- Weekly ThriftWorks CSV receipt import + voucher↔receipt reconciliation
- Clothing item count/value derived from receipts (post-import)

## Guiding rules

- **Additive-first:** new tables/columns first; do not drop/rename in the early phases.
- **Feature-flag everything:** new UI/endpoints only become active when a flag is enabled.
- **Idempotent migrations:** safe to re-run. Track `svdp_schema_version` in `wp_options`.
- **Backward compatible:** existing vouchers and cashier workflows must keep working throughout.

---

## Migration phases

### Phase 0 — Safety rails (no schema changes)

**0.1 Add feature flags** (default OFF)

- `enable_multi_type_request_form`
- `enable_catalog_authorizations`
- `enable_store_orgs`
- `enable_receipt_import`

**0.2 Add schema version tracking**

- `wp_options.svdp_schema_version` (integer; default = 2 for current v2 baseline)

**Exit criteria**
- Flags exist (admin-visible) and can gate UI/routes.
- Schema version option exists and is used by the migration runner.

---

### Phase 1 — Additive schema migrations

Apply in this order:

1. **V3 — Stores + store_id (additive)**
   - Add `store_id` to `wp_svdp_vouchers` (nullable initially)
   - Ensure `wp_svdp_conferences` supports `organization_type=store` (already v2)
   - Add store settings:
     - `woodshop_paused` (boolean) on store org record (or separate store meta)

2. **V4 — Catalog tables**
   - Create `wp_svdp_catalog_items`
   - Seed Furniture + Household category sets
   - Add global “Common Items” list (settings referencing catalog IDs)

3. **V5 — Authorization snapshot tables**
   - Create `wp_svdp_voucher_authorizations` (immutable snapshot per voucher)

4. **V6 — POS receipt import tables**
   - Create:
     - `wp_svdp_pos_receipts`
     - `wp_svdp_pos_receipt_items`
     - `wp_svdp_voucher_receipt_links` (voucher↔(store_id, receipt_id))

**Exit criteria**
- All new tables exist.
- No current production flow is broken.
- Existing plugin features still function with flags OFF.

---

### Phase 2 — Backfills + defaults

**2.1 Create default store**
- Create store org record “SVdP Thrift Store”
- Set as default store in settings

**2.2 Backfill existing vouchers**
- Set `store_id` on all existing vouchers to default store.

**2.3 Normalize conferences**
- Ensure every conference/org has `allowed_voucher_types` populated:
  - Conferences: `["clothing","furniture","household"]` (or your chosen defaults)
  - Stores: typically `["clothing"]` (cashier station), but request form uses conference settings

**Exit criteria**
- `store_id` is non-null for all vouchers.
- Every conference has valid `allowed_voucher_types` JSON.

---

### Phase 3 — Parallel request-form cut-in (feature-flagged)

**3.1 New request form UI** (gated by `enable_multi_type_request_form`)
- Multi-type sections render **only** if allowed by conference
- Furniture/household selection uses category tiles + quantity controls (default 0)
- Running min/max totals appear only after ≥1 item selected
- Clothing section: minimal (authorize + notes), **no coats**

**3.2 Server-side enforcement**
- Reject disallowed voucher types (do not rely on JS-only hiding)
- Furniture/household require ≥1 catalog item with qty > 0
- Coat issuance routes are cashier-only; request form never surfaces coats

**3.3 Snapshot authorizations**
- On voucher creation, write selected items into `wp_svdp_voucher_authorizations` as immutable snapshots.

**Exit criteria**
- With flags OFF: legacy form works as before.
- With flags ON (pilot conferences): new form issues valid vouchers + snapshots.

---

### Phase 4 — Cashier station: receipt capture (minimal)

**4.1 Add receipt ID (and gross total as needed)**
- Cashier redemption records:
  - `receipt_id`
  - `gross_total` (optional later if import reliably provides totals)
  - links voucher to `(store_id, receipt_id)`

**Exit criteria**
- Cashier workflow remains fast.
- Vouchers can be redeemed with receipt references.

---

### Phase 5 — Weekly CSV import + reconciliation

**5.1 CSV import UI** (gated by `enable_receipt_import`)
- Store-scoped upload
- Column mapping configurable once export shape known
- Idempotent imports:
  - unique by `(store_id, receipt_id)` and/or row checksum

**5.2 Link receipts to vouchers**
- If receipt imported first: show “Unmatched receipts” list
- If voucher redeemed first: importer links automatically

**5.3 Clothing derivation**
- Compute clothing item count + total value from receipt line items
- Stop requiring manual counts once stable

**5.4 Requested vs redeemed views**
- Compare `voucher_authorizations` snapshots to imported receipt lines
- Provide conference/date reporting

**Exit criteria**
- Weekly import produces reliable totals and reconciliation reports.
- Clothing manual entry can be retired.

---

## Operational rollout

1. Enable `enable_store_orgs` (all environments)
2. Enable `enable_catalog_authorizations` (pilot conferences)
3. Enable `enable_multi_type_request_form` (pilot conferences → expand)
4. Enable `enable_receipt_import` (once CSV export confirmed)

---

## Rollback strategy

- Turn off feature flags to revert UI paths while keeping schema in place.
- Cashier station remains functional throughout.
- Imports can be disabled without affecting voucher redemption.

---

## Appendix: final category sets

### Furniture
- Beds & Mattresses
- Kids Furniture
- Seating
- Tables
- Storage
- Appliances
- Handmade Furniture (Woodshop)
- Accessibility & Safety

### Household Goods
- Bedding & Linens
- Towels & Bath
- Kitchenware
- Food Storage & Prep
- Window Coverings
- Cleaning & Home Care
- Small Appliances
- Home Basics
