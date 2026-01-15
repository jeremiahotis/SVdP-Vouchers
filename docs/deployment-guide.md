# Deployment Guide (SVdP Vouchers)

## Deployment Model
Standard WordPress plugin deployment. No build step.

## Environments
- Local by Flywheel for development
- Staging/Production WordPress site for release

## Deployment Steps
1. Zip or copy the `SVdP-Vouchers` plugin folder into `wp-content/plugins/`.
2. Activate the plugin in WP admin.
3. Visit admin pages to confirm migrations ran and settings exist.
4. Create or update pages that include required shortcodes.

## Rollback
- Deactivate the plugin.
- Restore prior plugin version files.

## Notes
- Database changes are handled via `SVDP_Database` and migration runner.
- One-off SQL updates are in `update-redemption-instructions.sql`.
