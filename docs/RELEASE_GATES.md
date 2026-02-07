# Release Gates (Operational)

This document defines the release-blocking operational gates for the single-droplet Postgres deployment.

## Backup and Restore Cadence

- Nightly backups retained for 30 days.
- Weekly full backups retained for 12 weeks.
- Monthly restore drill (restore a backup into a staging environment and validate).

## Alert Thresholds

- Disk utilization alert at 80%.
- IO wait alert >20% for 5 minutes (node-exporter `node_cpu_seconds_total{mode="iowait"}` 5m avg).

## Evidence and Verification

- Backup job logs recorded for nightly and weekly backups.
- Restore drill report captured monthly.
- Alert policies documented and monitored.

## References

- Cutover runbook: docs/CUTOVER.md
- Migration runbook: MIGRATION.md
- Parity checks: docs/CUTOVER.md (per-tenant counts + spot-checks)
