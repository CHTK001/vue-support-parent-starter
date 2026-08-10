import { test, devices } from '@playwright/test';

test.use(devices['Desktop Edge']);
test('open remote control center', async ({ page }) => {
  await page.goto('http://192.168.50.101:8848/#/remote/control', { timeout: 30000, waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'D:/ch/project/e2e-remote-control-8848.png', fullPage: true });
  const title = await page.title();
  console.log('title=', title);
  console.log('url=', page.url());
  const html = await page.content();
  console.log('html len=', html.length);
});
