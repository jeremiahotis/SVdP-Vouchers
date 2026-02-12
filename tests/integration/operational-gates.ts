import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const releaseGatesPath = resolve(process.cwd(), "docs/RELEASE_GATES.md");
const packageJsonPath = resolve(process.cwd(), "package.json");
const workflowsDir = resolve(process.cwd(), ".github", "workflows");

function readReleaseGates(): string {
  return readFileSync(releaseGatesPath, "utf-8");
}

function readPackageJson(): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
    scripts?: Record<string, string>;
  };
}

function assertReleaseGatesFileExists() {
  // GIVEN: Release gates documentation should exist
  // WHEN: Checking for docs/RELEASE_GATES.md
  // THEN: File exists
  assert.ok(
    existsSync(releaseGatesPath),
    "Expected docs/RELEASE_GATES.md to exist for release-gate enforcement",
  );
}

function assertReleaseGatesHookedInTestDb() {
  // GIVEN: Release gates checks should run in CI
  // WHEN: Inspecting package.json scripts
  // THEN: test:release-gates exists and test:db includes it
  const scripts = readPackageJson().scripts ?? {};
  assert.ok(
    scripts["test:release-gates"],
    "Expected test:release-gates script to be defined",
  );
  assert.ok(
    /test:release-gates/.test(scripts["test:db"] ?? ""),
    "Expected test:db to include test:release-gates",
  );
}

function assertReleaseGatesHookedInCiWorkflows() {
  // GIVEN: CI should verify release gates docs are present
  // WHEN: Scanning workflow definitions
  // THEN: RELEASE_GATES.md is referenced in at least one workflow
  const workflowFiles = readdirSync(workflowsDir)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"));
  assert.ok(
    workflowFiles.length > 0,
    "Expected at least one CI workflow file",
  );
  const combinedWorkflow = workflowFiles
    .map((file) => readFileSync(join(workflowsDir, file), "utf-8"))
    .join("\n");
  assert.ok(
    /RELEASE_GATES\.md/.test(combinedWorkflow),
    "Expected CI workflow to reference RELEASE_GATES.md",
  );
}

function assertNightlyBackups(content: string) {
  // GIVEN: Release gates documentation
  // WHEN: Verifying nightly backup retention policy
  // THEN: Nightly backups with 30-day retention are described
  const nightlyPattern = /nightly.*backup/i;
  const offDropletPattern = /off[-\s]*droplet/i;
  const retentionPattern = /30\s*days?/i;
  assert.ok(
    nightlyPattern.test(content) && offDropletPattern.test(content) && retentionPattern.test(content),
    "Expected nightly off-droplet backups with 30-day retention documented",
  );
}

function assertWeeklyFullBackups(content: string) {
  // GIVEN: Release gates documentation
  // WHEN: Verifying weekly full backup retention policy
  // THEN: Weekly full backups with 12-week retention are described
  const weeklyPattern = /weekly.*full.*backup/i;
  const offDropletPattern = /off[-\s]*droplet/i;
  const retentionPattern = /12\s*weeks?/i;
  assert.ok(
    weeklyPattern.test(content) && offDropletPattern.test(content) && retentionPattern.test(content),
    "Expected weekly full off-droplet backups with 12-week retention documented",
  );
}

function assertMonthlyRestoreDrill(content: string) {
  // GIVEN: Release gates documentation
  // WHEN: Verifying restore drill cadence
  // THEN: Monthly restore drills are described
  assert.ok(
    /monthly.*restore.*drill/i.test(content),
    "Expected monthly restore drills documented",
  );
}

function assertDiskUtilizationAlert(content: string) {
  // GIVEN: Release gates documentation
  // WHEN: Verifying disk utilization alert threshold
  // THEN: Disk alert at 80% is described
  const diskPattern = /disk.*(utilization|usage|alert)/i;
  const thresholdPattern = /80\s*%|80\s*percent/i;
  assert.ok(
    diskPattern.test(content) && thresholdPattern.test(content),
    "Expected disk utilization alert at 80% documented",
  );
}

function assertIoWaitAlert(content: string) {
  // GIVEN: Release gates documentation
  // WHEN: Verifying IO wait alert threshold and duration
  // THEN: IO wait >20% for 5 minutes is described
  const ioPattern = /io\s*wait|i\/o\s*wait/i;
  const thresholdPattern = />\s*20\s*%|>\s*20\s*percent/i;
  const durationPattern = /5\s*minutes?/i;
  assert.ok(
    ioPattern.test(content) && thresholdPattern.test(content) && durationPattern.test(content),
    "Expected IO wait alert >20% for 5 minutes documented",
  );
}

function assertCutoverRunbookReference(content: string) {
  // GIVEN: Release gates documentation
  // WHEN: Verifying cutover runbook references
  // THEN: Migration or cutover runbook is linked/referenced
  const runbookPattern = /cutover|migration/i;
  const filePattern = /CUTOVER\.md|MIGRATION\.md/i;
  assert.ok(
    runbookPattern.test(content) && filePattern.test(content),
    "Expected cutover or migration runbook reference documented",
  );
}

function assertParityChecksReference(content: string) {
  // GIVEN: Release gates documentation
  // WHEN: Verifying parity check references
  // THEN: Parity checks are mentioned
  assert.ok(
    /parity\s*checks?/i.test(content),
    "Expected parity checks reference documented",
  );
}

async function run() {
  assertReleaseGatesFileExists();
  assertReleaseGatesHookedInTestDb();
  assertReleaseGatesHookedInCiWorkflows();
  const content = readReleaseGates();

  assertNightlyBackups(content);
  assertWeeklyFullBackups(content);
  assertMonthlyRestoreDrill(content);
  assertDiskUtilizationAlert(content);
  assertIoWaitAlert(content);
  assertCutoverRunbookReference(content);
  assertParityChecksReference(content);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
