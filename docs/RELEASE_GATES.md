# Release Gates (Operational)

These operational gates must be satisfied before release for the single-droplet Postgres deployment.

## Backup and Restore Cadence

- Nightly off-droplet backups retained for 30 days.
- Weekly full off-droplet backups retained for 12 weeks.
- Monthly restore drill (restore a backup into a staging environment and validate).

## Alert Thresholds

- Disk utilization alert at 80% usage.
- IO wait alert >20% for 5 minutes.

## Cutover Readiness

- Cutover runbook: `docs/CUTOVER.md` (migration checklist in `MIGRATION.md`).
- Parity checks: complete Epic 6 parity checks before release.

## Evidence and Verification

- Backup job logs recorded for nightly and weekly backups.
- Restore drill report captured monthly.
- Alert policies documented and monitored.
