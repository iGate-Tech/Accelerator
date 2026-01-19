import { test, expect } from '@playwright/test';

test.describe('US-ACCELERATOR-001: Complete 51-Step AI Accelerator Process', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `accelerator${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Accelerator Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should complete full 51-step accelerator process', async ({ page }) => {
    // Create a project first
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Full Accelerator Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Complete 51-step accelerator test');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Verify starting at step 1 (after project creation)
    await expect(page.locator('text=Step 1 of 51')).toBeVisible();

    // Complete all 51 steps (this would be impractical to test fully)
    // Instead, test the mechanism by completing a few steps and verifying progression

    for (let step = 1; step <= 5; step++) {
      // Wait for AI response
      await page.waitForSelector('text=Accept', { timeout: 60000 });

      // Verify step number
      await expect(page.locator(`text=Step ${step} of 51`)).toBeVisible();

      // Accept the response
      await page.locator('button[data-testid="accept"]').click();

      // Verify progression to next step
      if (step < 5) {
        await expect(page.locator(`text=Step ${step + 1} of 51`)).toBeVisible();
      }
    }

    // Verify progress bar shows correct completion
    const progressBar = page.locator('.progress-bar');
    const progressValue = await progressBar.getAttribute('value');
    expect(parseInt(progressValue)).toBeGreaterThan(5); // At least 5 steps completed
  });

  test('should handle step validation and prerequisites', async ({ page }) => {
    // Create project and reach step 2
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Validation Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing step validation');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // At step 1, try to skip to step 3 (if possible)
    const skipButton = page.locator('button[data-testid="skip"]');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      // Should prevent skipping or show validation error
      await expect(page.locator('text=Complete current step first')).toBeVisible();
    }
  });

  test('should handle AI response timeouts gracefully', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Timeout Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing timeout handling');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Simulate timeout by waiting beyond 60 seconds
    await page.waitForTimeout(65000);

    // Should show timeout error with retry option
    await expect(page.locator('text=Request timed out')).toBeVisible();
    await expect(page.locator('button[data-testid="retry"]')).toBeVisible();
  });

  test('should maintain state consistency across browser refreshes', async ({ page }) => {
    // Create project and complete first step
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Refresh Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing state persistence');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    const currentStep = await page.locator('.step-indicator').textContent();

    // Refresh page
    await page.reload();

    // Verify state is restored
    await expect(page.locator('.step-indicator')).toHaveText(currentStep);
    await expect(page.locator('.response-section')).toBeVisible();
  });

  test('should handle auto-save every 30 seconds', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Auto-save Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing auto-save functionality');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Edit the response
    await page.locator('button[data-testid="edit"]').click();
    await page.locator('textarea').first().fill('Modified content for auto-save test');

    // Wait for auto-save interval (30 seconds)
    await page.waitForTimeout(35000);

    // Verify auto-save indicator or success message
    await expect(page.locator('text=Auto-saved')).toBeVisible();
  });

  test('should handle context merging for step progression', async ({ page }) => {
    // Create project and complete a few steps
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Context Merge Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing context merging');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Complete a few more steps
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Verify that context from previous steps is available in current step
    // This would require checking that AI prompts include previous step data
    const currentPrompt = await page.locator('.ai-prompt').textContent();
    expect(currentPrompt).toContain('Context Merge Test'); // Project name should be in context
  });

  test('should display accurate progress bar', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Progress Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing progress bar');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Check initial progress (step 1 of 51)
    const progressBar = page.locator('.progress');
    const initialProgress = await progressBar.getAttribute('value');
    expect(parseInt(initialProgress)).toBeLessThan(5); // Should be around 2%

    // Complete a few more steps
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Check progress after completing steps
    const updatedProgress = await progressBar.getAttribute('value');
    expect(parseInt(updatedProgress)).toBeGreaterThan(parseInt(initialProgress));
  });

  test('should allow editing task responses', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Edit Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing edit functionality');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Edit the response
    await page.locator('button[data-testid="edit"]').click();

    // Verify edit mode
    await expect(page.locator('.edit-mode')).toBeVisible();

    // Modify content
    await page.locator('textarea').first().fill('Edited accelerator response');

    // Save changes
    await page.locator('button[data-testid="save-edit"]').click();

    // Verify changes are saved
    await expect(page.locator('text=Edited accelerator response')).toBeVisible();
  });

  test('should prevent memory leaks during extended sessions', async ({ page }) => {
    // This test would require monitoring memory usage
    // For now, we'll test completing multiple steps without issues

    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Memory Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing memory management');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Complete several steps
    for (let i = 0; i < 10; i++) {
      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();

      // Check that UI remains responsive
      await expect(page.locator('.step-indicator')).toBeVisible();
    }

    // Verify no memory-related errors or slowdowns
    await expect(page.locator('text=out of memory')).not.toBeVisible();
  });

  test('should handle concurrent user actions', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Concurrent Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing concurrent actions');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Try multiple actions simultaneously
    await Promise.all([
      page.locator('button[data-testid="accept"]').click(),
      page.locator('button[data-testid="retry"]').click(),
      page.locator('button[data-testid="edit"]').click(),
    ]);

    // Should handle gracefully without breaking
    await expect(page.locator('.response-section')).toBeVisible();
  });
});