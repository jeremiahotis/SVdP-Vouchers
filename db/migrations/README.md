# Database migrations

## Naming scheme

Migrations are **ordered by an incrementing integer schema version**.

File name format:

`v####__YYYYMMDD__short_slug.php`

Examples:
- `v0003__20260114__add_store_id.php`
- `v0004__20260114__create_catalog_tables.php`

Rules:
- The numeric prefix (`v####`) is the **authoritative order**.
- Migrations must be **idempotent** (safe to run multiple times).
- After a successful run, update `wp_options.svdp_schema_version` to that version.
- Never edit old migrations once released; add a new migration instead.

## Runner contract (expected)

The migration runner should:
1. Read current version from `get_option('svdp_schema_version', 2)`.
2. Discover migration files in this folder, sorted by `v####`.
3. Run each migration with version > current.
4. On success, set `svdp_schema_version` to the version just applied.

Each migration file should return a callable:

```php
<?php
return function() {
  // schema changes + backfills
};
```

or define a function and return its name.

## Version map (planned)

- v0003: Stores + store_id
- v0004: Catalog tables + seeds
- v0005: Voucher authorization snapshots
- v0006: POS receipt import tables
