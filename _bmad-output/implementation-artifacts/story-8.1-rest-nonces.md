# Story 8.1: REST Nonces and Capability Checks

**Epic:** Epic 8 - Security and Access Controls  
**Story ID:** 8.1  
**Status:** Ready for Implementation

---

## User Story

As an admin,  
I want REST endpoints protected by nonces and capabilities,  
So that only authorized users can act.

---

## Acceptance Criteria

**Given** a protected REST endpoint  
**When** a request lacks nonce or capability  
**Then** it is rejected with 401/403

**Given** a public write endpoint  
**When** a request is valid  
**Then** it still requires a nonce and validates all inputs

---

## Technical Context

### Security Requirements
- **All REST endpoints:** Require nonce validation
- **Admin endpoints:** Require `manage_options` capability
- **Cashier endpoints:** Require `svdp_cashier` capability
- **Public write endpoints:** Require nonce + rate limiting (see Story 8.2)

### Implementation Pattern
```php
// Example REST endpoint registration
register_rest_route('svdp/v1', '/vouchers', [
    'methods' => 'POST',
    'callback' => 'create_voucher',
    'permission_callback' => function() {
        return current_user_can('svdp_cashier') && wp_verify_nonce($_REQUEST['_wpnonce'], 'svdp_action');
    }
]);
```

### Error Schema
Use standard JSON error format (see Architecture):
```json
{
    "code": "unauthorized",
    "message": "You do not have permission to perform this action",
    "details": {}
}
```

### Implementation Location
- **Class:** `includes/class-rest-errors.php` (error schema helper)
- **All REST handlers:** Add permission callbacks
- **Main plugin file:** Register REST routes with permission checks

---

## Related Documents

- [PRD FR28, FR29, FR30](../planning-artifacts/prd.md#L326-L329) - Security requirements
- [Architecture - Auth](../planning-artifacts/architecture.md#L174-L186) - Auth model
- [Epics - Story 8.1](../planning-artifacts/epics.md#L520-L534) - Full story details

---

## Definition of Done

- [ ] All REST endpoints have permission callbacks
- [ ] Nonce validation implemented for all endpoints
- [ ] Capability checks implemented (manage_options, svdp_cashier)
- [ ] Standard error schema helper created
- [ ] Tests for auth scenarios (valid, invalid nonce, insufficient capability)
- [ ] Security review completed
- [ ] Code reviewed and merged

---

## Notes

- Use `wp_verify_nonce()` for nonce validation
- Use `current_user_can()` for capability checks
- Public endpoints still require nonces to prevent CSRF
