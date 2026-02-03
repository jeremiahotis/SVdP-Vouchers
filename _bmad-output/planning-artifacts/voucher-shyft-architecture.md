---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - ecosystem-rule-book.md
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/voucher-shyft-prd.md
  - _bmad-output/planning-artifacts/voucher-shyft-prd-validation-report.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-2026-02-02.md
  - SCOPE.md
  - DATA_DICTIONARY.md
  - MIGRATION.md
  - POS_CSV_CONTRACT.md
  - TEST_PLAN.md
  - _bmad-output/planning-artifacts/ui/shyft_ux_design_and_brand_system_source_of_truth_v_1.md
  - _bmad-output/planning-artifacts/ui/system-invariants.md
  - _bmad-output/planning-artifacts/ui/shyft_ux_do_dont_appendix_v_1.md
  - _bmad-output/planning-artifacts/ui/decision-surface-review-checklist.md
  - _bmad-output/planning-artifacts/ui/redesign-mode-rules.md
  - _bmad-output/planning-artifacts/ui/ui/guided-steward-decision-form.md
  - _bmad-output/planning-artifacts/ui/ui/ui-review-validator-output-schema-v1.md
workflowType: 'architecture'
project_name: 'VoucherShyft'
user_name: 'Jeremiah'
date: '2026-02-03'
lastStep: 8
status: 'complete'
completedAt: '2026-02-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- 43 FRs cover tenancy derivation (host/JWT-only), membership-scoped access, tenant switching (host change), app enablement via `platform.tenant_apps`, voucher lifecycle, duplicate detection/override governance, redemption with receipt capture, tenant-scoped config, audit/observability, migration/cutover enforcement, and minimal exports.
- Core system behaviors enforce refusal semantics (HTTP 200 `{ success:false, reason }`) for business denials.

**Domain Invariants (Scope Lock):**
- Multi-type vouchers (clothing + furniture + household) gated by conference `allowed_voucher_types`.
- Closed catalog with immutable snapshot versioning at issuance.
- Coats are cashier-station only; never on request form.
- Redemption captures `receipt_id` + `gross_total` until CSV import is proven reliable.
- Weekly CSV import is admin-run, idempotent, and per-store profile–scoped.

**Non-Functional Requirements:**
- Performance: p95 end-to-end UI submit → confirmation targets under concurrency (≥25 active users).
- Security/Privacy: PII minimization; explicit retention; JWT auth; append-only audit trail.
- Reliability: 99.5% availability; idempotent redemption; migration parity gates; 0 successful legacy writes during 30-day WP read-only window.
- Observability: correlation IDs; refusal vs error metrics split.
- Accessibility: WCAG 2.1 AA for critical flows.
- Integration: versioned API, rate limits with 429/Retry-After.

**Scale & Complexity:**
- Primary domain: multi-tenant web app + API (B2B SaaS).
- Complexity level: High.
- Estimated architectural components: 8–12 (auth/tenant resolution, API, data/commit paths, UI shell, migration tooling, observability, admin/config, cashier flow, exports).

### Technical Constraints & Dependencies

- **Canonical tenant registry:** tenants must come from `platform.tenants`; VoucherShyft must not define its own tenant table.
- **App enablement:** access is gated by `platform.tenant_apps` on every request.
- **Tenant switching:** any switch must navigate to a different origin (new host). The UI must never switch tenant by writing tenant IDs into request payloads or local state.
- **Refusal contract:** business denials return HTTP 200 `{ success:false, reason }` and are tracked separately from errors.
- **RLS discipline:** tenant-scoped access via request-scoped transactions; no root ORM/DB access outside tenant-asserted helpers.
- **UX governance:** Decision Surface invariants and Shyft tokens are mandatory; stillness after key actions is binding (no auto-advance after refusals; no nudging into alternatives).

### Migration & Cutover Posture

- Historical vouchers only; additive-first migration with idempotent runs.
- Explicit per-store mapping; hard fail on ambiguous mappings.
- Per-store parity validation gates; cutover requires passing the migration parity suite.
- WP read-only enforcement: 30-day reference window with 0 successful legacy writes.

### Cross-Cutting Concerns Identified

- Tenant isolation and single-tenant execution context.
- Membership-scoped authorization and host/JWT-derived context.
- Refusal vs error semantics across API + UI.
- Observability: correlation IDs, refusal/error split, audit trails.
- Migration + cutover enforcement with verifiable gates.
- UX governance: Decision Surface structure, Quiet Authority, stillness discipline.
- Test gate posture: cutover readiness requires tenant isolation tests, refusal contract checks, migration parity suite, and 0 successful legacy writes during the 30-day window.

## Starter Template Evaluation

### Technical Preferences Confirmed
- Language: TypeScript end-to-end (shared types for refusals, tenant context, audit events).
- Web: Next.js (App Router).
- API: Separate service (Fastify).
- Database:
  - VoucherShyft: PostgreSQL on the DigitalOcean droplet (Docker volume, not managed DB).
  - Legacy WP reference window only: MariaDB (isolated) for 30 days read-only.
- Auth: Platform JWT verification + in-app membership/role enforcement.
- Deployment: Single DigitalOcean droplet is a **requirement**, container-first (Docker Compose), Caddy for TLS + host routing, same-origin /api/* reverse proxy.

### Current Version Signals (Verified as of now)
- **Next.js:** latest stable line is **16.1.x** (Next.js 16 and 16.1 release notes). Example: 16.1.6 is a recent patch release in the 16.1 line.
- **Fastify:** v5 is current and requires Node.js 20+ (per v5 migration guide).
- **PostgreSQL:** current supported release lines include 18.1 and 17.7. For droplet stability, default to **17.x latest patch** unless 18.x features are needed.
- **Caddy:** latest stable is 2.10.2; 2.11 betas exist.

### Starter Options Considered

**Option A — Recommended (Split Web + API, DO Droplet Requirement)**  
- Web: Next.js 16.1.x (App Router).  
- API: Fastify v5.  
- DB: PostgreSQL 17.x latest patch on the droplet (Docker volume + off-droplet backups).  
- Proxy/TLS: Caddy; same-origin by routing /api/* on tenant host to Fastify.  
- Deploy: Docker Compose (web, api, db, migrate, proxy; optional redis).  
- Why it fits: preserves refusal semantics, host/JWT tenant enforcement, one-tenant-per-request, and observability while keeping same-origin constraints.

**Option B — Batteries-Included API (NestJS instead of Fastify)**  
- Same as Option A but API is NestJS.  
- Trade-off: more scaffolding, heavier runtime; slower iteration for MVP.

**Option C — Next.js Full-Stack (Not Recommended)**  
- Web + API via Next.js route handlers/server actions only.  
- Risk: weakens enforcement boundaries for refusal contract, tenant isolation testability, and long-term integration stability.

### Starter Decision Recommendation
Proceed with **Option A**: Next.js 16.1.x + Fastify v5 + PostgreSQL 17.x (latest patch) + Caddy + Docker Compose on a single DigitalOcean droplet.  
This preserves ecosystem invariants (host/JWT tenant context, refusal contract, same-origin routing) while remaining fast to iterate.

**Devil’s advocate check:** the only “gotcha” with droplet Postgres is operational—disk, backups, restore drills. If DB persistence + off-droplet backups are not part of the starter, this becomes your first outage.

## Core Architectural Decisions

### Category 1: Data Architecture

**Decision 1 — Data modeling approach**  
- **Choice:** Hybrid (SQL migrations + lightweight query builder).  
- **Rationale:** Canonical schema is defined by SQL migrations + strict constraints. Use a lightweight query layer (Knex query builder or SQL tagged templates), but no “model magic” that bypasses tenant helpers.

**Decision 2 — Data validation strategy**  
- **Choice:** Both API validation + DB constraints.  
- **Rationale:** Zod for input shape, refusal payloads, shared types; DB constraints for tenant scoping, uniqueness, foreign keys, and irreversible state invariants.

**Decision 3 — Migration approach**  
- **Choice:** Knex migrations (SQL-first, explicit).  
- **Rationale:** Matches hybrid approach; keeps schema evolution reviewable.

**Decision 4 — Caching strategy**  
- **Choice:** No cache for MVP; rely on DB indexes.  
- **Rationale:** Add Redis only if needed (rate limits, queues, hotspots). In-process rate limits OK as best-effort only.

### Category 2: Authentication & Security

**Decision 5 — Authentication method**  
- **Choice:** Hybrid (platform JWT + service tokens for internal calls).  
- **Rationale:** Human users authenticate via platform-issued JWTs only. Service/integration accounts use tenant-scoped service tokens (API keys or signed JWTs). VoucherShyft does not issue user JWTs.

**Decision 6 — Authorization pattern**  
- **Choice:** Both middleware + domain checks (domain authoritative).  
- **Rationale:** Middleware fast-fails on tenant mismatch, missing membership, app not enabled, and basic role gates; domain layer is final authority for actions (overrides, voids, config changes).

**Decision 7 — Security middleware**  
- **Choice:** Standard hardening only (MVP).  
- **Rationale:** CORS off (same-origin only), strict headers at Caddy (HSTS/CSP/X-Content-Type-Options/Referrer-Policy), API rate limits per tenant/user. WAF deferred to Phase 2.

**Decision 8 — Data encryption**  
- **Choice:** TLS 1.2+; at-rest encryption via disk/volume (MVP).  
- **Rationale:** Field-level encryption only if future PII or partner mandates require it; keep PII minimal and structured.

**Decision 9 — API security strategy**  
- **Choice:** Tenant-asserting auth middleware + request-scoped context + refusal contract.  
- **Rationale:** Every request establishes `{ tenant_id, actor_id, roles, correlation_id }`; tenant derived from host + JWT claim match only; refusal vs error enforced at boundary.

**Risk note:** Service tokens must remain tenant-scoped and pass through the same tenant-asserting middleware + refusal contract (no backdoor bypass).

**Decision 9b — Tenant host resolution (canonical)**  
- **Choice:** Canonical host pattern is `{tenant_slug}.voucher.{root_domain}` (e.g., `store-a.voucher.shyft.org`).  
- **Choice:** Tenant lookup uses **exact host match** in `platform.tenants` (host header → exact lookup → tenant_id).  
- **Enforcement:** Unknown host returns HTTP 200 refusal `{ success:false, reason:"TENANT_NOT_FOUND", correlation_id }` with no tenant enumeration (including timing/messaging). Host/JWT mismatch returns refusal `{ success:false, reason:"TENANT_CONTEXT_MISMATCH", correlation_id }`. Tenant switch requires host change.

### Category 3: API & Communication

**Decision 10 — API design pattern**  
- **Choice:** REST-only (explicit routes + versioned base path).  
- **Rationale:** Keep `/v1/...` resource + action routes; avoid GraphQL in MVP for tenancy/audit simplicity.

**Decision 11 — API documentation**  
- **Choice:** OpenAPI generated from route schemas.  
- **Rationale:** Fastify schema-first routes generate OpenAPI; treat it as the contract for integrations/cross-module use.

**Decision 12 — Error/refusal handling**  
- **Choice:** Refusal contract at API boundary; errors per standard (already decided).  
- **Rationale:** Enforced consistently across REST, exports, and future integration endpoints.

**Decision 13 — Rate limiting**  
- **Choice:** Per-tenant + per-user API middleware, best-effort MVP.  
- **Rationale:** Single droplet makes API-level limits sufficient; add Caddy limits later if needed.

**Decision 14 — Service-to-service communication**  
- **Choice:** HTTP JSON only (no event bus MVP).  
- **Rationale:** Defer async/outbox to Phase 2/3 once integrations justify it.

### Category 4: Frontend Architecture

**Decision 15 — State management**  
- **Choice:** React local state + server data via React Query (or SWR).  
- **Rationale:** Server state through React Query; local UI state in components. Avoid global state in MVP unless a real cross-screen need appears.

**Decision 16 — Component architecture**  
- **Choice:** shadcn/ui components customized to Shyft tokens.  
- **Rationale:** Fast path to accessible components; tokens remain authoritative; Decision Surface structure enforced.

**Decision 17 — Routing strategy**  
- **Choice:** Next.js App Router only; tenant derived from host.  
- **Rationale:** No tenant in URL path/query; tenant switching = host change.

**Decision 18 — Performance approach**  
- **Choice:** Default Next.js (server components for read, client for forms).  
- **Rationale:** Read-heavy pages as server components; issuance/redemption forms as client components using API mutations. Enforce stillness after refusal (no auto-advance).

**Decision 19 — Bundle optimization**  
- **Choice:** Default Next.js; audit only if needed.  
- **Rationale:** Measure before optimizing; avoid heavy dependencies in shared layouts to keep redemption flow lean.

**Risk note:** All mutations must go through Fastify API (no server-action bypass) to preserve refusal contract discipline.

### Category 5: Infrastructure & Deployment

**Decision 20 — Hosting strategy**  
- **Choice:** Single DigitalOcean droplet (Docker Compose).  
- **Rationale:** One droplet runs Caddy, web, api, postgres, migrate (legacy WP/MariaDB only during 30-day window).

**Decision 21 — CI/CD pipeline**  
- **Choice:** GitHub Actions build + deploy via SSH/docker compose.  
- **Rationale:** Build images, tag with git SHA, push to registry (GHCR), pull on droplet, run migrations, restart services. Deployments must be repeatable and idempotent.

**Decision 22 — Environment configuration**  
- **Choice:** `.env` files on droplet with strict perms + docker compose.  
- **Rationale:** One env per environment; root-owned; chmod 600; secrets not in git or compose YAML.

**Decision 23 — Monitoring/logging**  
- **Choice:** Basic logs + metrics + alerting (droplet + app).  
- **Rationale:** Droplet CPU/RAM/disk/IO, container restarts; app p95 latency, error/refusal rates, audit write failures; DB connections, slow queries, disk growth. OTel deferred to Phase 2.

**Decision 24 — Scaling strategy**  
- **Choice:** Single instance MVP; vertical scaling.  
- **Rationale:** Design separable services, but no horizontal scaling yet. Define scale triggers: sustained CPU >70%, p95 SLA breaches under 25 users, DB connections near cap, disk IO wait spikes.

**Decision 24b — Postgres-on-droplet operational gates (release-blocking)**  
- **Choice:** Nightly off-droplet backups (retain 30 days), weekly full backups (retain 12 weeks), **monthly restore drill**, disk utilization alert at **80%**, sustained IO wait alert at **>20% for 5 min**.  
- **Rationale:** These gates are required to meet reliability NFRs and cutover safety on a single droplet.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database naming**
- Tables: snake_case, plural (e.g., `vouchers`, `voucher_authorizations`)
- Columns: snake_case (e.g., `tenant_id`, `receipt_id`)
- All tables include `tenant_id` unless explicitly platform/global (those must live outside VoucherShyft schema/DB).
- Timestamps: `created_at`, `updated_at`, `deleted_at` (nullable; only for soft delete).
- FK columns: `<table>_id` (e.g., `voucher_id`, `store_id`)
- Indexes: `idx_<table>__<col1>_<col2>` (double underscore to avoid ambiguity)
- Constraints:
  - Unique: `uq_<table>__<col1>_<col2>`
  - Foreign key: `fk_<table>__<col>__<ref_table>`

**API naming**
- Base path: `/v1`
- Resources: plural (e.g., `/v1/vouchers`)
- Actions: explicit subpaths for non-CRUD (e.g., `/v1/vouchers/{id}/redeem`)
- Route params: `{id}` in docs; `:id` in implementation
- Query params: snake_case
- Guardrail: **No tenant identifier in routes or query params** (no `/tenants/:id`, no `?tenant_id=`); tenant is host/JWT-derived only.

**Code naming**
- TS files: kebab-case (e.g., `voucher-service.ts`, `tenant-context.ts`)
- Components: PascalCase (e.g., `VoucherLookupPanel`)
- Functions/vars: camelCase
- Types/interfaces: PascalCase (`VoucherRedeemRequest`)

### Structure Patterns

**Backend (Fastify)**
- `src/` organized by feature: `vouchers/`, `tenancy/`, `auth/`, `audit/`
- Each feature contains: `routes.ts`, `schemas.ts`, `handlers.ts`, `repo.ts`
- `service.ts` only when reusable domain services exist; otherwise handlers are the command layer.
- Tenant helpers in `src/tenancy/` are required by all repos.

**Frontend (Next.js)**
- `app/` App Router with route groups by feature
- `components/` for shared UI
- `features/` for domain-specific UI logic
- `lib/` for API client, auth helpers, and tenant context

**Tests**
- Unit tests co-located with code (`*.test.ts`)
- Integration tests in `tests/`
- Tenant isolation tests are **release-blocking** and must run in CI against a real Postgres container (no mocks).

### Format Patterns

**API responses**
- Success: `{ success: true, data, correlation_id }`
- Refusal (business denial): `{ success: false, reason, details?, correlation_id }` with HTTP 200
- Error: `{ success: false, error: { code, message }, correlation_id }` with non-200

**Dates**
- ISO-8601 UTC strings with `Z`

**JSON casing**
- snake_case on the wire (API payloads, OpenAPI, exports)

### Communication Patterns

**Logging**
- Structured JSON logs
- Always include `correlation_id`, `tenant_id`, `actor_id`, `request_id`
- Refusal vs error are tracked as separate metrics

**Audit events**
- Append-only records: `event_type`, `actor_id`, `tenant_id`, `entity_id`, `reason`, `timestamp`

### Process Patterns

**Tenant context**
- Assert tenant context once per request (host/JWT match), stored in request-scoped context
- Repos require tenant context; root DB access forbidden

**Validation timing**
- Input validation at API boundary using Zod (schema-driven)
- DB constraints enforce non-negotiables (tenant isolation, uniqueness)

**Refusal handling**
- Refusals are expected outcomes; UI shows refusal reason with no auto-advance

## Project Structure & Boundaries

### Requirements Mapping (FR Categories → Modules)

- Tenant resolution & access control → `apps/api/src/tenancy/`, `apps/api/src/auth/`
- App enablement (`platform.tenant_apps`) → `apps/api/src/tenancy/enablement/`
- Voucher lifecycle (issue/redeem/void/lookup) → `apps/api/src/vouchers/`
- Duplicate detection/override → `apps/api/src/vouchers/duplicate/`, `apps/api/src/vouchers/overrides/`
- Redemption + receipt capture → `apps/api/src/redemptions/`
- Catalog/config (tenant-scoped) → `apps/api/src/catalog/`, `apps/api/src/config/`
- Audit + observability → `apps/api/src/audit/`, `apps/api/src/observability/`
- Migration/cutover tooling → `apps/api/src/migrations/`, `tools/migration/`
- Web UI (issuance, redemption, admin) → `apps/web/app/(routes)/`
- Shared contracts (Zod, types) → `packages/contracts/`

### Repository Tree (Monorepo)

```
voucher-shyft/
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .editorconfig
├── .gitignore
├── .env.example
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── Caddyfile
│   │   └── env/
│   │       ├── prod.env.example
│   │       └── stage.env.example
│   └── scripts/
│       ├── deploy.sh
│       ├── migrate.sh
│       └── backup.sh
├── .github/
│   └── workflows/
│       └── deploy.yml
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── routes.ts
│   │   │   ├── tenancy/
│   │   │   ├── auth/
│   │   │   ├── vouchers/
│   │   │   ├── redemptions/
│   │   │   ├── catalog/
│   │   │   ├── config/
│   │   │   ├── audit/
│   │   │   ├── observability/
│   │   │   ├── exports/
│   │   │   └── health/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── knexfile.ts
│   │   └── tests/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   ├── (auth)/
│   │   │   ├── (tenant)/
│   │   │   │   ├── vouchers/
│   │   │   │   ├── redemption/
│   │   │   │   └── admin/
│   │   ├── components/
│   │   ├── features/
│   │   └── lib/
│   │       ├── api-client.ts
│   │       ├── auth.ts
│   │       └── tenant.ts
├── packages/
│   ├── contracts/
│   │   ├── src/
│   │   │   ├── zod/
│   │   │   ├── types/
│   │   │   └── constants/
│   │   └── package.json
│   └── ui/
│       ├── src/
│       │   ├── tokens/
│       │   └── components/
│       └── package.json
├── tests/
│   ├── integration/
│   └── tenant-isolation/
└── tools/
    ├── migration/
    └── cutover/
```

### Integration Boundaries

- **Auth/Tenant boundary:** `apps/api/src/tenancy/` asserts tenant context and provides request-scoped context for all handlers.
- **Data access boundary:** only `repo.ts` files can access DB; all repo access requires tenant context.
- **API boundary:** Fastify routes enforce refusal contract; OpenAPI generated from schemas.
- **UI boundary:** all mutations go through API client; no server-action mutations.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**  
- Stack is coherent: Next.js web + Fastify API + Postgres on DO droplet aligns with tenancy, refusal semantics, and same-origin constraints.
- Auth/tenancy decisions (platform JWT + host-derived tenant context + middleware + domain checks) align with ecosystem rules.
- Deployment model (Docker Compose + Caddy) aligns with host-based tenant routing and no CORS.

**Pattern Consistency:**  
- Naming and casing rules are consistent across DB, API, and contracts.
- Refusal/error envelopes match FR0 + NFR observability.
- Tenant context enforcement appears consistently across patterns and boundaries.

**Structure Alignment:**  
- Repo structure supports the required modules and separation (tenancy/auth/audit/vouchers/redemptions).
- Boundaries enforce “no direct DB access” outside repos and “no server-action mutations”.

### Requirements Coverage Validation ✅

**FR Coverage:**  
- Tenancy, app enablement, membership, and switching mapped to tenancy/auth modules.  
- Voucher lifecycle + redemption + receipt capture mapped to vouchers/redemptions modules.  
- Audit, observability, refusal contract mapped to audit/observability modules.  
- Migration/cutover enforced via tooling and CI gates.  
- UI Decision Surface constraints aligned with component architecture and UI tokens.

**NFR Coverage:**  
- Performance, security, observability, and reliability addressed in decisions and patterns.  
- Cutover posture (30‑day WP read-only with 0 successful writes) is explicit.

### Implementation Readiness ✅

**Decision Completeness:**  
- Core tech choices + versions are pinned.
- Middleware + domain authority patterns are explicit.
- Response envelopes and correlation_id are mandated.

**Structure Completeness:**  
- Monorepo tree is specific and maps to FR categories.
- Infra and CI/CD placement are defined.

**Pattern Completeness:**  
- Naming, format, process, and validation patterns are explicit and enforceable.
- Tenant isolation tests are release-blocking and run against real Postgres.

### Gap Analysis (Revised)

**Critical Gaps (must resolve before build proceeds):**  
- None. Tenant host resolution behavior and Postgres-on-droplet operational gates are now locked as architectural decisions.

**Important Gaps (should be resolved during Sprint 0 / early implementation):**  
- Idempotency contract pinned: redemption idempotency key `(tenant_id, voucher_id)`; migration import idempotency key `(tenant_id, source_system, source_voucher_id)` (or equivalent stable source key). Enforce via DB constraints + tests.  
- Retention + log PII policy: define audit/log retention defaults and a “no PII in logs except allowlist” rule.  
- OpenAPI drift prevention: generate OpenAPI from route schemas in CI; enforce freshness by failing builds on spec drift (or generate spec artifact and remove committed spec).

**Nice-to-Have:**  
- Deployment runbook (compose ops, backup/restore, cutover checklist).

### Validation Summary

Architecture is internally consistent and covers FR/NFRs. No critical gaps remain; important gaps should be resolved during Sprint 0.

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅  
**Total Steps Completed:** 8  
**Date Completed:** 2026-02-03  
**Document Location:** `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements-to-architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 24 architectural decisions made
- 5 implementation pattern areas defined
- 10 core architectural modules mapped to requirements
- 43 functional requirements covered

**AI Agent Implementation Guide**
- Technology stack with verified version lines
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**  
This architecture document is the guide for implementing VoucherShyft. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**  
Initialize the monorepo and infra scaffolding (Docker Compose + Caddy), then wire Fastify with tenant-asserting middleware and schema-driven OpenAPI generation.

**Development Sequence:**
1. Initialize project structure and shared contracts
2. Implement tenant resolution + auth middleware + refusal envelope
3. Add core DB migrations + tenant-scoped repo helpers
4. Build voucher lifecycle endpoints and UI flows
5. Implement migration tooling + cutover gates
