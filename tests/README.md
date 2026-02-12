# VoucherShyft Test Framework

This repository uses **Playwright** for end-to-end testing and API-level acceptance testing.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Install Playwright browsers:

```bash
pnpm exec playwright install --with-deps
```

3. Configure environment variables:

```bash
cp .env.example .env
# then edit BASE_URL and API_URL as needed
```

## Running Tests

```bash
# Run all Playwright tests
pnpm test:e2e

# Run a single test file
pnpm test:e2e -- tests/e2e/example.spec.ts

# Headed mode
pnpm test:e2e -- --headed

# Debug mode
pnpm test:e2e -- --debug
```

## Architecture Overview

- `tests/e2e/` — E2E tests
- `tests/support/fixtures/` — fixture composition + auto-cleanup
- `tests/support/fixtures/factories/` — data factories (faker-based)
- `tests/support/helpers/` — shared helpers

### Fixture Pattern

Fixtures are composed via Playwright’s `extend()` and cleaned up automatically. The canonical entrypoint is:

```
import { test, expect } from '../support/fixtures';
```

## Selector Strategy

Use `data-testid` for all critical UI controls. Avoid brittle CSS or text-only selectors in E2E tests.

## Best Practices

- Network-first: intercept routes **before** navigation or submit actions.
- No hard waits: use deterministic waits (`waitForResponse`, element visibility).
- Keep tests < 300 lines and < 90 seconds execution time.
- Use factories for all test data (no hardcoded IDs or emails).

## CI Integration

- Playwright outputs HTML reports to `playwright-report/`.
- JUnit XML results go to `test-results/results.xml`.
- Failure artifacts (video, trace, screenshot) are retained on failure.

## References

- Playwright Config: `playwright.config.ts`
- Example tests: `tests/e2e/example.spec.ts`
