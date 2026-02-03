# Cutover Runbook (VoucherShyft)

## Purpose
Execute a hard cutover from legacy WordPress voucher system to VoucherShyft while preserving data continuity and enforcing a 30-day read-only reference window on WP.

## Scope
- Historical vouchers only (no receipts/audits).
- Stores are tenants; tenant context is derived from host + JWT tenant claim.
- No dual-write; WP becomes reference-only.

## Preconditions (Release-Blocking Gates)
- Tenant isolation tests pass (no cross-tenant access).
- Cross-tenant membership checks refuse non-membership with HTTP 200 `{ success:false, reason }`.
- Refusal contract enforced for business denials; auth failures use 401/403.
- DB access only via tenant-asserted helpers (no root/unguarded access).
- Same-origin browser flows; no production CORS dependency.
- Migration parity checks pass per tenant (counts + spot-checks; ambiguous mapping hard-fails).
- **0 successful legacy writes during the 30-day WP reference window** (attempts blocked + alerted).
- Postgres-on-droplet operational gates:
  - Nightly off-droplet backups retained 30 days.
  - Weekly full backups retained 12 weeks.
  - Monthly restore drill completed and documented.
  - Disk alert threshold at 80%.
  - IO wait alert at >20% sustained 5 minutes.

## Cutover Sequence
1) **Freeze Voucher Writes (WP voucher plugin paths)**
   - Enable WP read-only enforcement stack (see below).
   - Confirm write attempts are blocked and alerting is active.

2) **Export (WP)**
   - Export historical voucher data from WP.
   - Capture export metadata (timestamp, row counts, checksum if available).

3) **Transform**
   - Map vouchers to new schema with explicit `tenant_id = store_id`.
   - Hard fail on ambiguous store mapping.

4) **Import**
   - Run idempotent batch import into VoucherShyft.
   - Record batch id and import summary per tenant.

5) **Validate**
   - Per-tenant voucher count parity.
   - Spot-check oldest/newest vouchers per tenant.
   - Fail cutover if any tenant is missing or mismatched.

6) **Switch Traffic**
   - Route production traffic to VoucherShyft.
   - Confirm tenant routing by host and JWT match.

7) **Reference Window (30 days)**
   - WP remains view/export only for 30 days.
   - No writes permitted; attempts must be blocked and alerted.
   - Window start: cutover timestamp.
   - Window end: cutover timestamp + 30 days.
   - Document both in the cutover evidence log.

8) **Archive**
   - After 30 days, archive/offline WP per runbook.

## WP Read-Only Enforcement (30 days, MariaDB-backed)
Defense-in-depth is required.

1. **Plugin hard gate (primary)**
   - Global `READ_ONLY_MODE` blocks all voucher writes at entrypoints.
   - UI write actions are disabled.
   - Log attempted writes.

2. **Role/capability strip (secondary)**
   - Remove voucher write capabilities from all roles.
   - Retain view/export-only roles (optionally one “Legacy Admin”).

3. **MariaDB enforcement (safety net)**
   - Preferred: revoke `INSERT/UPDATE/DELETE` on voucher plugin tables for WP DB user (without breaking core tables).
   - Fallback: BEFORE INSERT/UPDATE/DELETE triggers on plugin tables to block writes during window.
   - Decision rule: use privilege revokes if the WP DB user can be scoped without impacting core tables; otherwise use triggers.

4. **Operational controls**
   - Restrict WP access (IP allowlist/VPN if feasible).
   - Alert on any blocked write attempts.

## Rollback Posture
- **No dual-run.** WP is not resumed as authoritative.
- Rollback is: pause VoucherShyft writes, fix migration issues, re-import, and re-validate.
- This prevents data divergence that cannot be reconciled cleanly.
- WP remains reference-only throughout the 30-day window.

## Evidence to Capture
- Export checksum + row counts per tenant.
- Import batch id + per-tenant counts.
- Parity validation report.
- Cutover timestamp.
- Alert logs for blocked WP writes.

## Responsibilities
- **PM/Architect:** cutover decision + comms.
- **Tech Lead:** execution, validation, rollback decisions.
- **Ops:** backups, access control, monitoring.
