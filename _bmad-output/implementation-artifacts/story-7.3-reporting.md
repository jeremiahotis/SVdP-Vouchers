# Story 7.3: Reporting by Conference and Date Range

**Epic:** Epic 7 - Reconciliation and Reporting  
**Story ID:** 7.3  
**Status:** Ready for Implementation

---

## User Story

As a manager,  
I want reporting by conference and date range,  
So that billing totals and reconciliation gaps are clear.

---

## Acceptance Criteria

**Given** a conference and date range  
**When** reporting is generated  
**Then** totals and reconciliation gaps are shown for that scope

---

## Technical Context

### Report Metrics
- **Vouchers issued:** Count by conference and date range
- **Vouchers redeemed:** Count by conference and date range
- **Total conference share:** Sum of pre-calculated conference_share values
- **Total store share:** Sum of pre-calculated store_share values
- **Unmatched receipts:** Count of receipts without voucher links
- **Reconciliation gaps:** Count of discrepancies from Story 7.1

### Query Strategy
- Join vouchers, receipts, and billing calculations
- Filter by conference_id and date range
- Aggregate totals
- Read pre-calculated billing shares (from Story 5.2)

### Implementation Location
- **Class:** `includes/class-reconciliation.php` (reporting queries)
- **Admin UI:** `admin/views/tab-analytics.php` (reporting dashboard)
- **Admin JS:** `admin/js/admin.js` (reporting UI)

---

## Related Documents

- [PRD FR26](../planning-artifacts/prd.md#L322) - Reporting requirement
- [Epics - Story 7.3](../planning-artifacts/epics.md#L504-L514) - Full story details

---

## Definition of Done

- [ ] Reporting queries implemented (conference, date range filters)
- [ ] Billing totals calculated from pre-calculated shares
- [ ] Reconciliation gap metrics included
- [ ] Admin UI for reporting dashboard created
- [ ] Export to CSV/PDF implemented
- [ ] Tests for reporting queries
- [ ] Code reviewed and merged

---

## Notes

- This story reads billing shares calculated in Story 5.2 (no on-demand calculation)
- Consider adding charts/graphs for visual reporting
- Export functionality important for external billing systems
