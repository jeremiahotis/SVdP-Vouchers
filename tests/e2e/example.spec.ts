import { test, expect } from '../support/fixtures';

test.describe('Example Test Suite', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VoucherShyft/i);
  });

  test('should create user data via factory (placeholder)', async ({ page, userFactory }) => {
    const user = userFactory.createUser();

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.password);
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
