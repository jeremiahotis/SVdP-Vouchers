# Data Models (SVdP Vouchers)

## Core Tables

### wp_svdp_vouchers
Stores vouchers and redemption state.

Key columns:
- id (PK)
- first_name, last_name, dob
- adults, children
- conference_id (FK -> wp_svdp_conferences.id)
- vincentian_name, vincentian_email
- created_by (Vincentian|Cashier)
- voucher_created_date
- status (Active|Redeemed|Expired|Denied)
- redeemed_date
- voucher_type (regular/clothing/furniture/household)
- voucher_value, voucher_items_count
- items_adult_redeemed, items_children_redeemed
- redemption_total_value
- override_note, manager_id, reason_id
- coat_status, coat_issued_date, coat_adults_issued, coat_children_issued
- denial_reason
- created_at, updated_at

Indexes: first_name, last_name, dob, conference_id, status, voucher_created_date, coat_issued_date, manager_id, reason_id

### wp_svdp_conferences
Organizations and store.

Key columns:
- id (PK)
- name, slug
- is_emergency
- organization_type (conference|partner|store)
- eligibility_days
- emergency_affects_eligibility
- regular_items_per_person, emergency_items_per_person
- form_enabled, active
- notification_email
- custom_form_text, custom_rules_text
- allowed_voucher_types (JSON)
- created_at, updated_at

Indexes: slug (unique), active, organization_type

### wp_svdp_settings
Global plugin settings.

Key columns:
- id (PK)
- setting_key (unique)
- setting_value
- setting_type
- created_at, updated_at

### wp_svdp_managers
Override approval managers.

Key columns:
- id (PK)
- name
- code_hash
- active
- created_date

### wp_svdp_override_reasons
Override reason dropdown.

Key columns:
- id (PK)
- reason_text
- display_order
- active

## Catalog Tables (current code references)
The catalog class expects these tables:
- wp_svdp_furniture_catalog
- wp_svdp_household_goods_catalog

Columns (as used in code):
- id, name, min_price, max_price, active, sort_order

## Planned Migrations (db/migrations)
Migration stubs exist for future schema updates:
- v0003 add store_id
- v0004 create catalog tables
- v0005 create voucher authorization snapshots
- v0006 create POS receipt import tables

These are placeholders and not implemented yet.
