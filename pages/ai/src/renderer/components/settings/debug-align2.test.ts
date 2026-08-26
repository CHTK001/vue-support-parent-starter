import { test, expect } from '@playwright/test';

test('screenshot chat modality panel', async ({ page }) => {
  await page.goto('/models?section=chat');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'debug-chat-panel.png', fullPage: true });
  console.log('Screenshot saved: debug-chat-panel.png');

  // Get the TaskModelSelect area HTML
  const selectContainer = page.locator('.flex.min-w-0.flex-col.gap-4px').first();
  if (await selectContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
    const html = await selectContainer.evaluate(el => el.outerHTML);
    console.log('Select container HTML:', html);
  } else {
    console.log('Select container not found, getting page HTML');
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 5000));
    console.log('Body HTML:', bodyHTML);
  }
});
