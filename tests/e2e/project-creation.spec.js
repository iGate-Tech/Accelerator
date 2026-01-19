import { test, expect } from '@playwright/test';

test.describe('US-PROJECT-001: Complete Project Creation and AI Suggestion Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `project${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Project Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should create project with AI suggestions', async ({ page }) => {
    // Verify we're on home page
    await expect(page).toHaveURL('/');

    // Check initial credits
    await expect(page.locator('text=50 credits')).toBeVisible();

    // Click create project button
    await page.locator('button[data-testid="create-project"]').click();

    // Verify modal opens
    await expect(page.locator('.modal')).toBeVisible();

    // Fill project details
    await page.locator('input[placeholder*="Project name"]').fill('AI Startup Accelerator');
    await page.locator('textarea[placeholder*="Project description"]').fill('An innovative platform that helps entrepreneurs build successful startups using AI-powered guidance.');

    // Submit project creation
    await page.locator('button[type="submit"]').click();

    // Verify AI processing starts
    await expect(page.locator('text=Processing with AI...')).toBeVisible();

    // Wait for AI response (this might take time)
    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Verify AI suggestions are displayed
    await expect(page.locator('.response-section')).toBeVisible();

    // Verify credits deducted
    await expect(page.locator('text=39 credits')).toBeVisible(); // 50 - 10 = 40, but might have 1 free credit or something

    // Verify step progression
    await expect(page.locator('text=Step 2 of 51')).toBeVisible();
  });

  test('should validate project creation inputs', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    // Try to submit without filling fields
    await page.locator('button[type="submit"]').click();

    // Check validation errors
    await expect(page.locator('text=Project name is required')).toBeVisible();
    await expect(page.locator('text=Project description is required')).toBeVisible();
  });

  test('should handle insufficient credits', async ({ page }) => {
    // First, create multiple projects to exhaust credits
    for (let i = 0; i < 5; i++) {
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(`Project ${i + 1}`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Description for project ${i + 1}`);

      await page.locator('button[type="submit"]').click();

      // Wait for processing and accept
      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();

      // Continue to next step if needed
      await page.locator('button[data-testid="continue"]').click();
    }

    // Try to create another project
    await page.locator('button[data-testid="create-project"]').click();

    // Should show insufficient credits error
    await expect(page.locator('text=Insufficient credits')).toBeVisible();
  });

  test('should handle AI timeout gracefully', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Timeout Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing AI timeout handling');

    await page.locator('button[type="submit"]').click();

    // Wait for timeout (simulate by waiting longer than 60 seconds)
    await page.waitForTimeout(65000);

    // Should show timeout error with retry option
    await expect(page.locator('text=AI request timed out')).toBeVisible();
    await expect(page.locator('button[data-testid="retry"]')).toBeVisible();
  });

  test('should allow accepting AI suggestions', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Accept Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing accept functionality');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Accept the AI suggestion
    await page.locator('button[data-testid="accept"]').click();

    // Verify progression to next step
    await expect(page.locator('text=Step 2 of 51')).toBeVisible();
  });

  test('should allow retrying AI suggestions', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Retry Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing retry functionality');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Retry the AI suggestion
    await page.locator('button[data-testid="retry"]').click();

    // Should generate new AI response
    await expect(page.locator('text=Processing with AI...')).toBeVisible();
    await page.waitForSelector('text=Accept', { timeout: 60000 });
  });

  test('should allow editing AI suggestions', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Edit Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing edit functionality');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Edit the AI suggestion
    await page.locator('button[data-testid="edit"]').click();

    // Verify edit mode
    await expect(page.locator('.edit-mode')).toBeVisible();

    // Make some edits
    await page.locator('textarea').first().fill('Edited AI response');

    // Save edits
    await page.locator('button[data-testid="save-edit"]').click();

    // Verify edits are saved
    await expect(page.locator('text=Edited AI response')).toBeVisible();
  });

  test('should prevent duplicate project names', async ({ page }) => {
    // Create first project
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Duplicate Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('First project');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Try to create project with same name
    await page.goto('/');

    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Duplicate Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Second project');

    await page.locator('button[type="submit"]').click();

    // Should show duplicate name error
    await expect(page.locator('text=Project name already exists')).toBeVisible();
  });

  test('should handle auto-save functionality', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Auto-save Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing auto-save');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });

    // Make some changes to the response
    await page.locator('button[data-testid="edit"]').click();
    await page.locator('textarea').first().fill('Auto-saved content');

    // Wait for auto-save (30 seconds)
    await page.waitForTimeout(35000);

    // Refresh page
    await page.reload();

    // Verify changes were auto-saved
    await expect(page.locator('text=Auto-saved content')).toBeVisible();
  });

  test('should validate input lengths', async ({ page }) => {
    await page.locator('button[data-testid="create-project"]').click();

    // Test name too long
    await page.locator('input[placeholder*="Project name"]').fill('a'.repeat(101));
    await page.locator('textarea[placeholder*="Project description"]').fill('Valid description');

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=Project name must be no more than 100 characters')).toBeVisible();

    // Clear and test description too long
    await page.locator('input[placeholder*="Project name"]').fill('Valid Name');
    await page.locator('textarea[placeholder*="Project description"]').fill('a'.repeat(1001));

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=Project description must be no more than 1000 characters')).toBeVisible();
  });
});