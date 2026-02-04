import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

function exists(p: string): boolean {
  return fs.existsSync(path.join(root, p));
}

test.describe('Scaffold: monorepo structure', () => {
  test('should include required monorepo directories', async () => {
    // GIVEN: repository root
    // WHEN: checking scaffold directories
    // THEN: expected directories exist
    expect(exists('apps/api')).toBeTruthy();
    expect(exists('apps/web')).toBeTruthy();
    expect(exists('packages/contracts')).toBeTruthy();
    expect(exists('packages/ui')).toBeTruthy();
    expect(exists('infra/docker')).toBeTruthy();
    expect(exists('infra/docker/docker-compose.yml')).toBeTruthy();
    expect(exists('infra/docker/Caddyfile')).toBeTruthy();
  });
});

test.describe('Scaffold: OpenAPI generation', () => {
  test('should define an api:openapi script in package.json', async () => {
    const pkgPath = path.join(root, 'package.json');
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.['api:openapi']).toBeTruthy();
  });
});
