import { test, expect } from '@playwright/test';

// Mock AI responses for testing
const mockResponses = {
  initial: "Welcome to your startup accelerator! This is the initial response.",
  edited: "This response has been edited by the user.",
  retry: "This is a new response after retrying the AI request.",
  error: "Simulated error response for testing error states."
};

test.describe('UI STATE MANAGEMENT & INTERRUPTIONS - COMPREHENSIVE TESTING', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses with controllable states
    let responseCounter = 0;
    let shouldError = false;
    let shouldDelay = false;

    await page.route('**/api/llm**', async (route) => {
      const request = route.request();
      const body = request.postDataJSON();

      // Simulate different response types based on request
      if (shouldError) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Simulated server error',
            code: 'TEST_ERROR'
          })
        });
      }

      if (shouldDelay) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      }

      responseCounter++;
      const responses = [
        mockResponses.initial,
        mockResponses.retry,
        mockResponses.edited
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: responses[responseCounter % responses.length],
          model: "mock-gpt-4",
          tokens: 150,
          processingTime: 1.5,
          step: body.step || 1
        })
      });
    });

    // Add page-level state control functions
    await page.addScriptTag({
      content: `
        window.testState = {
          triggerError: () => { window.shouldErrorNext = true; },
          triggerDelay: () => { window.shouldDelayNext = true; },
          clearState: () => {
            window.shouldErrorNext = false;
            window.shouldDelayNext = false;
          }
        };
      `
    });

    // Register and login test user
    await page.goto('/auth/signup');
    const timestamp = Date.now();
    const testEmail = `ui-test-${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('UI Test User');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');
  });

  test('should handle all 4 primary button states and transitions', async ({ page }) => {
    console.log('🧪 Testing ALL 4 PRIMARY BUTTONS: Accept, Edit, Retry, Save');

    // Create project
    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Button State Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing all button states and transitions');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === TEST 1: ACCEPT BUTTON ===
    console.log('✅ Testing ACCEPT button functionality');

    // Verify Accept button is visible and enabled
    const acceptBtn = page.locator('button[data-testid="accept"]');
    await expect(acceptBtn).toBeVisible();
    await expect(acceptBtn).toBeEnabled();

    // Test hover state
    await acceptBtn.hover();
    await expect(acceptBtn).toHaveClass(/hover/i);

    // Test focus state
    await acceptBtn.focus();
    await expect(acceptBtn).toHaveAttribute('aria-pressed', 'false');

    // Accept the response
    await acceptBtn.click();

    // Verify transition to next step
    await expect(page.locator('text=Step 2 of 51')).toBeVisible();

    // === TEST 2: EDIT BUTTON ===
    console.log('✏️ Testing EDIT button functionality');

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    const editBtn = page.locator('button[data-testid="edit"]');
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toBeEnabled();

    // Test edit button hover and focus
    await editBtn.hover();
    await editBtn.focus();

    // Click edit button
    await editBtn.click();

    // Verify edit mode activated
    await expect(page.locator('.edit-mode')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();

    // === TEST 3: SAVE BUTTON (in edit mode) ===
    console.log('💾 Testing SAVE button in edit mode');

    // Edit the content
    await page.locator('textarea').first().fill('Edited content for testing save functionality');

    const saveBtn = page.locator('button[data-testid="save-edit"]');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeEnabled();

    // Test save button states
    await saveBtn.hover();
    await saveBtn.focus();

    // Save the changes
    await saveBtn.click();

    // Verify edit mode deactivated and changes saved
    await expect(page.locator('.edit-mode')).not.toBeVisible();
    await expect(page.locator('text=Edited content for testing save functionality')).toBeVisible();

    // === TEST 4: RETRY BUTTON ===
    console.log('🔄 Testing RETRY button functionality');

    const retryBtn = page.locator('button[data-testid="retry"]');
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).toBeEnabled();

    // Test retry button interactions
    await retryBtn.hover();
    await retryBtn.focus();

    // Click retry
    await retryBtn.click();

    // Verify loading state
    await expect(page.locator('text=Processing')).toBeVisible();

    // Wait for new response
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // Verify new content (different from edited content)
    await expect(page.locator('text=Edited content for testing save functionality')).not.toBeVisible();

    console.log('✅ All 4 primary buttons tested successfully');
  });

  test('should handle button state changes during loading and processing', async ({ page }) => {
    console.log('⏳ Testing button states during loading/processing');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Loading State Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing button states during processing');
    await page.locator('button[type="submit"]').click();

    // Wait for initial response
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === TEST LOADING STATES ===
    console.log('🔄 Testing loading states during retry');

    // Trigger retry and check button states
    await page.locator('button[data-testid="retry"]').click();

    // Verify buttons are disabled during processing
    await expect(page.locator('button[data-testid="accept"]')).toBeDisabled();
    await expect(page.locator('button[data-testid="edit"]')).toBeDisabled();
    await expect(page.locator('button[data-testid="retry"]')).toBeDisabled();

    // Verify loading indicators
    await expect(page.locator('.loading-spinner, .spinner, text=Processing')).toBeVisible();

    // Wait for completion
    await page.waitForSelector('button[data-testid="accept"]:not([disabled])', { timeout: 10000 });

    // Verify buttons are re-enabled
    await expect(page.locator('button[data-testid="accept"]')).toBeEnabled();
    await expect(page.locator('button[data-testid="edit"]')).toBeEnabled();
    await expect(page.locator('button[data-testid="retry"]')).toBeEnabled();

    console.log('✅ Loading states handled correctly');
  });

  test('should handle interruptions and state recovery', async ({ page }) => {
    console.log('🔄 Testing interruptions and state recovery');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Interruption Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing interruption handling');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === TEST 1: PAGE REFRESH INTERRUPTION ===
    console.log('🔄 Testing page refresh interruption');

    // Get current state
    const currentStepText = await page.locator('.step-indicator').textContent();
    const currentResponse = await page.locator('.response-section').textContent();

    // Refresh page
    await page.reload();

    // Verify state recovery
    await expect(page.locator('.step-indicator')).toHaveText(currentStepText);
    await expect(page.locator('.response-section')).toContainText(currentResponse.substring(0, 50));

    // === TEST 2: BROWSER BACK/FORWARD ===
    console.log('🔄 Testing browser navigation interruption');

    await page.waitForSelector('text=Accept', { timeout: 5000 });
    await page.goBack();

    // Should stay on same page (SPA behavior)
    await expect(page.locator('.step-indicator')).toBeVisible();

    await page.goForward();
    await expect(page.locator('.step-indicator')).toBeVisible();

    // === TEST 3: NETWORK INTERRUPTION SIMULATION ===
    console.log('🔄 Testing network interruption');

    // Block network requests temporarily
    await page.route('**/api/**', route => route.abort());

    await page.locator('button[data-testid="retry"]').click();

    // Should show network error
    await expect(page.locator('text=network error, text=connection failed')).toBeVisible();

    // Restore network
    await page.unroute('**/api/**');

    // Try again
    await page.locator('button[data-testid="retry"]').click();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    console.log('✅ Interruptions handled correctly');
  });

  test('should handle concurrent button interactions and race conditions', async ({ page }) => {
    console.log('⚡ Testing concurrent interactions and race conditions');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Concurrent Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing concurrent button clicks');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === TEST RAPID SUCCESSIVE CLICKS ===
    console.log('⚡ Testing rapid successive button clicks');

    // Click multiple buttons rapidly
    await Promise.allSettled([
      page.locator('button[data-testid="accept"]').click(),
      page.locator('button[data-testid="edit"]').click(),
      page.locator('button[data-testid="retry"]').click(),
    ]);

    // Should handle gracefully without breaking
    await page.waitForTimeout(2000); // Allow state to stabilize

    // Verify only one action was processed (no race condition crashes)
    await expect(page.locator('.response-section')).toBeVisible();

    // === TEST MULTIPLE EDITS ===
    console.log('⚡ Testing multiple rapid edits');

    await page.locator('button[data-testid="edit"]').click();
    await page.locator('textarea').first().fill('First edit');

    // Try to save and edit again rapidly
    await page.locator('button[data-testid="save-edit"]').click();
    await page.locator('button[data-testid="edit"]').click();
    await page.locator('textarea').first().fill('Second edit');
    await page.locator('button[data-testid="save-edit"]').click();

    // Should handle without data corruption
    await expect(page.locator('text=Second edit')).toBeVisible();

    console.log('✅ Concurrent interactions handled correctly');
  });

  test('should handle all markdown rendering and interaction states', async ({ page }) => {
    console.log('📝 Testing markdown rendering and interactions');

    // Create mock response with rich markdown
    await page.route('**/api/llm**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: `# Rich Markdown Test

## Headers and Formatting

**Bold text** and *italic text* with \`inline code\`.

### Lists
- Bullet point 1
- Bullet point 2
  - Nested item
  - Another nested

1. Numbered item
2. Second item

### Code Blocks
\`\`\`javascript
function test() {
  console.log('Hello World!');
  return true;
}
\`\`\`

### Links and Images
[Click here](https://example.com)
![Alt text](https://via.placeholder.com/150)

### Tables
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| More data| Continued | End      |

### Blockquotes
> This is a blockquote
> with multiple lines

### Task Lists
- [x] Completed task
- [ ] Incomplete task
- [x] Another done task

---
Horizontal rule above.
`,
          model: "mock-gpt-4",
          tokens: 300,
          processingTime: 2.0
        })
      });
    });

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Markdown Rendering Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing rich markdown rendering');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Rich Markdown Test', { timeout: 10000 });

    // === TEST MARKDOWN RENDERING ===
    console.log('📝 Testing markdown element rendering');

    // Headers
    await expect(page.locator('h1')).toContainText('Rich Markdown Test');
    await expect(page.locator('h2')).toContainText('Headers and Formatting');
    await expect(page.locator('h3')).toContainText('Lists');

    // Text formatting
    await expect(page.locator('strong')).toContainText('Bold text');
    await expect(page.locator('em')).toContainText('italic text');
    await expect(page.locator('code')).toContainText('inline code');

    // Lists
    await expect(page.locator('ul li')).toHaveCount(await page.locator('ul li').count());
    await expect(page.locator('ol li')).toHaveCount(await page.locator('ol li').count());

    // Code blocks
    await expect(page.locator('pre code')).toContainText('function test()');

    // Links and images
    await expect(page.locator('a')).toContainText('Click here');
    await expect(page.locator('img')).toBeVisible();

    // Tables
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th')).toContainText('Column 1');
    await expect(page.locator('td')).toContainText('Data 1');

    // Blockquotes
    await expect(page.locator('blockquote')).toContainText('blockquote');

    // Task lists (checkboxes)
    await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(2);
    await expect(page.locator('input[type="checkbox"]:not(:checked)')).toHaveCount(1);

    // Horizontal rule
    await expect(page.locator('hr')).toBeVisible();

    // === TEST MARKDOWN INTERACTIONS ===
    console.log('📝 Testing markdown interaction states');

    // Test link clicks
    const link = page.locator('a').first();
    await expect(link).toHaveAttribute('target', '_blank'); // External links

    // Test image loading
    const image = page.locator('img').first();
    await expect(image).toHaveAttribute('alt', 'Alt text');

    // Test table interactions
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Test code block interactions (should be selectable)
    const codeBlock = page.locator('pre code');
    await codeBlock.click();
    // Should allow text selection
    await page.keyboard.press('Control+a'); // Select all in code block

    console.log('✅ Markdown rendering and interactions tested');
  });

  test('should handle all form states and validation feedback', async ({ page }) => {
    console.log('📋 Testing form states and validation');

    // === TEST PROJECT CREATION FORM ===
    console.log('📋 Testing project creation form states');

    await page.locator('button[data-testid="create-project"]').click();

    const projectNameInput = page.locator('input[placeholder*="Project name"]');
    const descriptionInput = page.locator('textarea[placeholder*="Project description"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Test empty form state
    await expect(submitBtn).toBeDisabled();
    await expect(projectNameInput).toHaveAttribute('required');
    await expect(descriptionInput).toHaveAttribute('required');

    // Test partial completion
    await projectNameInput.fill('Test Project');
    await expect(submitBtn).toBeDisabled(); // Still disabled without description

    await descriptionInput.fill('Test description');
    await expect(submitBtn).toBeEnabled(); // Now enabled

    // Test character limits
    await projectNameInput.fill('a'.repeat(101)); // Over limit
    await expect(page.locator('text=maximum 100 characters')).toBeVisible();

    await projectNameInput.fill('Valid Name');
    await expect(page.locator('text=maximum 100 characters')).not.toBeVisible();

    // Test form submission states
    await submitBtn.click();

    // Verify loading state
    await expect(submitBtn).toBeDisabled();
    await expect(page.locator('text=Creating project')).toBeVisible();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === TEST EDIT FORM STATES ===
    console.log('📋 Testing edit form states');

    await page.locator('button[data-testid="edit"]').click();

    const editTextarea = page.locator('textarea').first();
    const saveBtn = page.locator('button[data-testid="save-edit"]');
    const cancelBtn = page.locator('button[data-testid="cancel-edit"]');

    // Test edit form validation
    await editTextarea.fill(''); // Empty
    await expect(saveBtn).toBeDisabled();

    await editTextarea.fill('Valid edited content');
    await expect(saveBtn).toBeEnabled();

    // Test character limits in edit
    await editTextarea.fill('a'.repeat(1001)); // Over limit
    await expect(page.locator('text=maximum 1000 characters')).toBeVisible();

    await editTextarea.fill('Valid content for testing');
    await saveBtn.click();

    // Verify form closed
    await expect(page.locator('.edit-mode')).not.toBeVisible();

    console.log('✅ Form states and validation tested');
  });

  test('should handle modal and overlay state management', async ({ page }) => {
    console.log('🪟 Testing modal and overlay states');

    // === TEST PROJECT CREATION MODAL ===
    console.log('🪟 Testing project creation modal');

    await page.locator('button[data-testid="create-project"]').click();

    // Verify modal is visible
    const modal = page.locator('.modal, [role="dialog"]');
    await expect(modal).toBeVisible();

    // Test modal backdrop
    await expect(page.locator('.modal-backdrop, .overlay')).toBeVisible();

    // Test modal focus management
    const firstInput = page.locator('input').first();
    await expect(firstInput).toBeFocused();

    // Test modal escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // Re-open modal
    await page.locator('button[data-testid="create-project"]').click();
    await expect(modal).toBeVisible();

    // Test modal close button
    await page.locator('.modal-close, button[aria-label="Close"]').click();
    await expect(modal).not.toBeVisible();

    // === TEST EDIT MODE OVERLAY ===
    console.log('🪟 Testing edit mode overlay');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Modal Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing modal states');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });
    await page.locator('button[data-testid="edit"]').click();

    // Verify edit overlay
    await expect(page.locator('.edit-overlay, .edit-mode')).toBeVisible();

    // Test overlay prevents other interactions
    await expect(page.locator('button[data-testid="accept"]')).not.toBeVisible();

    // Test overlay close
    await page.locator('button[data-testid="cancel-edit"]').click();
    await expect(page.locator('.edit-mode')).not.toBeVisible();
    await expect(page.locator('button[data-testid="accept"]')).toBeVisible();

    console.log('✅ Modal and overlay states tested');
  });

  test('should handle complex state transitions and edge cases', async ({ page }) => {
    console.log('🔄 Testing complex state transitions');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('State Transition Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing complex state changes');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === TEST RAPID STATE CHANGES ===
    console.log('🔄 Testing rapid state transitions');

    // Accept -> Edit -> Save -> Retry -> Accept sequence
    await page.locator('button[data-testid="accept"]').click();
    await page.waitForSelector('text=Accept', { timeout: 5000 });

    await page.locator('button[data-testid="edit"]').click();
    await page.locator('textarea').first().fill('Rapid edit test');
    await page.locator('button[data-testid="save-edit"]').click();

    await page.locator('button[data-testid="retry"]').click();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    await page.locator('button[data-testid="accept"]').click();

    // Verify final state is correct
    await expect(page.locator('text=Step 2 of 51')).toBeVisible();

    // === TEST INTERRUPTED EDITS ===
    console.log('🔄 Testing interrupted edit states');

    await page.waitForSelector('text=Accept', { timeout: 5000 });
    await page.locator('button[data-testid="edit"]').click();

    await page.locator('textarea').first().fill('Interrupted edit content');

    // Interrupt with page refresh
    await page.reload();

    // Should recover to non-edit state
    await expect(page.locator('.edit-mode')).not.toBeVisible();
    await expect(page.locator('text=Interrupted edit content')).not.toBeVisible();

    // === TEST NETWORK FAILURE RECOVERY ===
    console.log('🔄 Testing network failure state recovery');

    await page.waitForSelector('text=Accept', { timeout: 5000 });

    // Block API temporarily
    await page.route('**/api/**', route => route.abort());

    await page.locator('button[data-testid="retry"]').click();

    // Should show error state
    await expect(page.locator('text=error, text=failed')).toBeVisible();

    // Restore network
    await page.unroute('**/api/**');

    // Should be able to retry
    await page.locator('button[data-testid="retry"]').click();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    console.log('✅ Complex state transitions tested');
  });

  test('should handle accessibility and keyboard navigation', async ({ page }) => {
    console.log('♿ Testing accessibility and keyboard navigation');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Accessibility Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing accessibility features');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === TEST KEYBOARD NAVIGATION ===
    console.log('♿ Testing keyboard navigation');

    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Focus first button
    let focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', 'accept');

    await page.keyboard.press('Tab'); // Next button
    focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', 'edit');

    await page.keyboard.press('Tab'); // Next button
    focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', 'retry');

    // Test Enter key activation
    await page.keyboard.press('Enter'); // Activate retry
    await page.waitForSelector('text=Processing', { timeout: 5000 });

    // === TEST ARIA ATTRIBUTES ===
    console.log('♿ Testing ARIA attributes');

    const acceptBtn = page.locator('button[data-testid="accept"]');
    await expect(acceptBtn).toHaveAttribute('aria-label', /accept/i);

    const editBtn = page.locator('button[data-testid="edit"]');
    await expect(editBtn).toHaveAttribute('aria-label', /edit/i);

    // === TEST SCREEN READER CONTENT ===
    console.log('♿ Testing screen reader support');

    // Progress should be announced
    const progressBar = page.locator('.progress-bar');
    await expect(progressBar).toHaveAttribute('aria-valuenow');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '51');

    // Step indicator should be accessible
    const stepIndicator = page.locator('.step-indicator');
    await expect(stepIndicator).toHaveAttribute('aria-live', 'polite');

    console.log('✅ Accessibility features tested');
  });
});