# Infrastructure

This folder holds Docker Compose, reverse proxy config, and operational scripts for the single‑droplet deployment.

## Expected layout

- `docker/` contains `docker-compose.yml` and `Caddyfile`
- `scripts/` contains operational scripts (deploy, migrate, backup)

## Notes

- Web + API are same-origin per tenant via `/api/*` proxying.
- Postgres runs on the droplet; backups must be off‑droplet.
