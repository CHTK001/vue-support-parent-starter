/* Verify skill content previews end-to-end in the browser (fixed selectors). */
const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await context.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  const page = await context.newPage();
  const out = {};

  // ---- 1) 本机扫描（从 Agent 导入）内容预览 ----
  await page.goto(BASE + '/#/skills', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-testid="btn-import-agent-skills"]', { timeout: 20000 });
  await page.locator('[data-testid="btn-import-agent-skills"]').click();
  await page.waitForSelector('[data-testid="agent-skill-import-drawer"]', { timeout: 15000 });
  await page.waitForTimeout(3000); // 等来源扫描（listSkillsFromAgent + detectExternal）
  const rows = await page.locator('[data-testid^="agent-skill-import-row-"]').count();
  out.agentRows = rows;
  if (rows > 0) {
    await page.locator('[data-testid^="btn-toggle-agent-skill-content-"]').first().click();
    await page.waitForTimeout(4000);
    const panel = page.locator('[data-testid^="agent-skill-content-"]').first();
    out.agentContentPanel = panel.count() ? (await panel.innerText()).slice(0, 260) : '(panel missing)';
  } else {
    out.agentContentPanel = '(no rows to expand)';
  }

  // ---- 2) 市场详情"获取内容"（离线优雅降级）----
  await page.getByRole('tab', { name: '技能市场' }).click().catch(() => {});
  await page.waitForSelector('[data-testid^="skill-market-card-"]', { timeout: 30000 }).catch(() => {});
  const cardCount = await page.locator('[data-testid^="skill-market-card-"]').count();
  out.marketCards = cardCount;
  if (cardCount > 0) {
    await page.locator('[data-testid^="skill-market-card-"]').first().click();
    await page.waitForSelector('[data-testid="skill-market-detail-drawer"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
    const fetchBtn = page.locator('[data-testid^="btn-preview-market-content-"]').first();
    if (await fetchBtn.count()) {
      await fetchBtn.click();
      await page.waitForTimeout(8000); // GitHub 不可达时 httpGet 会走 30s 超时，给足
      const sec = page.locator('[data-testid^="market-skill-content-"]').first();
      out.marketContentSection = sec.count() ? (await sec.innerText()).slice(0, 220) : '(section missing)';
    } else {
      out.marketContentSection = '(fetch button missing)';
    }
  } else {
    out.marketContentSection = '(no market cards)';
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
}
run().catch((e) => { console.error('SCRIPT ERROR:', e.message); process.exit(1); });
