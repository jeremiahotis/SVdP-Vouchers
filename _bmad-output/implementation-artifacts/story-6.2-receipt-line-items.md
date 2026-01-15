# Story 6.2: Receipt Line Item Storage

**Epic:** Epic 6 - POS Receipt Import and Linking  
**Story ID:** 6.2  
**Status:** Ready for Implementation

---

## User Story

As a store manager,  
I want receipt line items stored when available,  
So that clothing and reconciliation data can be derived.

---

## Acceptance Criteria

**Given** a CSV includes line items  
**When** the import runs  
**Then** receipt items are stored with qty and price data

**Given** a CSV contains only receipt summaries  
**When** the import runs  
**Then** receipts are stored without line items and import still succeeds

---

## Technical Context

### CSV Line Item Format
See [POS_CSV_CONTRACT.md](../../POS_CSV_CONTRACT.md) for line item structure.

### Database Schema
**Receipt items table:** `wp_svdp_pos_receipt_items`
- `id`, `receipt_id` (FK), `line_number`, `item_description`, `quantity`, `unit_price`, `line_total`

### Import Logic
- Parse line items from CSV (if present)
- Link to parent receipt via `receipt_id`
- Store item details for future reconciliation
- Handle missing line items gracefully (some POS exports may not include them)

### Implementation Location
- **Class:** `includes/class-import.php` (extend import logic)
- **Database:** Migration for `wp_svdp_pos_receipt_items` table

---

## Related Documents

- [PRD FR23](../planning-artifacts/prd.md#L316) - Line item storage requirement
- [Epics - Story 6.2](../planning-artifacts/epics.md#L440-L454) - Full story details

---

## Definition of Done

- [ ] Receipt items table created (migration)
- [ ] Line item parsing logic implemented
- [ ] Line items linked to receipts via FK
- [ ] Import handles missing line items gracefully
- [ ] Tests for import with/without line items
- [ ] Code reviewed and merged

---

## Notes

- Line items are GROWTH feature but schema should be in place for MVP
- Not all POS exports include line items - import should not fail if missing
- Line items will be used for clothing reconciliation in future stories
