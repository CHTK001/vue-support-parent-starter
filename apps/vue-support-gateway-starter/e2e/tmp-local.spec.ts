import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:28849' });

test('remote control loads local', async ({ page }) => {
  const resp = await page.goto('/', { timeout: 30000, waitUntil: 'networkidle' });
  expect(resp?.ok()).toBeTruthy();
  await page.waitForTimeout(2000);
  const text = await page.locator('body').innerText();
  console.log('BODY:', text.slice(0, 1000));
});
