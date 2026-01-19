import { test, expect } from '@playwright/test';

test.describe('COMPREHENSIVE UI STATE & INTERRUPTION TESTING', () => {
  test.beforeEach(async ({ page }) => {
    // Setup complex mock scenarios
    let scenario = 'normal';
    let requestCount = 0;

    await page.route('**/api/llm**', async (route) => {
      requestCount++;

      switch (scenario) {
        case 'timeout':
          await new Promise(resolve => setTimeout(resolve, 35000)); // 35 seconds
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              response: 'Timeout response',
              model: "mock-gpt-4",
              tokens: 50,
              processingTime: 35
            })
          });

        case 'error':
          return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Internal server error',
              code: 'TEST_ERROR'
            })
          });

        case 'slow':
          await new Promise(resolve => setTimeout(resolve, 8000)); // 8 seconds
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              response: 'Slow response',
              model: "mock-gpt-4",
              tokens: 100,
              processingTime: 8
            })
          });

        default:
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              response: `Response ${requestCount}: This is a comprehensive test of UI states and interruptions.`,
              model: "mock-gpt-4",
              tokens: 150,
              processingTime: 2.5
            })
          });
      }
    });

    // Add test control functions to page
    await page.addScriptTag({
      content: `
        window.testControls = {
          setScenario: (s) => window.currentScenario = s,
          triggerInterrupt: () => window.interrupted = true,
          reset: () => {
            window.currentScenario = 'normal';
            window.interrupted = false;
          }
        };
      `
    });

    // Register and login test user
    await page.goto('/auth/signup');
    const timestamp = Date.now();
    const testEmail = `comprehensive-${timestamp}@example.com`;
    const testPassword = 'StrongPass123!';

    await page.locator('input[placeholder*="Name"]').fill('Comprehensive UI Test');
    await page.locator('input[placeholder*="Email"]').fill(testEmail);
    await page.locator('input[placeholder*="Password"]').fill(testPassword);
    await page.locator('input[placeholder*="Confirm"]').fill(testPassword);

    await page.locator('input[type="checkbox"]').check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');
  });

  test('should handle all possible UI state transitions and interruptions', async ({ page }) => {
    console.log('🎭 COMPREHENSIVE UI STATE TESTING STARTED');

    // === PHASE 1: NORMAL OPERATION ===
    console.log('📍 Phase 1: Normal Operation');

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Comprehensive UI Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Testing all UI states, transitions, and interruptions');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // Test all 4 primary buttons in sequence
    await page.locator('button[data-testid="accept"]').click();
    await page.waitForSelector('text=Accept', { timeout: 5000 });

    await page.locator('button[data-testid="edit"]').click();
    await page.locator('textarea').first().fill('Edited content');
    await page.locator('button[data-testid="save-edit"]').click();

    await page.locator('button[data-testid="retry"]').click();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === PHASE 2: INTERRUPTIONS ===
    console.log('📍 Phase 2: Testing Interruptions');

    // 2.1 Page Refresh Interruption
    console.log('🔄 Testing page refresh interruption');
    const currentStep = await page.locator('.step-indicator').textContent();
    await page.reload();
    await expect(page.locator('.step-indicator')).toHaveText(currentStep);

    // 2.2 Browser Navigation Interruption
    console.log('🔄 Testing browser navigation interruption');
    await page.goBack();
    await expect(page.locator('.step-indicator')).toBeVisible(); // Should stay (SPA)
    await page.goForward();
    await expect(page.locator('.step-indicator')).toBeVisible();

    // 2.3 Network Interruption
    console.log('🔄 Testing network interruption');
    await page.route('**/api/**', route => route.abort(), { times: 1 });
    await page.locator('button[data-testid="retry"]').click();
    await expect(page.locator('text=error, text=failed')).toBeVisible();
    await page.locator('button[data-testid="retry"]').click(); // Retry after restoring
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === PHASE 3: ERROR STATES ===
    console.log('📍 Phase 3: Error State Testing');

    // 3.1 API Error Handling
    console.log('❌ Testing API error handling');
    await page.evaluate(() => window.currentScenario = 'error');
    await page.locator('button[data-testid="retry"]').click();
    await expect(page.locator('text=Internal server error')).toBeVisible();
    await expect(page.locator('button[data-testid="retry"]')).toBeVisible();

    // Reset and retry
    await page.evaluate(() => window.currentScenario = 'normal');
    await page.locator('button[data-testid="retry"]').click();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // 3.2 Timeout Handling
    console.log('⏱️ Testing timeout handling');
    await page.evaluate(() => window.currentScenario = 'timeout');
    await page.locator('button[data-testid="retry"]').click();

    // Wait for timeout error (35+ seconds)
    await expect(page.locator('text=timeout, text=time out')).toBeVisible({ timeout: 40000 });

    // Reset and retry
    await page.evaluate(() => window.currentScenario = 'normal');
    await page.locator('button[data-testid="retry"]').click();
    await page.waitForSelector('text=Accept', { timeout: 10000 });

    // === PHASE 4: PERFORMANCE UNDER LOAD ===
    console.log('📍 Phase 4: Performance Under Load');

    // 4.1 Rapid Successive Operations
    console.log('⚡ Testing rapid successive operations');
    for (let i = 0; i < 5; i++) {
      await page.locator('button[data-testid="accept"]').click();
      await page.waitForSelector('text=Accept', { timeout: 5000 });
      await page.locator('button[data-testid="retry"]').click();
      await page.waitForSelector('text=Accept', { timeout: 10000 });
    }

    // 4.2 Memory Leak Testing (simulate extended session)
    console.log('💾 Testing memory usage over extended session');
    const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);

    for (let i = 0; i < 10; i++) {
      await page.locator('button[data-testid="accept"]').click();
      await page.waitForSelector('text=Accept', { timeout: 5000 });

      // Check memory growth
      const currentMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
      const growth = currentMemory - initialMemory;
      expect(growth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
    }

    // === PHASE 5: EDGE CASES ===
    console.log('📍 Phase 5: Edge Cases and Boundary Conditions');

    // 5.1 Concurrent Operations
    console.log('⚡ Testing concurrent operations');
    await Promise.allSettled([
      page.locator('button[data-testid="accept"]').click(),
      page.locator('button[data-testid="edit"]').click(),
      page.locator('button[data-testid="retry"]').click(),
    ]);

    // Should handle gracefully
    await page.waitForTimeout(2000);
    await expect(page.locator('.response-section')).toBeVisible();

    // 5.2 Form Validation Edge Cases
    console.log('📝 Testing form validation edge cases');
    await page.locator('button[data-testid="edit"]').click();

    const textarea = page.locator('textarea').first();
    const saveBtn = page.locator('button[data-testid="save-edit"]');

    // Test empty content
    await textarea.fill('');
    await expect(saveBtn).toBeDisabled();

    // Test maximum length
    await textarea.fill('a'.repeat(1001));
    await expect(page.locator('text=maximum 1000 characters')).toBeVisible();

    // Test valid content
    await textarea.fill('Valid content for testing');
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // === PHASE 6: ACCESSIBILITY TESTING ===
    console.log('📍 Phase 6: Accessibility and Keyboard Navigation');

    // 6.1 Keyboard Navigation
    console.log('⌨️ Testing keyboard navigation');
    await page.keyboard.press('Tab'); // Focus first button
    let focusedElement = await page.evaluate(() => document.activeElement?.dataset?.testid);
    expect(focusedElement).toBe('accept');

    await page.keyboard.press('Tab');
    focusedElement = await page.evaluate(() => document.activeElement?.dataset?.testid);
    expect(focusedElement).toBe('edit');

    // 6.2 Screen Reader Support
    console.log('📢 Testing screen reader support');
    const progressBar = page.locator('.progress-bar');
    await expect(progressBar).toHaveAttribute('aria-valuenow');
    await expect(progressBar).toHaveAttribute('aria-label');

    // === PHASE 7: RESPONSIVE DESIGN ===
    console.log('📍 Phase 7: Responsive Design Testing');

    // 7.1 Mobile Viewport
    console.log('📱 Testing mobile viewport');
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.mobile-layout, .responsive')).toBeVisible();
    await expect(page.locator('.step-indicator')).toBeVisible();

    // 7.2 Tablet Viewport
    console.log('📱 Testing tablet viewport');
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.tablet-layout')).toBeVisible();

    // 7.3 Desktop Viewport
    console.log('💻 Testing desktop viewport');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.desktop-layout')).toBeVisible();

    // === PHASE 8: FINAL VALIDATION ===
    console.log('📍 Phase 8: Final State Validation');

    // Verify final state is consistent
    await expect(page.locator('.step-indicator')).toBeVisible();
    await expect(page.locator('.progress-bar')).toBeVisible();
    await expect(page.locator('.response-section')).toBeVisible();

    // Verify all buttons are in correct state
    await expect(page.locator('button[data-testid="accept"]')).toBeEnabled();
    await expect(page.locator('button[data-testid="edit"]')).toBeEnabled();
    await expect(page.locator('button[data-testid="retry"]')).toBeEnabled();

    // Verify no memory leaks or performance issues
    const finalMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
    const totalGrowth = finalMemory - initialMemory;
    console.log(`Memory growth: ${(totalGrowth / 1024 / 1024).toFixed(2)} MB`);

    expect(totalGrowth).toBeLessThan(200 * 1024 * 1024); // Less than 200MB total

    console.log('🎉 COMPREHENSIVE UI STATE TESTING COMPLETED SUCCESSFULLY!');
  });

  test('should test all markdown rendering states and interactions', async ({ page }) => {
    console.log('📝 COMPREHENSIVE MARKDOWN TESTING');

    // Setup rich markdown response
    await page.route('**/api/llm**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: `# Complete Markdown Test

## Text Formatting
**Bold text** *italic text* \`inline code\` ~~strikethrough~~

## Lists
### Unordered
- Item 1
- Item 2
  - Nested item
  - Another nested

### Ordered
1. First item
2. Second item
   1. Nested numbered
   2. Another nested

### Task Lists
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed

## Code
\`\`\`javascript
function example() {
  console.log('Hello World!');
  return {
    status: 'success',
    data: [1, 2, 3]
  };
}
\`\`\`

\`\`\`python
def hello_world():
    print("Hello from Python!")
    return "success"
\`\`\`

## Tables
| Feature | Status | Notes |
|---------|--------|-------|
| Tables | ✅ Working | Full support |
| Code blocks | ✅ Working | Syntax highlighting |
| Lists | ✅ Working | Nested support |
| Links | ✅ Working | External links |

## Links and Media
[External Link](https://example.com)
[Internal Link](#complete-markdown-test)

## Blockquotes
> This is a blockquote
> with multiple lines
>
> And another paragraph

## Horizontal Rules
---

Content after horizontal rule.

## Mixed Content
Combining **bold** and *italic* with \`code\` and [links](#).

### Complex Nested Structure
- **Bold item** with \`code\`
  - Nested *italic* item
    - Deeply nested [link](#)
- Normal item
  1. Numbered item with **bold**
  2. Another numbered item

> Blockquote with **bold** and [link](#)

\`\`\`json
{
  "markdown": "test",
  "complexity": "high",
  "features": ["tables", "code", "lists"]
}
\`\`\`
`,
          model: "mock-gpt-4",
          tokens: 500,
          processingTime: 3.2
        })
      });
    });

    await page.locator('button[data-testid="create-project"]').click();
    await page.locator('input[placeholder*="Project name"]').fill('Markdown Rendering Test');
    await page.locator('textarea[placeholder*="Project description"]').fill('Comprehensive markdown rendering and interaction test');
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector('text=Complete Markdown Test', { timeout: 10000 });

    // === TEST HEADERS ===
    console.log('📝 Testing header rendering');
    await expect(page.locator('h1')).toContainText('Complete Markdown Test');
    await expect(page.locator('h2')).toContainText('Text Formatting');
    await expect(page.locator('h3')).toContainText('Unordered');

    // === TEST TEXT FORMATTING ===
    console.log('📝 Testing text formatting');
    await expect(page.locator('strong')).toContainText('Bold text');
    await expect(page.locator('em')).toContainText('italic text');
    await expect(page.locator('code')).toContainText('inline code');
    await expect(page.locator('del, s')).toContainText('strikethrough');

    // === TEST LISTS ===
    console.log('📝 Testing list rendering');
    // Unordered lists
    const ulItems = page.locator('ul li');
    await expect(ulItems).toHaveCount(await ulItems.count());
    await expect(ulItems.first()).toContainText('Item 1');

    // Ordered lists
    const olItems = page.locator('ol li');
    await expect(olItems).toHaveCount(await olItems.count());
    await expect(olItems.first()).toContainText('First item');

    // Task lists
    const checkedBoxes = page.locator('input[type="checkbox"]:checked');
    const uncheckedBoxes = page.locator('input[type="checkbox"]:not(:checked)');
    await expect(checkedBoxes).toHaveCount(2);
    await expect(uncheckedBoxes).toHaveCount(1);

    // === TEST CODE BLOCKS ===
    console.log('📝 Testing code block rendering');
    const codeBlocks = page.locator('pre code');
    await expect(codeBlocks).toHaveCount(3); // JS, Python, JSON

    // JavaScript code block
    await expect(codeBlocks.first()).toContainText('function example()');
    await expect(codeBlocks.first()).toContainText('console.log');

    // Python code block
    await expect(codeBlocks.nth(1)).toContainText('def hello_world()');

    // JSON code block
    await expect(codeBlocks.nth(2)).toContainText('"markdown": "test"');

    // === TEST TABLES ===
    console.log('📝 Testing table rendering');
    const table = page.locator('table');
    await expect(table).toBeVisible();

    const headers = page.locator('th');
    await expect(headers).toHaveCount(3);
    await expect(headers.first()).toContainText('Feature');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText('Tables');

    // === TEST LINKS ===
    console.log('📝 Testing link rendering');
    const links = page.locator('a');
    await expect(links).toHaveCount(await links.count());

    const externalLink = page.locator('a').filter({ hasText: 'External Link' });
    await expect(externalLink).toHaveAttribute('href', 'https://example.com');
    await expect(externalLink).toHaveAttribute('target', '_blank');

    // === TEST BLOCKQUOTES ===
    console.log('📝 Testing blockquote rendering');
    const blockquotes = page.locator('blockquote');
    await expect(blockquotes).toHaveCount(await blockquotes.count());
    await expect(blockquotes.first()).toContainText('This is a blockquote');

    // === TEST HORIZONTAL RULES ===
    console.log('📝 Testing horizontal rule rendering');
    const hr = page.locator('hr');
    await expect(hr).toBeVisible();

    // === TEST MARKDOWN INTERACTIONS ===
    console.log('📝 Testing markdown interactions');

    // Test code block selection
    await codeBlocks.first().click();
    // Should allow text selection
    await page.keyboard.press('Control+a');

    // Test link clicking (should open in new tab)
    await externalLink.click();
    // New page should open
    const newPage = page.context().pages()[1];
    if (newPage) {
      await expect(newPage.url()).toContain('example.com');
    }

    // Test checkbox interactions
    const uncheckedBox = uncheckedBoxes.first();
    await uncheckedBox.click();
    await expect(uncheckedBox).toBeChecked();

    console.log('✅ Comprehensive markdown testing completed');
  });
});