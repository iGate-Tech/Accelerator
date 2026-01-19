import { test, expect } from '@playwright/test';

test.describe('US-EXPLORE-001: Complete Project Discovery and Voting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/auth/signup');

    const timestamp = Date.now();
    const testEmail = `explore${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Explore Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="checkbox"]').last().check();

    await page.locator('button[type="submit"]').click();

    await page.waitForURL('/');
  });

  test('should access explore page successfully', async ({ page }) => {
    await page.goto('/explore');

    // Verify explore page loads
    await expect(page.locator('h1')).toContainText('Explore');

    // Check search and filter controls
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible(); // Status filter

    // Check project grid
    await expect(page.locator('.project-grid')).toBeVisible();
  });

  test('should display public projects', async ({ page }) => {
    // First, create some public projects
    for (let i = 1; i <= 3; i++) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(`Public Project ${i}`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Public description ${i}`);

      // Make project public (assuming there's a checkbox)
      const publicCheckbox = page.locator('input[type="checkbox"][name*="public"]');
      if (await publicCheckbox.isVisible()) {
        await publicCheckbox.check();
      }

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to explore page
    await page.goto('/explore');

    // Verify public projects are displayed
    await expect(page.locator('.project-card')).toHaveCount(3);
    await expect(page.locator('text=Public Project 1')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    // Create projects with different names
    const projectNames = ['AI Startup', 'Tech Innovation', 'Digital Solution'];

    for (const name of projectNames) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(name);
      await page.locator('textarea[placeholder*="Project description"]').fill(`${name} description`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to explore page
    await page.goto('/explore');

    // Search for specific term
    await page.locator('input[placeholder*="Search"]').fill('AI');

    // Verify filtering
    await expect(page.locator('.project-card')).toHaveCount(1);
    await expect(page.locator('text=AI Startup')).toBeVisible();
  });

  test('should handle status filtering', async ({ page }) => {
    // Create projects in different states
    const statuses = ['idle', 'processing', 'completed'];

    for (let i = 0; i < statuses.length; i++) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(`${statuses[i]} Project`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`${statuses[i]} description`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });

      // Complete some steps to change status
      if (statuses[i] === 'completed') {
        await page.locator('button[data-testid="accept"]').click();
        // Complete more steps to reach completion
        for (let j = 0; j < 50; j++) {
          await page.waitForSelector('text=Accept', { timeout: 60000 });
          await page.locator('button[data-testid="accept"]').click();
        }
      } else if (statuses[i] === 'processing') {
        await page.locator('button[data-testid="accept"]').click();
        // Leave in processing state
      } else {
        // Leave in idle state (don't accept)
      }
    }

    // Go to explore page
    await page.goto('/explore');

    // Test status filters
    const statusSelect = page.locator('select');

    // Filter by completed
    await statusSelect.selectOption('completed');
    await expect(page.locator('text=completed Project')).toBeVisible();
    await expect(page.locator('text=idle Project')).not.toBeVisible();

    // Filter by idle
    await statusSelect.selectOption('idle');
    await expect(page.locator('text=idle Project')).toBeVisible();
    await expect(page.locator('text=completed Project')).not.toBeVisible();
  });

  test('should sort projects by date', async ({ page }) => {
    // Create projects at different times
    const projectNames = ['Old Project', 'Middle Project', 'New Project'];

    for (const name of projectNames) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(name);
      await page.locator('textarea[placeholder*="Project description"]').fill(`${name} description`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to explore page
    await page.goto('/explore');

    // Select newest first sorting
    const sortSelect = page.locator('select[name*="sort"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('newest');
    }

    // Verify newest project appears first
    await expect(page.locator('.project-card').first()).toContainText('New Project');
  });

  test('should navigate to project details', async ({ page }) => {
    // Create a project
    await page.goto('/');
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Navigation Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing navigation from explore');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Go to explore page
    await page.goto('/explore');

    // Click on project card
    await page.locator('.project-card').first().click();

    // Verify navigation to project detail
    await expect(page.locator('text=Navigation Test')).toBeVisible();
    await expect(page.url()).toContain('/project/');
  });

  test('should handle voting system', async ({ page }) => {
    // Create a public project
    await page.goto('/');
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Voting Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing voting functionality');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    // Go to explore page
    await page.goto('/explore');

    // Check initial vote count (should be 0)
    await expect(page.locator('.vote-count')).toContainText('0');

    // Click upvote
    await page.locator('button[data-testid="upvote"]').click();

    // Verify vote count increases
    await expect(page.locator('.vote-count')).toContainText('1');

    // Try to vote again (should not allow)
    await page.locator('button[data-testid="upvote"]').click();
    await expect(page.locator('.vote-count')).toContainText('1'); // Should remain 1

    // Change vote to downvote
    await page.locator('button[data-testid="downvote"]').click();
    await expect(page.locator('.vote-count')).toContainText('-1');
  });

  test('should persist votes across sessions', async ({ page }) => {
    // Create and vote on project
    await page.goto('/');
    await page.locator('button[data-testid="create-project"]').click();

    await page.locator('input[placeholder*="Project name"]').fill('Persistence Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing vote persistence');

    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 60000 });
    await page.locator('button[data-testid="accept"]').click();

    await page.goto('/explore');
    await page.locator('button[data-testid="upvote"]').click();

    // Refresh page
    await page.reload();

    // Verify vote persists
    await expect(page.locator('.vote-count')).toContainText('1');
  });

  test('should handle responsive grid layout', async ({ page }) => {
    // Create multiple projects
    for (let i = 1; i <= 6; i++) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(`Grid Project ${i}`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Description ${i}`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to explore page
    await page.goto('/explore');

    // Test desktop layout (4 columns)
    await expect(page.locator('.project-grid')).toHaveClass(/grid-cols-4/);

    // Test tablet layout (2 columns)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.project-grid')).toHaveClass(/grid-cols-2/);

    // Test mobile layout (1 column)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.project-grid')).toHaveClass(/grid-cols-1/);
  });

  test('should handle empty state', async ({ page }) => {
    // Go to explore page without creating projects
    await page.goto('/explore');

    // Verify empty state
    await expect(page.locator('text=No public projects found')).toBeVisible();
    await expect(page.locator('text=Create the first project')).toBeVisible();
  });

  test('should handle pagination for large datasets', async ({ page }) => {
    // Create many projects (more than one page)
    const projectCount = 25;

    for (let i = 1; i <= projectCount; i++) {
      await page.goto('/');
      await page.locator('button[data-testid="create-project"]').click();

      await page.locator('input[placeholder*="Project name"]').fill(`Pagination Project ${i}`);
      await page.locator('textarea[placeholder*="Project description"]').fill(`Description ${i}`);

      await page.locator('button[type="submit"]').click();

      await page.waitForSelector('text=Accept', { timeout: 60000 });
      await page.locator('button[data-testid="accept"]').click();
    }

    // Go to explore page
    await page.goto('/explore');

    // Verify pagination controls appear
    await expect(page.locator('.pagination')).toBeVisible();

    // Check first page shows limited projects
    await expect(page.locator('.project-card')).toHaveCount(12); // Assuming 12 per page

    // Navigate to next page
    await page.locator('button[data-testid="next-page"]').click();

    // Verify second page
    await expect(page.locator('text=Pagination Project 13')).toBeVisible();
  });
});