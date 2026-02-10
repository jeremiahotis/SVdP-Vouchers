# Project Documentation Index

## Project Overview

- **Type:** standalone SaaS module (VoucherShyft)
- **Primary Language:** TypeScript
- **Architecture:** multi-tenant web + API (single droplet)

## Quick Reference

- **Tech Stack:** Next.js, Fastify, PostgreSQL, Docker Compose, Caddy
- **Entry Point:** `apps/api/src/main.ts`
- **Architecture Pattern:** tenancy-by-host + JWT, refusal contract, RLS discipline

## Generated Documentation

- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
- [API Contracts](./api-contracts-plugin.md)
- [Data Models](./data-models-plugin.md)
- [Comprehensive Analysis](./comprehensive-analysis-plugin.md)

## Existing Documentation

- [README](../README.md) - VoucherShyft overview and usage
- [Data Dictionary](../DATA_DICTIONARY.md) - Data model plan
- [Migration Plan](../MIGRATION.md) - Migration phases and rollout
- [POS CSV Contract](../POS_CSV_CONTRACT.md) - ThriftWorks import expectations
- [Scope Lock](../SCOPE.md) - Non-negotiable scope constraints
- [Test Plan](../TEST_PLAN.md) - Manual verification checklist
- [UI States](../UI_STATES.md) - Required UI states and behaviors
- [Update Redemption Instructions](../update-redemption-instructions.sql) - One-off SQL update
- [DB Migrations README](../db/migrations/README.md) - Migration runner notes
 - [Cutover Runbook](./CUTOVER.md) - Hard cutover + 30-day read-only window
 - [Tenancy & Access Model](./TENANCY_AND_ACCESS.md) - Host/JWT tenancy, roles, refusals
 - [Git Story/Epic Policy](./GIT_STORY_EPIC_POLICY.md) - Branching, commit, PR, and merge rules

## Getting Started

1. Configure `.env` (Postgres + JWT settings).
2. Start services with `infra/scripts/compose.sh up -d`.
3. Run migrations: `infra/scripts/compose.sh run --rm migrate`.
4. Seed the platform registry: `ALLOW_PLATFORM_SEED=true pnpm seed:platform`.
