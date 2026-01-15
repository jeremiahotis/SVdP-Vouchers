# Story 5.4: Coats Issuance in Cashier Station Only

**Epic:** Epic 5 - Cashier Redemption and Receipt Capture  
**Story ID:** 5.4  
**Status:** Ready for Implementation

---

## User Story

As a cashier,  
I want coat issuance to remain in the cashier station flow,  
So that coat rules are enforced consistently.

---

## Acceptance Criteria

**Given** a voucher is eligible for coats  
**When** the cashier station issues coats  
**Then** coat counts and timestamps are recorded

**Given** coat issuance is attempted from request endpoints  
**When** the server validates  
**Then** the request is rejected

---

## Technical Context

### Coat Issuance Rules
- Coats can ONLY be issued at the cashier station (not during voucher request)
- Coat catalog items should be filtered out of request form UI
- Server-side validation must reject any coat items in voucher requests
- Cashier station has dedicated coat issuance UI

### Database Schema
Use existing voucher or authorization tables to track coat issuance:
- `coats_issued` (INT) - number of coats issued
- `coats_issued_at` (DATETIME)
- `coats_issued_by` (INT) - cashier user ID

### Implementation Location
- **Class:** `includes/class-voucher.php` (coat issuance logic)
- **Class:** `includes/class-catalog.php` (coat item filtering)
- **UI:** `public/templates/cashier-station.php` (coat issuance UI)
- **UI:** `public/templates/voucher-request-form.php` (ensure coats excluded)
- **JS:** `public/js/cashier-station.js` (coat issuance logic)

---

## Related Documents

- [PRD FR19](../planning-artifacts/prd.md#L310) - Coat issuance requirement
- [Epics - Story 2.2](../planning-artifacts/epics.md#L221-L239) - Coats restricted to cashier
- [Epics - Story 5.4](../planning-artifacts/epics.md#L404-L418) - Full story details

---

## Definition of Done

- [ ] Coat catalog items filtered from request form UI
- [ ] Server-side validation rejects coat items in voucher requests
- [ ] Cashier station includes coat issuance UI
- [ ] Coat issuance recorded with count, timestamp, and cashier ID
- [ ] Tests verify coats cannot be requested via voucher request form
- [ ] Tests verify coats can be issued via cashier station
- [ ] Code reviewed and merged

---

## Notes

- Coat items should have a special flag or category to identify them
- Consider whether coats need authorization snapshots like furniture/household
- Coat issuance may be simpler than catalog items (just a count, no specific items)
