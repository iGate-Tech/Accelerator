import { test, expect } from '@playwright/test';

test.describe('US-DASHBOARD-001: Complete Dashboard Analytics and Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `dashboard${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Dashboard Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should display comprehensive analytics on dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify dashboard loads
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Check analytics cards
    await expect(page.locator('.stats-card')).toHaveCount(4); // Projects, Completion, Credits, Time

    // Verify statistics are displayed
    await expect(page.locator('text=Total Projects')).toBeVisible();
    await expect(page.locator('text=Average Completion')).toBeVisible();
    await expect(page.locator('text=Credits Remaining')).toBeVisible();
    await expect(page.locator('text=Time Invested')).toBeVisible();
  });

  test('should display project list with correct information', async ({ page }) => {
    // Create a few projects first
    for (let i = 1; i <= 3; i++) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(`Dashboard Project ${i}`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Description for dashboard project ${i}`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to dashboard
    await page.goto('/dashboard');

    // Verify projects are listed
    await expect(page.locator('.project-card')).toHaveCount(3);

    // Check project information display
    await expect(page.locator('text=Dashboard Project 1')).toBeVisible();
    await expect(page.locator('text=Dashboard Project 2')).toBeVisible();
    await expect(page.locator('text=Dashboard Project 3')).toBeVisible();
  });

  test('should show accurate completion percentages', async ({ page }) => {
    // Create a project and complete some steps
    await page.goto('/');
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Completion Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing completion percentage');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Complete a few more steps
    for (let i = 0; i < 10; i++) {
      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to dashboard
    await page.goto('/dashboard');

    // Check completion percentage (should be around 10/51 ≈ 20%)
    const completionText = await page.locator('.completion-percentage').textContent();
    const percentage = parseInt(completionText.replace('%', ''));
    expect(percentage).toBeGreaterThan(15);
    expect(percentage).toBeLessThan(25);
  });

  test('should calculate credit usage correctly', async ({ page }) => {
    // Create multiple projects
    const projectCount = 5;
    for (let i = 1; i <= projectCount; i++) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(`Credit Project ${i}`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Description ${i}`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to dashboard
    await page.goto('/dashboard');

    // Verify credits used (5 projects × 10 credits each = 50 credits)
    await expect(page.locator('text=0 credits')).toBeVisible(); // Started with 50, used 50
  });

  test('should display activity feed with recent actions', async ({ page }) => {
    // Create a project to generate activity
    await page.goto('/');
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Activity Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing activity feed');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Go to dashboard
    await page.goto('/dashboard');

    // Check activity feed
    await expect(page.locator('.activity-feed')).toBeVisible();
    await expect(page.locator('text=Project created')).toBeVisible();
    await expect(page.locator('text=Step completed')).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Go to dashboard without creating projects
    await page.goto('/dashboard');

    // Verify empty state messaging
    await expect(page.locator('text=No projects yet')).toBeVisible();
    await expect(page.locator('text=Create your first project')).toBeVisible();
  });

  test('should navigate to projects from dashboard', async ({ page }) => {
    // Create a project
    await page.goto('/');
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Navigation Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing navigation');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Go to dashboard
    await page.goto('/dashboard');

    // Click on project card
    await page.locator('.project-card').first().click();

    // Verify navigation to project
    await expect(page.locator('text=Navigation Test')).toBeVisible();
  });

  test('should sort projects correctly', async ({ page }) => {
    // Create projects with different creation times
    const projectNames = ['Z Project', 'A Project', 'M Project'];

    for (const name of projectNames) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(name);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Description for ${name}`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to dashboard
    await page.goto('/dashboard');

    // Test alphabetical sorting
    const projectCards = page.locator('.project-card');
    await expect(projectCards.first()).toContainText('A Project');
  });

  test('should handle large dataset performance', async ({ page }) => {
    // This test would require creating many projects
    // For now, we'll test with a reasonable number

    const projectCount = 20;

    for (let i = 1; i <= projectCount; i++) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(`Performance Project ${i}`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Description ${i}`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to dashboard
    await page.goto('/dashboard');

    // Verify all projects load without performance issues
    await expect(page.locator('.project-card')).toHaveCount(projectCount);

    // Verify page remains responsive
    await page.locator('.project-card').first().click();
    await expect(page.locator('.project-detail')).toBeVisible();
  });

  test('should handle mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

    // Create a project
    await page.goto('/');
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Mobile Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing mobile layout');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Go to dashboard
    await page.goto('/dashboard');

    // Verify mobile layout
    await expect(page.locator('.mobile-stats')).toBeVisible();
    await expect(page.locator('.mobile-project-list')).toBeVisible();
  });
});