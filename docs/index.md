# Project Documentation Index

## Project Overview

- **Type:** monolith
- **Primary Language:** PHP
- **Architecture:** WordPress plugin monolith

## Quick Reference

- **Tech Stack:** WordPress, PHP, jQuery, REST API, MySQL
- **Entry Point:** `svdp-vouchers.php`
- **Architecture Pattern:** WordPress plugin monolith with admin/public separation

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

- [README](../README.md) - Plugin overview and usage
- [Data Dictionary](../DATA_DICTIONARY.md) - Data model plan
- [Migration Plan](../MIGRATION.md) - Migration phases and rollout
- [POS CSV Contract](../POS_CSV_CONTRACT.md) - ThriftWorks import expectations
- [Scope Lock](../SCOPE.md) - Non-negotiable scope constraints
- [Test Plan](../TEST_PLAN.md) - Manual verification checklist
- [UI States](../UI_STATES.md) - Required UI states and behaviors
- [Update Redemption Instructions](../update-redemption-instructions.sql) - One-off SQL update
- [DB Migrations README](../db/migrations/README.md) - Migration runner notes

## Getting Started

1. Start the Local by Flywheel site.
2. Activate the SVdP Vouchers plugin.
3. Create pages for the shortcodes:
   - `[svdp_voucher_request]`
   - `[svdp_cashier_station]`
4. Use admin screens to manage conferences, settings, and overrides.
