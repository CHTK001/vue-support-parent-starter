/**
 * @playwright/test
 * @description: Playwright test to add Felo AI provider and verify it appears in the model selector
 */
import { test, expect } from '@playwright/test';

test('add Felo AI provider via settings UI', async ({ page }) => {
  // 1. Navigate to the AI settings page
  await page.goto('/ai/settings');

  // 2. Wait for the page to load and open the add platform modal
  await page.waitForSelector('.settings-header', { state: 'visible' });
  
  // Click "Add Platform" button
  await page.click('text=添加平台');
  await page.waitForSelector('.arco-modal', { state: 'visible' });

  // 3. Select "Felo AI" from the platform selector
  await page.selectOption('select[aria-label="平台"]', { index: 8 }); // Felo AI is at index 8 after custom

  // 4. Enter the base URL
  await page.fill('input[aria-label="基础URL"]', 'https://openapi.felo.ai');

  // 5. Enter the API key
  await page.fill('input[aria-label="API密钥"]', 'fk-RL08xkeFdDpU4lpC5DdI2CrhBtnAnOfsM9mgaj7yJ8K8lptv');

  // 6. Click "保存" to submit
  await page.click('button:有文字内容 contains 保存');

  // 7. Wait for the modal to close and verify the provider appears
  await page.waitForSelector('.settings-header', { state: 'visible' });

  // 8. Verify Felo AI appears in the provider list
  const feloItem = page.locator('text=Felo AI');
  await expect(feloItem).toBeVisible({ timeout: 5000 });

  // 9. Verify the provider can be selected and models are available
  await feloItem.click();
  await page.waitForTimeout(1000);

  // 10. Check that models from Felo AI are listed
  const modelCards = page.locator('.model-card');
  await expect(modelCards.first()).toBeVisible({ timeout: 5000 });
});