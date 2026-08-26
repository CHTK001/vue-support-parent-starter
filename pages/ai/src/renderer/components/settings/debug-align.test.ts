import { test, expect } from '@playwright/test';

test('screenshot modality panel', async ({ page }) => {
  await page.goto('/settings/model');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Navigate to a modality panel (e.g., chat)
  // Click on "按能力挑模型" section, then click on "对话" tab
  const chatTab = page.locator('text=Chat').first();
  if (await chatTab.isVisible()) {
    await chatTab.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'debug-modality.png', fullPage: true });
  console.log('Screenshot saved');

  // Also get the HTML of the TaskModelSelect area
  const selectArea = page.locator('.flex.min-w-0.flex-col').first();
  if (await selectArea.isVisible()) {
    const html = await selectArea.evaluate(el => el.outerHTML);
    console.log('Select area HTML:', html);
  }
});
