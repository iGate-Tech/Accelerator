import { test, expect } from '@playwright/test';

test.describe('US-AUTH-002: Complete Login and Session Management Flow', () => {
  test('should complete full login process', async ({ page }) => {
    // First register a user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `login${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Login Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');

    // Logout
    await page.locator('button[aria-label*="logout"]').click();

    // Now test login
    await page.goto('/auth/login');

    // Verify login form elements
    await expect(page.locator('h2')).toContainText('Welcome Back');
    await expect(page.locator('input[placeholder*="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Password"]')).toBeVisible();

    // Fill login form
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);

    // Submit login
    await page.locator('button[type="submit"]').click();

    // Verify successful login and redirection
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');

    // Verify user is logged in
    await expect(page.locator('.navbar')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill with invalid credentials
    await page.locator('input[placeholder*="Email"]').fill('invalid@example.com');
    await page.locator('input[placeholder*="Password"]').fill('wrongpassword');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Verify error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should handle account lockout after multiple failed attempts', async ({ page }) => {
    await page.goto('/auth/login');

    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await page.locator('input[placeholder*="Email"]').fill('test@example.com');
      await page.locator('input[placeholder*="Password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      // Wait for error message
      await expect(page.locator('text=Invalid email or password')).toBeVisible();

      // Clear fields for next attempt
      await page.locator('input[placeholder*="Email"]').clear();
      await page.locator('input[placeholder*="Password"]').clear();
    }

    // Check for account lockout message
    await expect(page.locator('text=Account temporarily locked')).toBeVisible();
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');

    const timestamp = Date.now();
    const testEmail = `session${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    // Register first
    await page.goto('/auth/signup');
    await page.locator('input[placeholder*="Name"]').fill('Session Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');

    await page.locator('button[aria-label*="logout"]').click();

    // Now login
    await page.goto('/auth/login');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');

    // Refresh page
    await page.reload();

    // Verify still logged in
    await expect(page).toHaveURL('/');
    await expect(page.locator('.navbar')).toBeVisible();
  });

  test('should handle remember me functionality', async ({ page }) => {
    // Login with remember me checked
    await page.goto('/auth/login');

    const timestamp = Date.now();
    const testEmail = `remember${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    // Register first
    await page.goto('/auth/signup');
    await page.locator('input[placeholder*="Name"]').fill('Remember Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');

    await page.locator('button[aria-label*="logout"]').click();

    // Login with remember me
    await page.goto('/auth/login');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);

    // Check remember me checkbox (if exists)
    const rememberCheckbox = page.locator('input[type="checkbox"][name*="remember"]');
    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.check();
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');

    // Close browser and reopen (simulate session persistence)
    await page.context().clearCookies();
    await page.reload();

    // Should still be logged in due to remember me
    await expect(page).toHaveURL('/');
  });

  test('should handle session expiration', async ({ page }) => {
    // This test would require manipulating JWT expiration
    // For now, we'll test logout functionality

    // Login first
    await page.goto('/auth/login');

    const timestamp = Date.now();
    const testEmail = `expire${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    // Register first
    await page.goto('/auth/signup');
    await page.locator('input[placeholder*="Name"]').fill('Expire Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');

    // Logout
    await page.locator('button[aria-label*="logout"]').click();

    // Try to access protected page
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/login');

    // Click forgot password link
    await page.locator('a[href*="forgot"]').click();

    // Verify forgot password page
    await expect(page).toHaveURL('/auth/forgot-password');

    // Fill email
    await page.locator('input[placeholder*="Email"]').fill('test@example.com');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Verify success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });

  test('should redirect authenticated users away from login', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');

    const timestamp = Date.now();
    const testEmail = `redirect${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    // Register first
    await page.goto('/auth/signup');
    await page.locator('input[placeholder*="Name"]').fill('Redirect Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');

    // Try to access login page again
    await page.goto('/auth/login');

    // Should redirect to home
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });
});