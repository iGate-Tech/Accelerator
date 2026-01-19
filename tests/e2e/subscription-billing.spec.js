import { test, expect } from '@playwright/test';

test.describe('US-SUBSCRIPTION-001: Complete Subscription Upgrade and Billing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `subscription${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Subscription Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should display subscription packages page', async ({ page }) => {
    await page.goto('/packages');

    // Verify packages page loads
    await expect(page.locator('h1')).toContainText('Subscription Plans');

    // Check plan cards
    await expect(page.locator('.plan-card')).toHaveCount(3); // Free, Pro, Enterprise

    // Verify plan details
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should show current plan highlighting', async ({ page }) => {
    await page.goto('/packages');

    // Verify free plan is highlighted as current
    await expect(page.locator('.plan-card.free')).toHaveClass(/current/);
    await expect(page.locator('.plan-card.free .badge')).toContainText('Current Plan');
  });

  test('should upgrade to Pro plan', async ({ page }) => {
    await page.goto('/packages');

    // Click upgrade on Pro plan
    await page.locator('.plan-card.pro button').click();

    // Verify upgrade confirmation modal
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('text=Upgrade to Pro')).toBeVisible();

    // Confirm upgrade
    await page.locator('button[data-testid="confirm-upgrade"]').click();

    // Verify success message
    await expect(page.locator('text=Successfully upgraded to Pro')).toBeVisible();

    // Verify current plan changed
    await expect(page.locator('.plan-card.pro')).toHaveClass(/current/);
  });

  test('should handle credit balance updates on upgrade', async ({ page }) => {
    // Check initial credits (50)
    await expect(page.locator('text=50 credits')).toBeVisible();

    // Upgrade to Pro
    await page.goto('/packages');
    await page.locator('.plan-card.pro button').click();
    await page.locator('button[data-testid="confirm-upgrade"]').click();

    // Verify credits increased (Pro plan gives 500 credits)
    await expect(page.locator('text=550 credits')).toBeVisible();
  });

  test('should display billing page with current plan', async ({ page }) => {
    await page.goto('/billing');

    // Verify billing page loads
    await expect(page.locator('h1')).toContainText('Billing');

    // Check current plan display
    await expect(page.locator('text=Current Plan: Free')).toBeVisible();

    // Check billing overview cards
    await expect(page.locator('.billing-overview')).toBeVisible();
  });

  test('should show billing history', async ({ page }) => {
    // Upgrade to create billing history
    await page.goto('/packages');
    await page.locator('.plan-card.pro button').click();
    await page.locator('button[data-testid="confirm-upgrade"]').click();

    // Go to billing page
    await page.goto('/billing');

    // Verify billing history
    await expect(page.locator('.billing-history')).toBeVisible();
    await expect(page.locator('text=Pro Plan Upgrade')).toBeVisible();
  });

  test('should handle payment method section', async ({ page }) => {
    await page.goto('/billing');

    // Check payment method section
    await expect(page.locator('.payment-method')).toBeVisible();

    // Test adding payment method
    await page.locator('button[data-testid="add-payment"]').click();

    // Verify payment form appears
    await expect(page.locator('.payment-form')).toBeVisible();

    // Fill payment details
    await page.locator('input[name="card-number"]').fill('4111111111111111');
    await page.locator('input[name="expiry"]').fill('12/25');
    await page.locator('input[name="cvv"]').fill('123');

    // Submit payment method
    await page.locator('button[data-testid="save-payment"]').click();

    // Verify payment method added
    await expect(page.locator('text=**** **** **** 1111')).toBeVisible();
  });

  test('should calculate billing cycle dates correctly', async ({ page }) => {
    // Upgrade to Pro
    await page.goto('/packages');
    await page.locator('.plan-card.pro button').click();
    await page.locator('button[data-testid="confirm-upgrade"]').click();

    // Go to billing
    await page.goto('/billing');

    // Check next billing date calculation
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const expectedDate = nextBillingDate.toLocaleDateString();
    await expect(page.locator('.next-billing')).toContainText(expectedDate);
  });

  test('should handle subscription cancellation', async ({ page }) => {
    // Upgrade first
    await page.goto('/packages');
    await page.locator('.plan-card.pro button').click();
    await page.locator('button[data-testid="confirm-upgrade"]').click();

    // Go to billing
    await page.goto('/billing');

    // Cancel subscription
    await page.locator('button[data-testid="cancel-subscription"]').click();

    // Confirm cancellation
    await page.locator('button[data-testid="confirm-cancel"]').click();

    // Verify cancellation
    await expect(page.locator('text=Subscription cancelled')).toBeVisible();
    await expect(page.locator('text=Current Plan: Free')).toBeVisible();
  });

  test('should handle failed payment processing', async ({ page }) => {
    await page.goto('/packages');

    // Attempt upgrade with invalid payment
    await page.locator('.plan-card.pro button').click();

    // In payment modal, enter invalid card
    await page.locator('input[name="card-number"]').fill('4000000000000002'); // Stripe test card for decline
    await page.locator('input[name="expiry"]').fill('12/25');
    await page.locator('input[name="cvv"]').fill('123');

    await page.locator('button[data-testid="confirm-payment"]').click();

    // Verify payment failure
    await expect(page.locator('text=Payment failed')).toBeVisible();
    await expect(page.locator('text=Your card was declined')).toBeVisible();
  });

  test('should prevent downgrade during billing cycle', async ({ page }) => {
    // Upgrade to Pro
    await page.goto('/packages');
    await page.locator('.plan-card.pro button').click();
    await page.locator('button[data-testid="confirm-upgrade"]').click();

    // Try to downgrade immediately
    await page.locator('.plan-card.free button').click();

    // Should show billing cycle warning
    await expect(page.locator('text=Cannot downgrade during current billing cycle')).toBeVisible();
  });

  test('should handle multiple upgrade attempts', async ({ page }) => {
    await page.goto('/packages');

    // Attempt multiple upgrades to Pro
    for (let i = 0; i < 3; i++) {
      await page.locator('.plan-card.pro button').click();
      await page.locator('button[data-testid="confirm-upgrade"]').click();
    }

    // Should handle gracefully without errors
    await expect(page.locator('text=Already on Pro plan')).toBeVisible();
  });
});