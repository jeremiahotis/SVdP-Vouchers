# Tenancy and Access Model

## Core Invariants
- **Stores are tenants**: `tenant_id = store_id` everywhere in VoucherShyft data.
- **One request = one tenant**: no cross-tenant queries in a single request.
- **Tenant context source**: host + JWT tenant claim match only.
  - No tenant from request body, query params, or client-side selection alone.
- **Tenant switching requires host change**: navigation to a new tenant origin.

## Canonical Host Pattern + Resolution
- Host pattern: `{tenant_slug}.voucher.{root_domain}` (e.g., `store-a.voucher.shyft.org`).
- Tenant lookup key: **full host** exact match in `platform.tenants`.

### Enforcement Behavior
- Unknown host → **HTTP 200 refusal** `{ success:false, reason:"TENANT_NOT_FOUND", correlation_id }`.
- Host/JWT mismatch → **HTTP 200 refusal** `{ success:false, reason:"TENANT_CONTEXT_MISMATCH", correlation_id }`.
- Enumeration protection: responses must not reveal whether a tenant exists (including timing/messaging).

## Platform Registry (Canonical)
- `platform.tenants` is the canonical tenant registry.
- `platform.tenant_apps` gates app enablement per tenant.
- VoucherShyft must not invent its own tenant registry.

## Access Model
### Membership
- Access requires an explicit membership record scoped to a tenant.
- Cross-tenant users must switch context via host change; memberships are evaluated per request.
- Non-membership in active tenant returns HTTP 200 refusal `{ success:false, reason:"NOT_A_MEMBER", correlation_id }`.

### Roles (per tenant)
- **Steward (Vincentian):** create/issue vouchers within allowed types; view status within scope.
  - Steward issuance is additionally scoped by conference permissions within the tenant (allowed voucher types, override rights).
- **Cashier:** redeem vouchers; view status needed for redemption.
- **Store Admin:** manage tenant config, cashiers, reports; optional override/void if granted.
- **District Admin (cross-tenant):** read across assigned tenants; elevated actions only if explicitly granted.
- **Auditor (read-only):** view/export vouchers, redemptions, config history for assigned tenants.
- **Integration (service account):** tenant-scoped, read-only in MVP.
- **Platform Admin:** administer tenants/app enablement; limited to admin API.

### Authorization Rules
- App endpoints:
  - Unauthenticated → 401
  - Non-membership → HTTP 200 refusal `{ success:false, reason:"NOT_A_MEMBER" }`
  - Member lacks permission for action → HTTP 200 refusal `{ success:false, reason:"NOT_AUTHORIZED_FOR_ACTION" }`
- Admin endpoints:
  - Unauthenticated → 401
  - Unauthorized → 403

## Data Isolation
- Every table includes `tenant_id` unless explicitly global (platform tables only).
- Platform registry tables in `platform.*` are global and do not include `tenant_id` as a scoping column.
- DB access is only allowed through tenant-asserted helpers and request-scoped context.
- No root/unguarded queries outside the tenant context.

## App Enablement
- VoucherShyft availability is controlled by `platform.tenant_apps`.
- Disabled tenants receive HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND" }` and logs record `APP_DISABLED` (no tenant enumeration to clients).

## Partner Tokens (Embedded Form)
- **Purpose:** allow partner agencies to issue and look up their own vouchers without user accounts.
- **Scope:** tenant‑scoped and partner‑agency‑scoped; **form‑specific** tokens per partner agency.
- **Allowed actions:** voucher issuance + lookup **only for vouchers issued by that partner**.
- **Auth behavior:** partner token bypasses JWT membership checks but does **not** grant any admin or cross‑partner access.
- **Rate limit:** 20 req/min per token with 429 + Retry‑After.
- **Lifecycle:** no auto‑expiry; rotation/revocation requires explicit admin action.

## Audit Requirements
- Append-only audit events for issuance, override, redemption, void, and config changes.
- Audit events include: event_id, actor, tenant, timestamp, reason where applicable, correlation_id.

## Test Gates (Release-Blocking)
- Tenant isolation tests prevent cross-tenant access.
- Unknown host returns `TENANT_NOT_FOUND` refusal (no enumeration).
- App disabled returns external `TENANT_NOT_FOUND` refusal and internal `APP_DISABLED` log/audit.
- Host/JWT mismatch returns `TENANT_CONTEXT_MISMATCH` refusal.
- Non-membership returns `NOT_A_MEMBER` refusal.
- OpenAPI contract generated from route schemas and checked in CI.
