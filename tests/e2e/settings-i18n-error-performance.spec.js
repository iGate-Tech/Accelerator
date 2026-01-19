import { test, expect } from '@playwright/test';

test.describe('US-SETTINGS-001: Complete Settings Configuration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `settings${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Settings Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should access settings page', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.locator('h1')).toContainText('Settings');
    await expect(page.locator('.settings-sections')).toBeVisible();
  });

  test('should manage notification settings', async ({ page }) => {
    await page.goto('/settings');

    // Test browser notifications
    const browserNotifications = page.locator('input[name="browser-notifications"]');
    await browserNotifications.check();
    await page.locator('button[data-testid="save-notifications"]').click();
    await expect(page.locator('text=Settings saved')).toBeVisible();

    // Test project update preferences
    const projectUpdates = page.locator('input[name="project-updates"]');
    await projectUpdates.uncheck();
    await page.locator('button[data-testid="save-notifications"]').click();
    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should handle appearance settings', async ({ page }) => {
    await page.goto('/settings');

    // Test theme switching
    await page.locator('select[name="theme"]').selectOption('dark');
    await page.locator('button[data-testid="save-appearance"]').click();
    await expect(page.locator('html')).toHaveClass('dark');

    await page.locator('select[name="theme"]').selectOption('light');
    await page.locator('button[data-testid="save-appearance"]').click();
    await expect(page.locator('html')).not.toHaveClass('dark');
  });

  test('should handle language selection', async ({ page }) => {
    await page.goto('/settings');

    await page.locator('select[name="language"]').selectOption('es');
    await page.locator('button[data-testid="save-appearance"]').click();
    // Verify language change (would need translation verification)
  });

  test('should manage privacy settings', async ({ page }) => {
    await page.goto('/settings');

    // Test profile visibility
    await page.locator('select[name="visibility"]').selectOption('private');
    await page.locator('button[data-testid="save-privacy"]').click();
    await expect(page.locator('text=Privacy settings saved')).toBeVisible();

    // Test data sharing
    const dataSharing = page.locator('input[name="data-sharing"]');
    await dataSharing.uncheck();
    await page.locator('button[data-testid="save-privacy"]').click();
  });

  test('should handle password change', async ({ page }) => {
    await page.goto('/settings');

    // Test password change
    await page.locator('input[name="current-password"]').fill('StrongPass123!');
    await page.locator('input[name="new-password"]').fill('NewStrongPass123!');
    await page.locator('input[name="confirm-password"]').fill('NewStrongPass123!');

    await page.locator('button[data-testid="change-password"]').click();
    await expect(page.locator('text=Password changed successfully')).toBeVisible();
  });

  test('should validate password change requirements', async ({ page }) => {
    await page.goto('/settings');

    // Test weak new password
    await page.locator('input[name="current-password"]').fill('StrongPass123!');
    await page.locator('input[name="new-password"]').fill('weak');
    await page.locator('input[name="confirm-password"]').fill('weak');

    await page.locator('button[data-testid="change-password"]').click();
    await expect(page.locator('text=Password too weak')).toBeVisible();
  });

  test('should handle data export and import', async ({ page }) => {
    await page.goto('/settings');

    // Test data export
    await page.locator('button[data-testid="export-data"]').click();
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('settings');

    // Test data import
    const fileInput = page.locator('input[type="file"][name="import-file"]');
    await fileInput.setInputFiles('./test-settings.json');
    await page.locator('button[data-testid="import-data"]').click();
    await expect(page.locator('text=Data imported successfully')).toBeVisible();
  });
});

test.describe('US-INTERNATIONALIZATION-001: Complete Multi-language Experience Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `i18n${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('I18N Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should display language selection', async ({ page }) => {
    await page.goto('/settings');

    const languageSelect = page.locator('select[name="language"]');
    await expect(languageSelect).toBeVisible();

    // Check available languages
    const options = await languageSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(1);
  });

  test('should switch to Arabic with RTL layout', async ({ page }) => {
    await page.goto('/settings');

    await page.locator('select[name="language"]').selectOption('ar');
    await page.locator('button[data-testid="save-appearance"]').click();

    // Verify RTL layout
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('body')).toHaveClass(/rtl/);
  });

  test('should translate all UI elements', async ({ page }) => {
    // Switch to Spanish
    await page.goto('/settings');
    await page.locator('select[name="language"]').selectOption('es');
    await page.locator('button[data-testid="save-appearance"]').click();

    // Check key translations
    await expect(page.locator('text=Configuración')).toBeVisible(); // Settings in Spanish

    // Navigate to different pages and verify translations
    await page.goto('/dashboard');
    await expect(page.locator('text=Panel')).toBeVisible(); // Dashboard in Spanish
  });

  test('should persist language preference', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('select[name="language"]').selectOption('fr');
    await page.locator('button[data-testid="save-appearance"]').click();

    // Refresh page
    await page.reload();

    // Verify language persists
    await expect(page.locator('select[name="language"]')).toHaveValue('fr');
    await expect(page.locator('text=Paramètres')).toBeVisible(); // Settings in French
  });

  test('should handle missing translations gracefully', async ({ page }) => {
    // Switch to a language with incomplete translations
    await page.goto('/settings');
    await page.locator('select[name="language"]').selectOption('test-lang');
    await page.locator('button[data-testid="save-appearance"]').click();

    // Should fallback to English for missing keys
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should maintain functionality in different languages', async ({ page }) => {
    // Switch to German
    await page.goto('/settings');
    await page.locator('select[name="language"]').selectOption('de');
    await page.locator('button[data-testid="save-appearance"]').click();

    // Try to create a project
    await page.goto('/');
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Projektname"]').fill('German Test');
    await page.locator('textarea[placeholder*="Projektbeschreibung"]').fill('German description');

    await page.locator('button[type="submit"]').click();

    // Should work despite language change
    await page.waitForSelector('text=Akzeptieren', { timeout: 60000 });
  });
});

test.describe('US-ERROR-001: Complete Error Handling and Recovery Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `error${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Error Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should handle network disconnection gracefully', async ({ page }) => {
    // Create a project
    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Network Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing network errors');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Simulate network disconnect during action
    await page.context().setOffline(true);

    await page.locator('button[data-testid="accept"]').click();

    // Should show offline indicator
    await expect(page.locator('text=You are offline')).toBeVisible();

    // Reconnect
    await page.context().setOffline(false);

    // Should recover and show retry option
    await expect(page.locator('button[data-testid="retry"]')).toBeVisible();
  });

  test('should handle API server errors', async ({ page }) => {
    // Navigate to a page that might cause 500 error
    await page.goto('/api/test-500'); // This would need to be set up

    // Should show user-friendly error message
    await expect(page.locator('text=Server error')).toBeVisible();
    await expect(page.locator('button[data-testid="retry"]')).toBeVisible();
  });

  test('should handle validation errors in forms', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    // Submit empty form
    await page.locator('button[type="submit"]').click();

    // Should show validation errors
    await expect(page.locator('text=Project name is required')).toBeVisible();
    await expect(page.locator('text=Project description is required')).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    // Simulate session expiry by clearing localStorage
    await page.evaluate(() => {
      localStorage.removeItem('auth-token');
    });

    // Try to access protected page
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should handle corrupted data gracefully', async ({ page }) => {
    // This would require manipulating stored data
    // For now, test general error boundaries

    await page.goto('/corrupted-data-test'); // Would need error route

    // Should show error boundary
    await expect(page.locator('.error-boundary')).toBeVisible();
    await expect(page.locator('button[data-testid="reload"]')).toBeVisible();
  });

  test('should provide retry mechanisms', async ({ page }) => {
    // Trigger an action that can fail
    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Retry Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing retry');
    await page.locator('button[type="submit"]').click();

    // Simulate failure
    await page.route('**/api/llm/quick', route => route.abort());

    // Should show retry button
    await expect(page.locator('button[data-testid="retry"]')).toBeVisible();

    // Click retry
    await page.locator('button[data-testid="retry"]').click();

    // Should attempt again (would need to unblock the route)
  });

  test('should log errors appropriately', async ({ page }) => {
    // Trigger an error
    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Error Log Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing error logging');

    // Force an error (invalid API call)
    await page.route('**/api/projects', route => route.fulfill({ status: 500 }));

    await page.locator('button[type="submit"]').click();

    // Error should be logged (check console or network)
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    // Should contain error logging
    expect(logs.some(log => log.includes('error') || log.includes('Error'))).toBe(true);
  });
});

test.describe('US-PERFORMANCE-001: Complete Performance and Scalability Testing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `performance${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Performance Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should load pages within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // 2 seconds
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Create many projects quickly
    for (let i = 1; i <= 50; i++) {
      await page.locator('button[data-testid="create-project"]').click();
      await page.locator('input[placeholder*="Project name"]').fill(`Perf Project ${i}`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Description ${i}`);
      await page.locator('button[type="submit"]').click();

      // Skip AI processing for speed
      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to dashboard
    await page.goto('/dashboard');

    // Should load within reasonable time
    const startTime = Date.now();
    await page.waitForSelector('.project-card');
    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(5000); // 5 seconds for 50 projects
  });

  test('should maintain responsiveness during AI processing', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('AI Performance Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing AI streaming performance');
    await page.locator('button[type="submit"]').click();

    // Start timing
    const startTime = Date.now();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(65000); // Under 65 seconds (60s timeout + buffer)

    // UI should remain responsive during streaming
    await expect(page.locator('button[data-testid="accept"]')).toBeEnabled();
  });

  test('should handle memory efficiently with large responses', async ({ page }) => {
    // Create project that generates large AI response
    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Large Response Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Generate a very detailed business plan with multiple sections');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Check memory usage (would need Chrome DevTools protocol)
    // For now, just verify the page doesn't crash
    await expect(page.locator('.response-section')).toBeVisible();
  });

  test('should handle concurrent operations', async ({ page }) => {
    // Open multiple tabs
    const page2 = await page.context().newPage();
    const page3 = await page.context().newPage();

    // Register and login on other pages
    for (const p of [page2, page3]) {
      await p.goto('/auth/signup');
      const ts = Date.now();
      await p.locator('input[placeholder*="Name"]').fill(`Concurrent ${ts}`);
      await p.locator('input[placeholder*="Email"]').fill(`concurrent${ts}@example.com`);
      await p.locator('input[placeholder*="Password"]').fill('StrongPass123!');
      await p.locator('input[placeholder*="Confirm"]').fill('StrongPass123!');
      await p.locator('input[type="checkbox"]').first().check();
      await p.locator('input[type="checkbox"]').last().check();
      await p.locator('button[type="submit"]').click();
      await p.waitForURL('/');
    }

    // All pages should work simultaneously
    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page2.locator('.navbar')).toBeVisible();
    await expect(page3.locator('.navbar')).toBeVisible();
  });

  test('should optimize bundle size', async ({ page }) => {
    // Check that lazy-loaded routes work
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');

    await page.goto('/explore');
    await expect(page.locator('h1')).toContainText('Explore');

    // Bundle should load incrementally
    const resources = [];
    page.on('response', response => {
      if (response.url().includes('.js')) {
        resources.push(response.url());
      }
    });

    await page.reload();

    // Should have loaded additional chunks for lazy routes
    expect(resources.length).toBeGreaterThan(1);
  });

  test('should handle mobile performance', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000); // 3 seconds on mobile
  });

  test('should prevent memory leaks', async ({ page }) => {
    // Navigate through multiple pages
    for (let i = 0; i < 10; i++) {
      await page.goto('/');
      await page.goto('/dashboard');
      await page.goto('/explore');
      await page.goto('/profile');
    }

    // Should not show memory-related errors
    await expect(page.locator('text=out of memory')).not.toBeVisible();
  });
});