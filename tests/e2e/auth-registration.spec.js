import { test, expect } from '@playwright/test';

test.describe('US-AUTH-001: Complete User Registration and Onboarding Flow', () => {
  test('should complete full registration process', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/auth/signup');

    // Set language to English after page loads
    await page.evaluate(() => {
      localStorage.setItem('lang', 'en');
      document.documentElement.setAttribute('lang', 'en');
      document.documentElement.setAttribute('dir', 'ltr');
    });

    // Reload to apply language change
    await page.reload();

    // Verify signup form elements are present
    await expect(page.locator('h2')).toBeVisible(); // Account creation heading
    await expect(page.locator('input[type="text"]')).toBeVisible(); // Name field
    await expect(page.locator('input[type="email"]')).toBeVisible(); // Email field
    await expect(page.locator('input[type="password"]')).toHaveCount(2); // Password fields
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(2); // Terms and Privacy checkboxes

    // Fill out the registration form
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Test User');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    // Check terms and privacy checkboxes
    await page.locator('input[type="checkbox"]').first().check(); // Terms of Service
    await page.locator('input[type="checkbox"]').last().check(); // Privacy Policy

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Verify successful registration and redirection
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');

    // Verify user is logged in (check for dashboard elements or user menu)
    await expect(page.locator('.navbar')).toBeVisible();

    // Check for welcome notifications or credits
    // This might require checking API calls or UI elements
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/auth/signup');

    // Try to submit without filling fields
    await page.locator('button[type="submit"]').click();

    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/signup');

    // Fill form with weak password
    await page.locator('input[placeholder*="Name"]').fill('Test User');
    await page.locator('input[placeholder*="Email"]').fill('test@example.com');
    await page.locator('input[placeholder*="Password"]').fill('weak');
    await page.locator('input[placeholder*="Confirm"]').fill('weak');

    // Check terms checkboxes
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Verify password strength error
    await expect(page.locator('text=Password too weak')).toBeVisible();
  });

  test('should require GDPR consent', async ({ page }) => {
    await page.goto('/auth/signup');

    // Fill form but don't check consent checkboxes
    await page.locator('input[placeholder*="Name"]').fill('Test User');
    await page.locator('input[placeholder*="Email"]').fill('test@example.com');
    await page.locator('input[placeholder*="Password"]').fill('StrongPass123!');
    await page.locator('input[placeholder*="Confirm"]').fill('StrongPass123!');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Verify consent error
    await expect(page.locator('text=Please agree to the Terms of Service')).toBeVisible();
  });

  test('should handle duplicate email registration', async ({ page }) => {
    // First register a user
    await page.goto('/auth/signup');

    const testEmail = 'duplicate@example.com';

    await page.locator('input[placeholder*="Name"]').fill('Test User');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill('StrongPass123!');
    await page.locator('input[placeholder*="Confirm"]').fill('StrongPass123!');

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    // Wait for registration to complete
    await page.waitForURL('/');

    // Logout (assuming there's a logout button)
    await page.locator('button[aria-label*="logout"]').click();

    // Try to register again with same email
    await page.goto('/auth/signup');

    await page.locator('input[placeholder*="Name"]').fill('Another User');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill('StrongPass123!');
    await page.locator('input[placeholder*="Confirm"]').fill('StrongPass123!');

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    // Verify duplicate email error
    await expect(page.locator('text=Email already exists')).toBeVisible();
  });

  test('should award welcome credits on registration', async ({ page }) => {
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `credits${timestamp}@example.com`;

    await page.locator('input[placeholder*="Name"]').fill('Credits Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill('StrongPass123!');
    await page.locator('input[placeholder*="Confirm"]').fill('StrongPass123!');

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');

    // Check credits balance (assuming it's displayed somewhere)
    await expect(page.locator('text=50 credits')).toBeVisible();
  });

  test('should create welcome notifications', async ({ page }) => {
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `notify${timestamp}@example.com`;

    await page.locator('input[placeholder*="Name"]').fill('Notify Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill('StrongPass123!');
    await page.locator('input[placeholder*="Confirm"]').fill('StrongPass123!');

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');

    // Check for notification bell or notification count
    await expect(page.locator('[data-testid="notifications"]')).toBeVisible();
  });

  test('should redirect authenticated users away from signup', async ({ page }) => {
    // First register and login
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `redirect${timestamp}@example.com`;

    await page.locator('input[placeholder*="Name"]').fill('Redirect Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill('StrongPass123!');
    await page.locator('input[placeholder*="Confirm"]').fill('StrongPass123!');

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');

    // Try to access signup page again
    await page.goto('/auth/signup');

    // Should redirect to home
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });
});