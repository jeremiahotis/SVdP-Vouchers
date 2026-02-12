# Handoff Plan — Partner Tokens (Embedded Issuance + Lookup)

**Date:** 2026-02-09
**Owner:** PM (John)
**Scope:** Architecture + data model changes for partner agency tokens, voucher partner scope, auth middleware, and rate limiting.

## 1) Objective
Enable partner agencies to issue and lookup vouchers from embedded forms **without user accounts**, using **tenant-scoped, form-specific partner tokens** with strict scope and rate limiting.

## 2) Scope Summary
**In scope**
- New tenant-scoped entities: `partner_agencies`, `partner_tokens`.
- Partner token auth path (no JWT required) with **tenant + partner context**.
- Issuance + lookup only for vouchers created by that partner agency.
- Partner token rate limit: **20 req/min/token**, return **HTTP 429 + Retry-After**.
- Admin UI for partner management + token generation + embed code + partner form customizations.

**Out of scope**
- Partner access to audit/export endpoints (store-only functions).
- New epics (we are extending Epics 1–4 only).

## 3) Key Decisions (Locked)
- Tokens are **tenant-scoped**, **form-specific**, **no auto-expiry** (rotate/revoke only by admin).
- Partner tokens are limited to **issue + lookup own vouchers only**.
- Partner tokens are **rate-limited at 20 req/min/token**.
- Partner token requests **establish tenant + partner agency context**.

## 4) Data Model Changes
**New tables (tenant-scoped):**
- `partner_agencies`
  - `id` (PK)
  - `tenant_id` (FK)
  - `name`
  - `status` (active/inactive)
  - metadata fields (created_at, updated_at)

- `partner_tokens`
  - `id` (PK)
  - `tenant_id` (FK)
  - `partner_agency_id` (FK)
  - `token_hash` (store hashed secret only)
  - `status` (active/revoked)
  - `form_config` (allowed_voucher_types, intro_text, rules_list)
  - `created_at`, `updated_at`, `last_used_at`

**Voucher table change:**
- Add `partner_agency_id` (nullable FK) to attribute partner-issued vouchers.

**Audit table change:**
- Include `partner_agency_id` in audit events for issuance/lookup (when applicable).

## 5) Auth & Middleware Changes
**Partner token auth flow:**
- Accept partner token on embedded form requests.
- Resolve token → tenant + partner agency context.
- Enforce **allowed routes only** (issue + lookup) for token auth.
- Enforce **partner scope** on lookup (only vouchers issued by that partner).

**Refusal semantics:**
- Use refusal envelope for unauthorized or out-of-scope requests.

## 6) Rate Limiting
- Implement per-token rate limit at **20 req/min/token**.
- Return **HTTP 429** with **Retry-After**.

## 7) Implementation Stories
From `epics.md`:
- **Story 1.6**: Partner Token Access (Embedded Issuance + Lookup)
- **Story 4.2–4.4**: Partner agency management, token generation, embed code, form customization
- **Story 2.1**: Issuance path supports partner tokens
- **Story 3.1**: Lookup path supports partner token scope

## 8) Test & Validation Requirements
- Tests for:
  - Token validation and partner-scoped context.
  - Issuance allowed via partner token; audit attribution recorded.
  - Lookup limited to partner-issued vouchers only.
  - Rate limit enforcement returns 429 + Retry-After.
- Manual QA:
  - Tenant admin can create partner agency, generate token, and embed code.
  - Embedded form honors allowed voucher types + intro text + rules list.
  - Partner cannot access non-partner vouchers.

## 9) Risks & Mitigations
- **Risk:** token leakage → misuse.
  - **Mitigation:** hashed storage, revocation workflow, rate limits.
- **Risk:** partner requests bypass tenant rules.
  - **Mitigation:** enforce tenant context from token only; no tenant from payload.

## 10) Handoff Checklist
- [ ] Schema migration plan reviewed by tech lead
- [ ] Auth middleware updated for partner-token flow
- [ ] Issuance + lookup enforce partner scope
- [ ] Rate limiting in place (20 req/min/token)
- [ ] Admin UI supports partner management + embed code generation
- [ ] Tests written + manual QA completed

