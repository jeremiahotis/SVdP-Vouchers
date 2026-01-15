# Story 6.1: Weekly CSV Import (Store-Scoped)

**Epic:** Epic 6 - POS Receipt Import and Linking  
**Story ID:** 6.1  
**Status:** Ready for Implementation

---

## User Story

As an admin,  
I want to upload weekly POS CSVs scoped to a store,  
So that receipts can be reconciled to vouchers.

---

## Acceptance Criteria

**Given** an admin uploads a CSV for a store  
**When** the import begins  
**Then** receipts persist with store_id, receipt_id, gross_total, and datetime

**Given** a CSV is imported twice  
**When** duplicate rows are processed  
**Then** duplicates are rejected based on (store_id, receipt_id)

---

## Technical Context

### CSV Format
See [POS_CSV_CONTRACT.md](../../POS_CSV_CONTRACT.md) for ThriftWorks CSV format specification.

### Import Flow
1. Admin uploads CSV file via admin UI
2. System creates import run record (`wp_svdp_import_runs`)
3. System processes CSV in batches (500-2000 rows per batch)
4. For each row: parse, validate, insert receipt (idempotent)
5. Update import run with stats (rows_read, rows_inserted, rows_skipped, errors)
6. Display import summary to admin

### Database Schema
**Import runs table:** `wp_svdp_import_runs`
- `id`, `store_id`, `started_at`, `ended_at`, `rows_read`, `rows_inserted`, `rows_skipped`, `errors` (JSON)

**Receipts table:** `wp_svdp_pos_receipts`
- `id`, `store_id`, `receipt_id`, `gross_total`, `receipt_datetime`, `created_at`
- Unique index on `(store_id, receipt_id)`

### Implementation Location
- **Class:** `includes/class-import.php` (import logic)
- **Admin UI:** `admin/views/tab-imports.php` (upload form, status display)
- **Admin JS:** `admin/js/imports.js` (upload handling, progress polling)
- **REST:** `/wp-json/svdp/v1/imports` endpoints

---

## Related Documents

- [PRD FR20, FR21](../planning-artifacts/prd.md#L313-L314) - Import requirements
- [Architecture - CSV Import](../planning-artifacts/architecture.md#L191-L195) - Import pattern
- [Epics - Story 6.1](../planning-artifacts/epics.md#L424-L438) - Full story details

---

## Definition of Done

- [ ] Import runs table created (migration)
- [ ] CSV upload UI implemented in admin
- [ ] Batch processing logic implemented (chunked)
- [ ] Idempotency enforced via unique index on (store_id, receipt_id)
- [ ] Import summary displayed after completion
- [ ] Error handling for malformed CSV rows
- [ ] Tests for import flow (success, duplicates, errors)
- [ ] Code reviewed and merged

---

## Notes

- Import must complete within admin session (no background workers required for MVP)
- Chunk size should be configurable (default 1000 rows)
- Store import metadata for audit trail and debugging
