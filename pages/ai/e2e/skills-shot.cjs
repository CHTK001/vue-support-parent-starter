/* Screenshot the skills hub for before/after comparison. */
const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';
const OUT = process.argv[2] || 'before.png';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await context.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  const page = await context.newPage();
  await page.goto(BASE + '/#/skills', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-testid="skills-library-surface"]', { timeout: 20000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: OUT, fullPage: false });
  console.log('saved ' + OUT);
  await browser.close();
}
run().catch((e) => { console.error('ERR:', e.message); process.exit(1); });
