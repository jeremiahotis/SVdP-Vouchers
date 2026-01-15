# Story 7.2: Unmatched Receipts Queue

**Epic:** Epic 7 - Reconciliation and Reporting  
**Story ID:** 7.2  
**Status:** Ready for Implementation

---

## User Story

As a store manager,  
I want to see receipts that aren't linked to vouchers,  
So that reconciliation gaps are visible.

---

## Acceptance Criteria

**Given** receipts are imported  
**When** they are not linked to vouchers  
**Then** they appear in an unmatched receipts list by store and date

---

## Technical Context

### Query Logic
- Find receipts in `wp_svdp_pos_receipts` that have no corresponding entry in `wp_svdp_voucher_receipt_links`
- Group by store and date range
- Display receipt_id, gross_total, receipt_datetime

### UI Features
- Filter by store
- Filter by date range
- Search by receipt_id
- Export to CSV for manual review

### Implementation Location
- **Class:** `includes/class-reconciliation.php` (unmatched receipts query)
- **Admin UI:** `admin/views/tab-reconciliation.php` (unmatched receipts section)
- **Admin JS:** `admin/js/reconciliation.js` (filtering/search)

---

## Related Documents

- [PRD FR27](../planning-artifacts/prd.md#L323) - Reconciliation gaps requirement
- [Epics - Story 7.2](../planning-artifacts/epics.md#L492-L502) - Full story details

---

## Definition of Done

- [ ] Unmatched receipts query implemented
- [ ] Admin UI for unmatched receipts created
- [ ] Filtering by store and date range working
- [ ] Search by receipt_id working
- [ ] Export to CSV implemented
- [ ] Tests for unmatched receipts query
- [ ] Code reviewed and merged

---

## Notes

- Unmatched receipts are expected (walk-in customers, non-voucher purchases)
- Target <2% unmatched after 7 days (not a hard blocker)
- Consider adding manual linking UI for corrections
