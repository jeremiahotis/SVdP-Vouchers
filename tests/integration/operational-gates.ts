import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const releaseGatesPath = path.join(root, 'docs/RELEASE_GATES.md');

function readReleaseGates(): string {
  assert.ok(fs.existsSync(releaseGatesPath), 'docs/RELEASE_GATES.md is missing');
  return fs.readFileSync(releaseGatesPath, 'utf-8');
}

function expectAll(content: string, required: string[], label: string): void {
  const missing = required.filter((phrase) => !content.includes(phrase));
  assert.deepStrictEqual(
    missing,
    [],
    `${label} missing phrases: ${missing.join(', ')}`
  );
}

const content = readReleaseGates().toLowerCase();

expectAll(
  content,
  ['nightly', '30 days', 'weekly', '12 weeks', 'monthly', 'restore', 'backup'],
  'Backup cadence'
);

expectAll(
  content,
  ['disk', '80%', 'io wait', '20%', '5 minutes'],
  'Alert thresholds'
);

expectAll(
  content,
  ['docs/cutover.md', 'migration.md', 'parity'],
  'References'
);

const workflowDir = path.join(root, '.github/workflows');
const workflowFiles = fs
  .readdirSync(workflowDir)
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));
const combinedWorkflow = workflowFiles
  .map((file) => fs.readFileSync(path.join(workflowDir, file), 'utf-8'))
  .join('\n');
const hasGateCheck = /RELEASE_GATES\.md/.test(combinedWorkflow);

assert.ok(hasGateCheck, 'CI workflow does not reference RELEASE_GATES.md');

console.log('Operational gates checks passed.');
