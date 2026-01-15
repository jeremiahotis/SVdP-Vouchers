# Story 5.3: Emergency Overrides with Audit Trail

**Epic:** Epic 5 - Cashier Redemption and Receipt Capture  
**Story ID:** 5.3  
**Status:** Ready for Implementation

---

## User Story

As a cashier,  
I want emergency overrides recorded with manager approval,  
So that exceptions are accountable.

---

## Acceptance Criteria

**Given** an override is needed  
**When** a manager code is validated  
**Then** the override is recorded with manager_id, reason_id, cashier_user_id, and timestamp

**Given** an override is recorded  
**When** it is reviewed  
**Then** it includes an auditable reason and approver metadata

---

## Technical Context

### Override Flow
1. Cashier encounters exception requiring override
2. Cashier requests manager approval
3. Manager enters their code
4. System validates manager code (hash comparison)
5. System records override in audit table
6. Override allows exception to proceed

### Database Schema
Use existing `wp_svdp_audit_events` table or create override-specific table:
- `voucher_id` (INT)
- `manager_id` (INT) - WordPress user ID
- `reason_id` (INT) - FK to override reasons table
- `cashier_user_id` (INT) - WordPress user ID
- `created_at` (DATETIME)
- `override_type` (VARCHAR) - e.g., 'missing_receipt', 'expired_voucher'

### Security Requirements
- Manager codes stored as hashes (use `password_hash()`)
- Use `hash_equals()` for comparison to prevent timing attacks
- Rate limit override attempts per IP (use transient-based throttling)
- Log failed override attempts

### Implementation Location
- **Class:** `includes/class-manager.php` (manager code validation)
- **Class:** `includes/class-audit.php` (audit logging)
- **UI:** `public/templates/cashier-station.php` (override modal)
- **JS:** `public/js/cashier-station.js` (override UI logic)

---

## Related Documents

- [PRD FR31, FR32](../planning-artifacts/prd.md#L331-L332) - Override requirements
- [Architecture - Security](../planning-artifacts/architecture.md#L174-L186) - Auth and security patterns
- [Epics - Story 5.3](../planning-artifacts/epics.md#L389-L402) - Full story details

---

## Definition of Done

- [ ] Manager code validation implemented with hash comparison
- [ ] Override audit logging implemented
- [ ] Override reasons table/data seeded
- [ ] Cashier station UI includes override modal
- [ ] Override flow tested (valid code, invalid code, rate limiting)
- [ ] Audit trail queryable by admin
- [ ] Security review completed (hash storage, timing attacks, rate limiting)
- [ ] Code reviewed and merged

---

## Notes

- Override reasons should be predefined (e.g., "Missing receipt", "Expired voucher", "System error")
- Consider adding optional free-text notes field for additional context
- Rate limiting should use same transient-based approach as public endpoints
