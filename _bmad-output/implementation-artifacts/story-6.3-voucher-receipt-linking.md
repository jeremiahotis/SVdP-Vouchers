# Story 6.3: Voucher ↔ Receipt Linking

**Epic:** Epic 6 - POS Receipt Import and Linking  
**Story ID:** 6.3  
**Status:** Ready for Implementation

---

## User Story

As a store manager,  
I want vouchers linked to receipts via (store_id, receipt_id),  
So that reconciliation is automatic.

---

## Acceptance Criteria

**Given** a voucher is redeemed with receipt_id  
**When** the receipt exists in imports  
**Then** the voucher is linked to that receipt

**Given** a receipt exists without a voucher  
**When** reconciliation is viewed  
**Then** it appears as an unmatched receipt

---

## Technical Context

### Linking Strategy
- **Automatic linking:** When receipt is imported, check for vouchers with matching (store_id, receipt_id)
- **Retroactive linking:** When voucher is redeemed, check if receipt already exists
- **1:1 enforcement:** For MVP, enforce one voucher per receipt at application layer

### Database Schema
**Voucher-receipt links table:** `wp_svdp_voucher_receipt_links`
- `id`, `voucher_id` (FK), `store_id`, `receipt_id`, `linked_at`
- Unique index on `(store_id, receipt_id)` for 1:1 enforcement
- Unique index on `voucher_id` for MVP (one receipt per voucher)

### Linking Triggers
1. **During import:** After inserting receipt, search for vouchers with matching (store_id, receipt_id)
2. **During redemption:** After marking voucher redeemed, search for receipt with matching (store_id, receipt_id)

### Implementation Location
- **Class:** `includes/class-import.php` (linking during import)
- **Class:** `includes/class-voucher.php` (linking during redemption)
- **Class:** `includes/class-reconciliation.php` (NEW - reconciliation queries)

---

## Related Documents

- [PRD FR22](../planning-artifacts/prd.md#L315) - Receipt linking requirement
- [Architecture - Receipt linkage](../planning-artifacts/architecture.md#L145-L147) - Linking strategy
- [Epics - Story 6.3](../planning-artifacts/epics.md#L456-L470) - Full story details

---

## Definition of Done

- [ ] Voucher-receipt links table created (migration)
- [ ] Automatic linking implemented during import
- [ ] Retroactive linking implemented during redemption
- [ ] 1:1 enforcement via unique indexes
- [ ] Unmatched receipts queryable
- [ ] Tests for linking scenarios (import first, redeem first, no match)
- [ ] Code reviewed and merged

---

## Notes

- **IMPORTANT:** This story should also trigger Story 5.2 billing calculations when link is created
- Schema supports future multi-receipt scenarios (refunds, split receipts) but MVP enforces 1:1
- Unmatched receipts will be surfaced in Story 7.2
