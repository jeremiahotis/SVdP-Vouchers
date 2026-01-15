# Story 8.2: Rate Limiting for Public Endpoints

**Epic:** Epic 8 - Security and Access Controls  
**Story ID:** 8.2  
**Status:** Ready for Implementation

---

## User Story

As a system owner,  
I want basic rate limiting on public endpoints,  
So that abuse is reduced without extra infrastructure.

---

## Acceptance Criteria

**Given** an IP exceeds the burst or daily threshold  
**When** requests continue  
**Then** the system returns 429 with a short message

**Given** thresholds are updated  
**When** limits are enforced  
**Then** they come from a single centralized definition

---

## Technical Context

### Rate Limiting Strategy
- **Transient-based throttling:** Use WordPress transients for rate limit tracking
- **IP-based keys:** Track requests per IP address
- **Thresholds:** 
  - Burst: 10 requests / 5 minutes
  - Daily: 50 requests / day
- **Optional:** Add User-Agent hash to reduce collision

### Implementation Pattern
```php
function check_rate_limit($ip) {
    $burst_key = "svdp_rate_burst_{$ip}";
    $daily_key = "svdp_rate_daily_{$ip}";
    
    $burst_count = get_transient($burst_key) ?: 0;
    $daily_count = get_transient($daily_key) ?: 0;
    
    if ($burst_count >= 10 || $daily_count >= 50) {
        return new WP_Error('rate_limit', 'Too many requests', ['status' => 429]);
    }
    
    set_transient($burst_key, $burst_count + 1, 5 * MINUTE_IN_SECONDS);
    set_transient($daily_key, $daily_count + 1, DAY_IN_SECONDS);
    
    return true;
}
```

### Implementation Location
- **Class:** `includes/class-rate-limits.php` (NEW - rate limiting utilities)
- **All public REST endpoints:** Add rate limit checks

---

## Related Documents

- [PRD FR30](../planning-artifacts/prd.md#L329) - Rate limiting requirement
- [Architecture - Rate Limiting](../planning-artifacts/architecture.md#L283-L286) - Rate limiting pattern
- [Epics - Story 8.2](../planning-artifacts/epics.md#L536-L550) - Full story details

---

## Definition of Done

- [ ] Rate limiting utility class created
- [ ] Transient-based throttling implemented
- [ ] Centralized threshold configuration
- [ ] Rate limit checks added to public endpoints
- [ ] 429 error response implemented
- [ ] Tests for rate limiting (within limits, burst exceeded, daily exceeded)
- [ ] Code reviewed and merged

---

## Notes

- Thresholds should be configurable constants or settings
- Consider adding admin UI to view/clear rate limits for debugging
- Redis object cache will improve performance if available
