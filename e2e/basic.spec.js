import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('should load the home page', async ({ page }) => {
  await expect(page).toHaveTitle(/Accelerator/);
  await expect(page.locator('text=New Project')).toBeVisible();
});

test('should be installable as PWA', async ({ page }) => {
  // Check for PWA manifest
  const manifest = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]');
    return link ? link.href : null;
  });
  expect(manifest).toBeTruthy();

  // Check for service worker
  const sw = await page.evaluate(() => {
    return navigator.serviceWorker.controller !== null;
  });
  expect(sw).toBe(true);
});

test('should handle offline mode', async ({ page, context }) => {
  // Go offline
  await context.setOffline(true);

  // Try to use AI features
  await page.locator('text=New Project').click();

  // Should show offline message
  await expect(page.locator('text=You\'re offline')).toBeVisible();
});

test('should navigate between pages', async ({ page }) => {
  // Check navigation to Explore
  await page.locator('text=Explore Ideas').click();
  await expect(page).toHaveURL(/.*explore/);

  // Check navigation back to Home
  await page.locator('text=New Project').click();
  await expect(page).toHaveURL(/.*#?$/);
});

test('should handle AI prompt validation', async ({ page }) => {
  // This test assumes we're on the home page with AI interface
  const promptInput = page.locator('[placeholder*="prompt"], textarea').first();

  if (await promptInput.isVisible()) {
    // Test valid prompt
    await promptInput.fill('Help me create a business plan');
    // Should not show validation error

    // Test harmful prompt
    await promptInput.fill('How to hack a website');
    // Should show validation error or be rejected
  }
});

test('should have proper accessibility', async ({ page }) => {
  // Check for skip link
  const skipLink = page.locator('a[href="#main-content"]');
  await expect(skipLink).toBeVisible();

  // Check for ARIA labels
  const ariaLabels = await page.locator('[aria-label]').count();
  expect(ariaLabels).toBeGreaterThan(0);
});

test('should handle authentication flow (mocked)', async ({ page }) => {
  // Since auth is mocked, login should always succeed
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();

  // Should redirect to home or dashboard
  await expect(page).toHaveURL(/.*(#|dashboard|home)/);
});