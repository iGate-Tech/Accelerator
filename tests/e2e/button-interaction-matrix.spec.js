import { test, expect } from '@playwright/test';

test.describe('BUTTON INTERACTION MATRIX - ALL POSSIBLE COMBINATIONS', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login test user
    await page.goto('/auth/signup');
    const timestamp = Date.now();
    const testEmail = `button-test-${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Button Test User');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');
  });

  test('should test all 4-button interaction matrix combinations', async ({ page }) => {
    console.log('🎯 Testing ALL POSSIBLE 4-BUTTON INTERACTION COMBINATIONS');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('4-Button Matrix Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing all possible button combinations');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // Define button selectors
    const acceptBtn = page.locator('button[data-testid="accept"]');
    const editBtn = page.locator('button[data-testid="edit"]');
    const retryBtn = page.locator('button[data-testid="retry"]');
    const saveBtn = page.locator('button[data-testid="save-edit"]');

    // === TEST 1: ACCEPT -> EDIT -> SAVE -> ACCEPT ===
    console.log('🔄 Testing: Accept → Edit → Save → Accept');

    await acceptBtn.click();
    await page.waitForSelector('text=Accept', { timeout: 5000 });

    await editBtn.click();
    await page.locator('textarea').first().fill('Edited after accept');
    await saveBtn.click();

    await page.waitForSelector('text=Accept', { timeout: 5000 });
    await acceptBtn.click();

    await expect(page.locator('text=Step 2 of 51')).toBeVisible();

    // === TEST 2: ACCEPT -> RETRY -> ACCEPT ===
    console.log('🔄 Testing: Accept → Retry → Accept');

    await page.waitForSelector('text=Accept', { timeout: 5000 });
    await acceptBtn.click();

    await page.waitForSelector('text=Accept', { timeout: 5000 });
    await retryBtn.click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });
    await acceptBtn.click();

    // === TEST 3: EDIT -> SAVE -> RETRY -> EDIT -> CANCEL ===
    console.log('🔄 Testing: Edit → Save → Retry → Edit → Cancel');

    await page.waitForSelector('text=Accept', { timeout: 5000 });
    await editBtn.click();

    await page.locator('textarea').first().fill('Save test content');
    await saveBtn.click();

    await retryBtn.click();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    await editBtn.click();
    await page.locator('textarea').first().fill('Will cancel this edit');
    await page.locator('button[data-testid="cancel-edit"]').click();

    // Should revert to non-edit state
    await expect(page.locator('.edit-mode')).not.toBeVisible();
    await expect(page.locator('text=Will cancel this edit')).not.toBeVisible();

    // === TEST 4: RETRY -> EDIT -> RETRY (interrupt edit) ===
    console.log('🔄 Testing: Retry → Edit → Retry (interrupt)');

    await retryBtn.click();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    await editBtn.click();
    await page.locator('textarea').first().fill('Interrupted edit');

    // Retry while in edit mode
    await retryBtn.click();

    // Should exit edit mode and retry
    await expect(page.locator('.edit-mode')).not.toBeVisible();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === TEST 5: ACCEPT -> EDIT -> SAVE -> EDIT -> SAVE ===
    console.log('🔄 Testing: Accept → Edit → Save → Edit → Save');

    await acceptBtn.click();
    await page.waitForSelector('text=Accept', { timeout: 5000 });

    await editBtn.click();
    await page.locator('textarea').first().fill('First edit');
    await saveBtn.click();

    await editBtn.click();
    await page.locator('textarea').first().fill('Second edit');
    await saveBtn.click();

    await expect(page.locator('text=Second edit')).toBeVisible();
  });

  test('should test button state persistence across interruptions', async ({ page }) => {
    console.log('💾 Testing button state persistence');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Persistence Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing state persistence');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // Enter edit mode
    await page.locator('button[data-testid="edit"]').click();
    await page.locator('textarea').first().fill('Unsaved edit content');

    // Refresh page
    await page.reload();

    // Should exit edit mode and not save unsaved changes
    await expect(page.locator('.edit-mode')).not.toBeVisible();
    await expect(page.locator('text=Unsaved edit content')).not.toBeVisible();
    await expect(page.locator('button[data-testid="accept"]')).toBeVisible();

    // Test with saved changes
    await page.locator('button[data-testid="edit"]').click();
    await page.locator('textarea').first().fill('Saved edit content');
    await page.locator('button[data-testid="save-edit"]').click();

    await page.reload();

    // Saved changes should persist
    await expect(page.locator('text=Saved edit content')).toBeVisible();
  });

  test('should test button accessibility and keyboard shortcuts', async ({ page }) => {
    console.log('⌨️ Testing button accessibility and keyboard shortcuts');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Keyboard Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing keyboard navigation');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // Test Tab navigation between buttons
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('accept');

    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('edit');

    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('retry');

    // Test Enter key activation
    await page.keyboard.press('Enter'); // Should activate retry
    await expect(page.locator('text=Processing')).toBeVisible();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // Test Space key activation
    await page.keyboard.press('Tab'); // Focus accept button
    await page.keyboard.press('Space'); // Should activate accept
    await page.waitForSelector('text=Step 2 of 51', { timeout: 5000 });
  });

  test('should test button visual states and feedback', async ({ page }) => {
    console.log('👁️ Testing button visual states and feedback');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Visual State Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing visual button states');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    const acceptBtn = page.locator('button[data-testid="accept"]');

    // Test default state
    await expect(acceptBtn).toHaveCSS('opacity', '1');
    await expect(acceptBtn).not.toHaveClass(/loading|disabled/);

    // Test hover state
    await acceptBtn.hover();
    await expect(acceptBtn).toHaveCSS('transform', /scale|brightness/);

    // Test focus state
    await acceptBtn.focus();
    await expect(acceptBtn).toHaveCSS('outline', /solid|dashed/);

    // Test loading state
    await page.locator('button[data-testid="retry"]').click();
    await expect(acceptBtn).toHaveClass(/disabled|loading/);
    await expect(acceptBtn).toHaveCSS('pointer-events', 'none');

    await page.waitForSelector('button[data-testid="accept"]:not(.disabled)', { timeout: 10000 });

    // Test success feedback
    await acceptBtn.click();
    await expect(page.locator('.success-message, .toast-success')).toBeVisible();
  });
});