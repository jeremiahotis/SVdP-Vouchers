# Story 1.0: Initialize VoucherShyft Monorepo Scaffold

Status: ready-for-dev

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

- [ ] Create monorepo scaffold per architecture (apps, packages, infra)
  - [ ] Create `apps/api/` (Fastify) with minimal server bootstrap and schema-driven OpenAPI generation
  - [ ] Create `apps/web/` (Next.js App Router) skeleton with basic layout and health route
  - [ ] Create `packages/contracts/` for shared Zod schemas/types
  - [ ] Create `packages/ui/` with token placeholder and shadcn-compatible structure
- [ ] Add Docker Compose + Caddy baseline
  - [ ] Create `infra/docker/docker-compose.yml` with web, api, db, proxy, migrate placeholders
  - [ ] Create `infra/docker/Caddyfile` with `/api/*` reverse proxy routing to Fastify
  - [ ] Add `.env` examples for web/api/db
- [ ] OpenAPI generation ready
  - [ ] Configure Fastify route schema registration and OpenAPI generation stub
  - [ ] Add placeholder script (e.g., `pnpm api:openapi`) to generate spec from route schemas
- [ ] Validate scaffold builds
  - [ ] `pnpm install` + `pnpm -r build` or equivalent should succeed
  - [ ] `docker compose up` should build containers successfully

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

- Story scaffolded from Epic 1.0 acceptance criteria.
- Latest version constraints noted with primary sources.

### File List

- `_bmad-output/implementation-artifacts/1-0-initialize-vouchershyft-monorepo-scaffold.md`
