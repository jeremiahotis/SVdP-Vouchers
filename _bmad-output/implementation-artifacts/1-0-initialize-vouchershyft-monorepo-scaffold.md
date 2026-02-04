# Story 1.0: Initialize VoucherShyft Monorepo Scaffold

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform engineer,
I want the starter template scaffold in place,
so that all subsequent stories implement within the approved architecture.

## Acceptance Criteria

1. **Given** the approved architecture stack (Next.js + Fastify + Postgres + Compose),
   **When** the repo is initialized,
   **Then** monorepo structure, Docker Compose, and baseline config exist and build.
2. **And** OpenAPI generation from route schemas is available for later stories.

## Tasks / Subtasks

- [x] Create monorepo scaffold per architecture (apps, packages, infra)
  - [x] Create `apps/api/` (Fastify) with minimal server bootstrap and schema-driven OpenAPI generation
  - [x] Create `apps/web/` (Next.js App Router) skeleton with basic layout and health route
  - [x] Create `packages/contracts/` for shared Zod schemas/types
  - [x] Create `packages/ui/` with token placeholder and shadcn-compatible structure
- [x] Add Docker Compose + Caddy baseline
  - [x] Create `infra/docker/docker-compose.yml` with web, api, db, proxy, migrate placeholders
  - [x] Create `infra/docker/Caddyfile` with `/api/*` reverse proxy routing to Fastify
  - [x] Add `.env` examples for web/api/db
- [x] OpenAPI generation ready
  - [x] Configure Fastify route schema registration and OpenAPI generation stub
  - [x] Add placeholder script (e.g., `pnpm api:openapi`) to generate spec from route schemas
- [x] Validate scaffold builds
  - [x] `pnpm install` + `pnpm -r build` or equivalent should succeed
  - [x] `docker compose up` should build containers successfully

## Dev Notes

- This story is scaffold-only. No business logic, tenant enforcement, or domain routes beyond minimal health/placeholder routing.
- Follow the approved architecture stack and project structure exactly.
- This is the foundation for all later stories—precision matters.

### Project Structure Notes

Expected structure (from architecture):

```
voucher-shyft/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── contracts/
│   └── ui/
├── infra/
│   └── docker/
└── .github/workflows/
```

### References

- Architecture decisions and repo structure: `_bmad-output/planning-artifacts/voucher-shyft-architecture.md`
- PRD constraints and NFRs: `_bmad-output/planning-artifacts/voucher-shyft-prd.md`
- Epic story definition: `_bmad-output/planning-artifacts/epics.md`

### Technical Requirements (Latest Versions)

- Next.js 16 is current Active LTS and is the required major version. Use the latest 16.x patch in scaffold. citeturn2search0turn2search2
- Fastify v5 requires Node.js 20+; scaffold must target Node 20+ (prefer Active LTS per Node release schedule). citeturn2search1turn1search0
- Postgres current supported releases include 18.1 and 17.7; architecture pins 17.x latest patch unless 18.x is explicitly needed. citeturn0search2
- Caddy should be installed from official docs; keep proxy config minimal for now. citeturn3search2

## Dev Agent Record

### Agent Model Used

GPT-5

### Debug Log References

N/A

### Completion Notes List

- Implemented missing `packages/ui` scaffold with token placeholder.
- Added root `api:openapi` script to wire OpenAPI generation from API routes.
- Added docker env example files for web/api/db services.
- Added baseline security headers + gzip in Caddyfile.
- Adjusted dev compose to install deps once and block web/api until ready.
- Made JWT JWKS URL validation lazy to avoid startup crash when env is missing.
- Rebuilt Docker config from scratch for container-only builds (no bind mounts).
- Corrected API start command to match compiled output path.
- Normalized API ESM relative imports to include .js extensions and switched to NodeNext module resolution.
- Normalized contracts package ESM relative imports to include .js extensions.
- Added contracts build output and updated workspace to publish JS instead of TS at runtime.
- Added web health route for scaffold verification.
- Tests pending: `pnpm test:e2e -- tests/api/scaffold.spec.ts`; `docker compose ... run tests`.
- Aligned Docker Compose/Caddy paths to `infra/docker/` and restored env examples.
- Added security headers (HSTS/CSP) to Caddy baseline.
- Removed redundant admin error schema entries.
- Updated `.gitignore` to exclude build artifacts and OpenAPI outputs.
- Applied defaults in docker compose to avoid missing POSTGRES env warnings.
- Validated scaffold builds on 2026-02-04: `pnpm install`, `pnpm -r build`, `docker compose -f infra/docker/docker-compose.yml up --build`.

### Change Log

- 2026-02-04: Marked scaffold build validations as pending; aligned tests with current scaffold.
- 2026-02-04: Fixed infra docker path drift and cleaned scaffold artifacts.
- 2026-02-04: Validated scaffold builds and marked Story 1.0 complete.

### File List

- `.gitignore`
- `package.json`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/admin/audit.ts`
- `apps/api/src/admin/routes.ts`
- `apps/api/src/audit/write.ts`
- `apps/api/src/auth/hook.ts`
- `apps/api/src/auth/jwt.ts`
- `apps/api/src/db/client.ts`
- `apps/api/src/main.ts`
- `apps/api/src/migrate.ts`
- `apps/api/src/platform/registry.ts`
- `apps/api/src/platform/tenants.ts`
- `apps/api/src/routes.ts`
- `apps/api/src/scripts/generate-openapi.ts`
- `apps/api/src/tenancy/hook.ts`
- `apps/api/src/tenancy/resolve.ts`
- `apps/api/src/tenancy/types.d.ts`
- `apps/web/package.json`
- `apps/web/app/health/route.ts`
- `infra/docker/Caddyfile`
- `infra/docker/docker-compose.yml`
- `infra/docker/api.Dockerfile`
- `infra/docker/web.Dockerfile`
- `infra/docker/tests.Dockerfile`
- `infra/docker/env/api.env.example`
- `infra/docker/env/db.env.example`
- `infra/docker/env/prod.env.example`
- `infra/docker/env/stage.env.example`
- `infra/docker/env/web.env.example`
- `packages/contracts/package.json`
- `packages/contracts/tsconfig.json`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/types/refusal.ts`
- `packages/ui/package.json`
- `packages/ui/src/index.ts`
- `packages/ui/src/tokens/README.md`
- `pnpm-lock.yaml`
- `tests/e2e/example.spec.ts`
