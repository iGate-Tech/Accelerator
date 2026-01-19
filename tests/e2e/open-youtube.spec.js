import { chromium } from 'playwright';

const context = await chromium.launchPersistentContext(
  '/home/ranag/.config/google-chrome',
  {
    channel: 'chrome',
    headless: false
  }
);

const page = await context.newPage();
await page.goto('https://youtube.com');

await context.close();