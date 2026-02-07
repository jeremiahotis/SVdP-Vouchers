import { test, expect } from '../support/fixtures';

test.describe('Example Test Suite', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /VoucherShyft/i })).toBeVisible();
  });
});
