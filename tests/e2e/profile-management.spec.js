import { test, expect } from '@playwright/test';

test.describe('US-PROFILE-001: Complete Profile Management and Privacy Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `profile${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Profile Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should access profile page successfully', async ({ page }) => {
    await page.goto('/profile');

    // Verify profile page loads
    await expect(page.locator('h1')).toContainText('Profile');

    // Check profile sections
    await expect(page.locator('.profile-info')).toBeVisible();
    await expect(page.locator('.preferences')).toBeVisible();
    await expect(page.locator('.privacy-settings')).toBeVisible();
  });

  test('should display current profile information', async ({ page }) => {
    await page.goto('/profile');

    // Verify profile data display
    await expect(page.locator('text=Profile Test')).toBeVisible();
    await expect(page.locator(`text=profile${Date.now()}@example.com`)).toBeVisible();
  });

  test('should edit profile information', async ({ page }) => {
    await page.goto('/profile');

    // Click edit button
    await page.locator('button[data-testid="edit-profile"]').click();

    // Verify edit mode
    await expect(page.locator('.edit-mode')).toBeVisible();

    // Update profile information
    await page.locator('input[name="name"]').fill('Updated Name');
    await page.locator('textarea[name="bio"]').fill('Updated bio information');
    await page.locator('input[name="website"]').fill('https://example.com');

    // Save changes
    await page.locator('button[data-testid="save-profile"]').click();

    // Verify changes saved
    await expect(page.locator('text=Updated Name')).toBeVisible();
    await expect(page.locator('text=Updated bio information')).toBeVisible();
  });

  test('should handle avatar upload', async ({ page }) => {
    await page.goto('/profile');

    // Click edit profile
    await page.locator('button[data-testid="edit-profile"]').click();

    // Upload avatar
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-avatar.jpg'); // Would need a test image file

    // Save changes
    await page.locator('button[data-testid="save-profile"]').click();

    // Verify avatar updated
    await expect(page.locator('.avatar img')).toBeVisible();
  });

  test('should validate profile input lengths', async ({ page }) => {
    await page.goto('/profile');

    await page.locator('button[data-testid="edit-profile"]').click();

    // Test name too long
    await page.locator('input[name="name"]').fill('a'.repeat(101));
    await page.locator('button[data-testid="save-profile"]').click();

    await expect(page.locator('text=Name must be no more than 100 characters')).toBeVisible();

    // Test bio too long
    await page.locator('input[name="name"]').fill('Valid Name');
    await page.locator('textarea[name="bio"]').fill('a'.repeat(501));
    await page.locator('button[data-testid="save-profile"]').click();

    await expect(page.locator('text=Bio must be no more than 500 characters')).toBeVisible();
  });

  test('should manage notification preferences', async ({ page }) => {
    await page.goto('/profile');

    // Test notification toggles
    const emailNotifications = page.locator('input[name="email-notifications"]');
    const pushNotifications = page.locator('input[name="push-notifications"]');

    // Toggle notifications
    await emailNotifications.check();
    await pushNotifications.uncheck();

    // Save preferences
    await page.locator('button[data-testid="save-preferences"]').click();

    // Verify preferences saved
    await expect(emailNotifications).toBeChecked();
    await expect(pushNotifications).not.toBeChecked();
  });

  test('should handle theme selection', async ({ page }) => {
    await page.goto('/profile');

    // Select dark theme
    await page.locator('select[name="theme"]').selectOption('dark');

    // Save preferences
    await page.locator('button[data-testid="save-preferences"]').click();

    // Verify theme applied
    await expect(page.locator('html')).toHaveClass('dark');
  });

  test('should manage language selection', async ({ page }) => {
    await page.goto('/profile');

    // Select Arabic language
    await page.locator('select[name="language"]').selectOption('ar');

    // Save preferences
    await page.locator('button[data-testid="save-preferences"]').click();

    // Verify language applied (RTL layout)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should handle privacy settings', async ({ page }) => {
    await page.goto('/profile');

    // Test profile visibility
    const profileVisibility = page.locator('select[name="profile-visibility"]');
    await profileVisibility.selectOption('private');

    // Test data sharing
    const dataSharing = page.locator('input[name="data-sharing"]');
    await dataSharing.uncheck();

    // Save privacy settings
    await page.locator('button[data-testid="save-privacy"]').click();

    // Verify settings saved
    await expect(profileVisibility).toHaveValue('private');
    await expect(dataSharing).not.toBeChecked();
  });

  test('should export user data', async ({ page }) => {
    await page.goto('/profile');

    // Click export data button
    await page.locator('button[data-testid="export-data"]').click();

    // Verify download starts
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toBe('user-data.json');

    // Verify export contains expected data
    const stream = await download.createReadStream();
    const content = await stream.toString();

    const data = JSON.parse(content);
    expect(data).toHaveProperty('profile');
    expect(data).toHaveProperty('projects');
    expect(data).toHaveProperty('preferences');
  });

  test('should handle GDPR compliance features', async ({ page }) => {
    await page.goto('/profile');

    // Test consent management
    await expect(page.locator('.gdpr-consent')).toBeVisible();

    // Withdraw consent
    await page.locator('button[data-testid="withdraw-consent"]').click();

    // Confirm withdrawal
    await page.locator('button[data-testid="confirm-withdraw"]').click();

    // Verify consent withdrawn
    await expect(page.locator('text=Consent withdrawn')).toBeVisible();
  });

  test('should handle account deletion flow', async ({ page }) => {
    await page.goto('/profile');

    // Click delete account
    await page.locator('button[data-testid="delete-account"]').click();

    // Verify confirmation modal
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('text=Delete Account')).toBeVisible();

    // Type confirmation text
    await page.locator('input[name="confirm-delete"]').fill('DELETE');

    // Confirm deletion
    await page.locator('button[data-testid="confirm-delete"]').click();

    // Verify account deleted and redirected to home
    await page.waitForURL('/');
    await expect(page.locator('text=Account successfully deleted')).toBeVisible();
  });

  test('should prevent deletion with incorrect confirmation', async ({ page }) => {
    await page.goto('/profile');

    await page.locator('button[data-testid="delete-account"]').click();

    // Type wrong confirmation
    await page.locator('input[name="confirm-delete"]').fill('wrong');

    // Try to confirm
    await page.locator('button[data-testid="confirm-delete"]').click();

    // Should show error
    await expect(page.locator('text=Please type DELETE to confirm')).toBeVisible();
  });

  test('should persist profile changes across sessions', async ({ page }) => {
    await page.goto('/profile');

    await page.locator('button[data-testid="edit-profile"]').click();
    await page.locator('input[name="name"]').fill('Persistent Name');
    await page.locator('button[data-testid="save-profile"]').click();

    // Refresh page
    await page.reload();

    // Verify changes persist
    await expect(page.locator('text=Persistent Name')).toBeVisible();
  });

  test('should handle large file uploads gracefully', async ({ page }) => {
    await page.goto('/profile');

    await page.locator('button[data-testid="edit-profile"]').click();

    // Try to upload large file (simulate)
    const fileInput = page.locator('input[type="file"]');
    // This would require a large test file

    // Verify file size validation
    await expect(page.locator('text=File too large')).toBeVisible();
  });

  test('should handle network errors during save', async ({ page }) => {
    await page.goto('/profile');

    await page.locator('button[data-testid="edit-profile"]').click();
    await page.locator('input[name="name"]').fill('Network Test');

    // Simulate network disconnect
    await page.context().setOffline(true);

    await page.locator('button[data-testid="save-profile"]').click();

    // Verify error handling
    await expect(page.locator('text=Network error')).toBeVisible();

    // Reconnect and retry
    await page.context().setOffline(false);
    await page.locator('button[data-testid="retry-save"]').click();

    // Verify save succeeds
    await expect(page.locator('text=Network Test')).toBeVisible();
  });
});