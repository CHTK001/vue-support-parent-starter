import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errs: string[] = [];
  const failedReq: string[] = [];
  const allReq: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (e) => errs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (req) => failedReq.push(`${req.url()} → ${req.failure()?.errorText}`));
  page.on('response', (res) => {
    if (res.status() >= 400) {
      allReq.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto('http://127.0.0.1:19092/spider/definitions', { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));

  console.log('=== console errors/warnings ===');
  errs.slice(0, 30).forEach((e) => console.log(e));
  console.log('\n=== failed requests ===');
  failedReq.slice(0, 20).forEach((e) => console.log(e));
  console.log('\n=== 4xx/5xx responses ===');
  allReq.slice(0, 20).forEach((e) => console.log(e));

  await page.screenshot({ path: 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots\\debug-definitions.png', fullPage: true });

  const html = await page.content();
  console.log('\n=== HTML length ===', html.length);
  console.log('=== #app innerHTML length ===', (await page.locator('#app').innerHTML().catch(() => '')).length);

  await browser.close();
}
main();
