/* Targeted skills-market check: navigate, ensure market tab active, click sync if present, then read. */
const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  const page = await context.newPage();

  await page.goto(BASE + '#/skills', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Try to activate the market tab if present
  const marketTab = page.getByRole('tab', { name: /市场|Market/ }).first();
  if (await marketTab.count()) {
    await marketTab.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  // Click the refresh/sync button on the skills market surface if present
  const syncBtn = page.locator('[data-testid*="btn-sync"]').first();
  if (await syncBtn.count()) {
    await syncBtn.click().catch(() => {});
    await page.waitForTimeout(4000);
  } else {
    await page.waitForTimeout(4000);
  }

  const t = await page.evaluate(() => document.body.innerText || '');
  const hasFlat = /agent-transcript|auto-qa|autoreview|channel-message-flows|claw-score/.test(t);
  const hasSourceTag = /ClawHub|SkillHub|LoopHub/.test(t);
  const hasEmpty = /暂无|未采集|加载中/.test(t);
  console.log(JSON.stringify({
    hasFlatSkillNames: hasFlat,
    hasSourceLabel: hasSourceTag,
    possiblyLoadingOrEmpty: hasEmpty,
    snippet: t.slice(0, 500),
  }, null, 2));

  await browser.close();
}
run().catch((e) => { console.error('ERR', e.message); process.exit(1); });
