import { test, expect, devices } from '@playwright/test';

test.use(devices['Desktop Edge']!);

test('frontend loads', async ({ page }) => {
  const resp = await page.goto('http://192.168.50.101:8848/#/remote/control', { timeout: 30000, waitUntil: 'networkidle' });
  console.log('resp status=', resp?.status());
  console.log('url=', page.url());
  console.log('title=', await page.title());
  const body = await page.content();
  console.log('body length=', body.length);
  const text = await page.locator('body').innerText();
  console.log('first 500 chars:');
  console.log(text.slice(0, 500));
  expect(resp?.ok()).toBeTruthy();
});
