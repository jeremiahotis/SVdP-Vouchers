# Ecosystem Rule Book  
**NeighborRoute / MoneyShyft Platform**

**Status:** Canonical  
**Audience:** All engineering teams building within the ecosystem  
**Enforcement:** Mandatory via CI

---

## 0. Purpose

This document defines the **non-negotiable rules** governing all applications in the NeighborRoute / MoneyShyft ecosystem.

Any application, service, or tool that integrates with the ecosystem **MUST** comply with this rule book.

If a team cannot comply, the work does not ship.

---

## 1. Canonical Hierarchy (No Exceptions)

When documents conflict, the higher-ranked document wins.

1. Product Constitution  
2. Ecosystem Rule Book (this document)  
3. App Architecture (architecture.md)  
4. Implementation code

Architecture.md may specialize these rules.  
It may **never contradict** them.

---

## 2. Tenancy (ECO-TEN-001)

### 2.1 Canonical Tenant Registry

- `platform.tenants` is the **single source of truth** for tenants.
- All applications share this registry.
- A tenant may exist with zero enabled apps.

No application may define its own tenant table.

### 2.2 App Enablement

- App usage is modeled separately (e.g. `platform.tenant_apps`).
- Tenant existence ≠ app entitlement.

### 2.3 Tenant Resolution Rules

Tenant identity may be derived **only** from:
1. One-time code record (exchange endpoint only)
2. Host header (`<tenant>.<app>.org`)
3. JWT claims (post-auth; MUST match Host)

Deriving tenant identity from request body, query params, or cookies is forbidden.

---

## 3. Domains & Routing (ECO-NET-001)

- One subdomain per app: `<tenant>.<app>.org`
- Web and API are same-origin per app.
- CORS is not used in production browser flows.

Path-based multi-app routing and shared cookies are forbidden.

---

## 4. Authentication & Identity (ECO-AUTH-001)

- Guests authenticate via one-time code exchange.
- Tokens are never placed in URLs.
- JWTs MUST include `kid`, tenant_id, and be audience-scoped.
- External systems authenticate via **embed credentials** (tenant-scoped, admin-approved).

Integrator code does not live in app repositories.

---

## 5. State & Capacity Law (ECO-STATE-001)

- Safety-critical state changes MUST occur through a single commit path.
- Commit paths run inside DB transactions and enforce locking.
- Only commit paths may create schedulable or irreversible records.

---

## 6. Refusal vs Error Contract (ECO-UX-001)

Business refusals:
- HTTP 200
- `{ success: false, reason }`

Errors:
- HTTP 4xx/5xx
- Auth, validation, or system faults only.

---

## 7. CSP & Framing (NR-SEC-CSP-FINAL)

- CSP for `/book/*` is injected at ingress (host Nginx).
- Next.js MUST NOT implement CSP logic.
- Allowlist source: `platform.tenants.allowed_frame_origins`.
- Fail-closed default: `frame-ancestors 'none'`.

---

## 8. Data Access & RLS (ECO-DB-001)

- All DB access occurs inside request-scoped transactions.
- Tenant context must be asserted.
- Root ORM access outside RLS helpers is forbidden.

---

## 9. Observability Baseline (ECO-OBS-001)

- Structured JSON logs.
- Correlation ID per request.
- Metrics distinguish refusals vs errors.

---

## 10. Prohibited Patterns

- App-specific tenant registries
- CSP generation inside apps
- Tokens in URLs
- Auth via cookies
- Path-based app routing
- Inline scripts without nonce

Violations block merge.

---

## 11. Canonical Source & Drift Control

Canonical: `/architecture.md`

Derived copies MUST be regenerated.  
CI MUST fail on drift.

---

## 12. Finality

This rule book is binding.
