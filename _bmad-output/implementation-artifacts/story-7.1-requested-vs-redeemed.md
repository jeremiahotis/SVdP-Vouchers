# Story 7.1: Requested vs Redeemed View

**Epic:** Epic 7 - Reconciliation and Reporting  
**Story ID:** 7.1  
**Status:** Ready for Implementation

---

## User Story

As a store manager,  
I want to compare authorized items to redeemed receipt items,  
So that gaps are visible without cashier intervention.

---

## Acceptance Criteria

**Given** a furniture/household voucher with snapshots  
**When** a linked receipt exists  
**Then** the view shows requested items, redeemed items, and requested-not-redeemed items

**Given** no receipt is linked  
**When** the reconciliation view loads  
**Then** it shows requested items and indicates no receipt found

---

## Technical Context

### Reconciliation Logic
1. Load voucher authorization snapshots (requested items)
2. Load linked receipt line items (redeemed items)
3. Compare and categorize:
   - **Matched:** Item in both snapshots and receipt
   - **Requested but not redeemed:** Item in snapshot, not in receipt
   - **Redeemed but not requested:** Item in receipt, not in snapshot (possible overage)

### Matching Strategy
- Match by item description (fuzzy matching may be needed)
- Compare quantities
- Flag discrepancies for manual review

### Implementation Location
- **Class:** `includes/class-reconciliation.php` (reconciliation logic)
- **Admin UI:** `admin/views/tab-reconciliation.php` (NEW - reconciliation view)
- **Admin JS:** `admin/js/reconciliation.js` (NEW - reconciliation UI)

---

## Related Documents

- [PRD FR24](../planning-artifacts/prd.md#L317) - Reconciliation requirement
- [Epics - Story 7.1](../planning-artifacts/epics.md#L476-L490) - Full story details

---

## Definition of Done

- [ ] Reconciliation logic implemented (compare snapshots to receipt items)
- [ ] Admin UI for reconciliation view created
- [ ] Requested vs redeemed comparison displayed
- [ ] Discrepancies highlighted
- [ ] Handle missing receipt gracefully
- [ ] Tests for reconciliation scenarios
- [ ] Code reviewed and merged

---

## Notes

- This is a GROWTH feature but foundational for reporting
- Fuzzy matching may be needed for item descriptions (POS vs catalog names)
- Consider adding manual override/notes for reconciliation adjustments
