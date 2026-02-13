# Tenant Isolation Tests

These tests must run against a real Postgres container (no mocks) and are release-blocking.

## Expectations

- Requests scoped to tenant A never return tenant B data.
- Host/JWT mismatch returns refusal `TENANT_CONTEXT_MISMATCH`.
- Unknown host returns refusal `TENANT_NOT_FOUND` with no tenant enumeration.
- Duplicate checks never use cross-tenant rows to refuse issuance.
- Override references must remain tenant-scoped and reject cross-tenant voucher IDs.

## Setup

- Start Postgres (local container or docker-compose).
- Seed two tenants with distinct data.
- Run tenant isolation test suite.
