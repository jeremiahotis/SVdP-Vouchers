# Sprint Change Proposal — Partner Embedded Issuance (No-Account Auth)

**Date:** 2026-02-09
**Prepared by:** PM (Correct-Course Workflow)
**Mode:** Incremental

## 1) Issue Summary

**Problem Statement**
The current architecture requires JWT + membership on every request. This blocks partner agencies from issuing vouchers via embedded forms on their websites because those flows are unauthenticated. Stakeholders require **embedded issuance and lookup without user accounts**. If we cannot support this, partners will not adopt the platform.

**Trigger**
Discovered during Story 1.2 (Platform Registry + App Enablement Enforcement) when authentication requirements were examined.

**Evidence**
- Existing system supports unauthenticated embedded issuance.
- Stakeholders/partners require parity with current behavior to continue participation.

## 2) Impact Analysis

### Epic Impact
- **Epic 1 (Tenant Spine)**: Must be modified with a new story to introduce partner-token auth model.
- **Epic 2 (Issuance)**: Must accept partner-token issuance path.
- **Epic 3 (Lookup)**: Must allow lookup for partner‑issued vouchers only.
- **Epic 4 (Tenant UI)**: Must add partner agency/token management + embed code generation.
- **Epic 5 (Audit/Exports)**: **No change** (partner tokens do not access store‑only audit/export).

### Artifact Conflicts / Updates Required
- **PRD**: Add new journey, FR, and MVP scope note for embedded partner issuance + lookup.
- **Architecture**: Add partner-token auth model, partner agency entity, token lifecycle, rate limits, and audit attribution.
- **UX Spec**: Add tenant UI for partner management + embed code with partner‑specific form customizations.
- **Tenancy & Access Docs**: Add partner‑token path and access constraints (no cross‑partner lookup).
- **Tests/CI**: Add tests for partner-token issuance + lookup scope + rate limit; update CI gates accordingly.

## 3) Recommended Approach

**Selected Path:** **Option 1 — Direct Adjustment**

**Rationale**
- Requirement is mandatory for partner adoption.
- Fits within Epic 1 foundation; no rollback needed.
- Adds a scoped auth path without undermining tenancy/JWT model.

**Effort/Risk**
- **Effort:** Medium–High (auth, data model, UI, tests)
- **Risk:** Medium (security scope, token management, rate limiting)

## 4) Detailed Change Proposals

### 4A) PRD Updates
**Add MVP journey + scope note**:
- “Partner agency issues + looks up their own vouchers via embedded form (no user account; tenant‑scoped partner token).”

**Add Functional Requirement**:
```
FR40: Partner embedded issuance + lookup uses a tenant‑scoped, partner‑agency token (no user account required).
- Token is limited to voucher issuance and voucher lookup for that partner’s own vouchers only.
- Token is form‑specific and configured per partner agency.
- Token does not expire automatically; rotation/revocation require explicit admin action.
- Default rate limit: 20 req/min per token.
```

**Update NFR rate limits**:
```
NFR23: Rate limits per tenant: default 60 req/min/user; service accounts configurable; partner tokens default 20 req/min per token; 429 with Retry‑After.
```

### 4B) Epic/Story Updates
**Add Epic 1 Story**: *Story 1.6 — Partner Token Access (Embedded Issuance + Lookup)*
- Partner tokens: tenant‑scoped, form‑specific, no auto‑expiry, rotate/revoke by admin.
- Allowed actions: issue + lookup own vouchers only.
- Rate limit 20 req/min/token.
- Audit attribution to partner agency.

**Add Epic 4 Story**: *Story 4.4 — Partner Agency Tokens + Embed Form Management*
- Store admin can create partners, configure form settings, generate embed code, rotate/revoke tokens.
- Per‑partner form customizations: allowed voucher types, intro text (<p>), rules list (<ul>).

**Update Epic 2/3 Notes**
- Issuance + lookup must allow partner‑token path with partner‑issued scope only.

### 4C) Architecture Updates
- Add decision for partner‑token auth model.
- Add partner_agency + partner_token entities (tenant‑scoped).
- Token scope: issue + lookup own only.
- Audit/observability: include partner_agency_id in audit events.
- Rate limiting: per‑token limit of 20 req/min.

### 4D) UX Updates
- Add Store Admin UI for partner agency management.
- Add embed code generator with partner‑specific settings.
- Embed form includes intro text + rules + allowed voucher types; no login.

### 4E) Tenancy/Access Doc Updates
- Add partner‑token path to `docs/TENANCY_AND_ACCESS.md`.
- Explicitly document: partner tokens cannot access non‑partner vouchers or store‑admin endpoints.

## 5) Implementation Handoff

**Scope Classification:** **Moderate** (auth + data model + UI + tests; no architecture re‑plan required)

**Handoff Recipients**
- **PM/PO/SM**: Update PRD + Epics/Stories + backlog sequencing
- **Architecture/Tech Lead**: Confirm partner-token model and data schema updates
- **Development Team**: Implement partner token auth, data model, UI, tests, and CI updates

**Success Criteria**
- Partner embedded issuance works without user accounts via form‑specific token.
- Partner lookup only returns vouchers issued by that partner in the tenant.
- Tokens are tenant‑scoped, rate‑limited (20 req/min), and revocable/rotatable by admin.
- Audit events include partner agency attribution.
- No impact on existing JWT + membership enforcement for all other paths.

