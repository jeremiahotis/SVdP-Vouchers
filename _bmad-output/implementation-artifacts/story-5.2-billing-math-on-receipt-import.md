# Story 5.2: Billing Math on Receipt Import

**Epic:** Epic 5 - Cashier Redemption and Receipt Capture  
**Story ID:** 5.2  
**Status:** Ready for Implementation

---

## User Story

As store staff,  
I want billing math computed when receipts are imported and linked,  
So that conference vs store shares are consistent and based on accurate POS data.

---

## Acceptance Criteria

**Given** a receipt is imported with gross_total and linked to a voucher with a conference cap  
**When** the receipt-voucher link is created  
**Then** the system calculates and stores: conference pays 50% up to cap; store pays 50% up to cap plus 100% over cap

**Given** the gross_total is below the conference cap  
**When** billing is computed  
**Then** both conference and store pay 50% of gross_total

**Given** the gross_total exceeds the conference cap  
**When** billing is computed  
**Then** conference pays 50% of cap; store pays 50% of cap plus 100% of the amount over cap

**Given** a voucher is redeemed but receipt not yet imported  
**When** billing shares are requested  
**Then** they show as "Pending receipt import" or null until receipt is linked

---

## Technical Context

### Background
This story was moved from Epic 5 (redemption) to Epic 6 (receipt import) to avoid UX friction. See [sprint-change-proposal-2026-01-15.md](../planning-artifacts/sprint-change-proposal-2026-01-15.md) for details.

### Billing Calculation Rules
- **Conference share:** MIN(gross_total * 0.5, cap * 0.5)
- **Store share:** 
  - If gross_total ≤ cap: gross_total * 0.5
  - If gross_total > cap: (cap * 0.5) + (gross_total - cap)

### Database Schema
Add columns to `wp_svdp_pos_receipts` or `wp_svdp_voucher_receipt_links`:
- `conference_share` (DECIMAL(10,2))
- `store_share` (DECIMAL(10,2))
- `calculated_at` (DATETIME)

### Implementation Location
- **Class:** `includes/class-import.php` or `includes/class-reconciliation.php`
- **Trigger:** During receipt import when linking receipt to voucher
- **Storage:** Store calculated values for fast reporting

---

## Related Documents

- [PRD FR25](../planning-artifacts/prd.md#L321) - Billing calculation requirements
- [Architecture - Billing timing](../planning-artifacts/architecture.md#L154-L159) - Architectural decision
- [Epics - Story 5.2](../planning-artifacts/epics.md#L372-L397) - Full story details

---

## Definition of Done

- [ ] Billing calculation function implemented with correct math
- [ ] Database columns added for conference_share and store_share
- [ ] Calculations triggered during receipt import/linking
- [ ] Calculated values stored in database
- [ ] Null/pending state handled for unredeemed vouchers
- [ ] Unit tests for billing calculation logic (below cap, at cap, above cap)
- [ ] Integration test for receipt import → billing calculation flow
- [ ] Code reviewed and merged

---

## Notes

- This story depends on Epic 6 receipt import infrastructure being in place
- Calculations happen ONCE during import, not on-demand during reporting
- Conference cap value comes from the conference record linked to the voucher
