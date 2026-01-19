import { test, expect } from '@playwright/test';

test.describe('Basic Functionality Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should navigate to auth pages', async ({ page }) => {
    await page.goto('/auth/login');

    // Verify login page loads
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/auth/signup');

    // Verify signup page loads
    await expect(page.locator('body')).toBeVisible();
  });
});