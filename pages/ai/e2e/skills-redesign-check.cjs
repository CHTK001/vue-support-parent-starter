/* Final skills-hub redesign + content preview verification. */
const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await context.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  const page = await context.newPage();
  const out = {};

  // 1) 技能中心页面结构：tab 计数 + 统计条 + 卡片内容提示
  await page.goto(BASE + '/#/skills', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-testid="skills-library-surface"]', { timeout: 20000 });
  await page.waitForTimeout(2500);
  const bodyText = await page.evaluate(() => document.body.innerText || '');
  out.tabBadgeInstalled = /已安装技能\s*\d+/.test(bodyText);
  out.overviewStrip = (await page.locator('[data-testid="skills-library-overview"]').count()) > 0;
  out.overviewText = out.overviewStrip
    ? (await page.locator('[data-testid="skills-library-overview"]').innerText()).replace(/\n/g, ' | ').slice(0, 160)
    : '(none)';
  const cards = await page.locator('[data-testid^="skill-card-"]').count();
  out.skillCards = cards;
  out.contentHintPresent = cards > 0 && /内容/.test(bodyText);

  // 点第一张卡 → 详情抽屉（含 SKILL.md 内容预览）
  if (cards > 0) {
    await page.locator('[data-testid^="skill-card-"]').first().click();
    await page.waitForSelector('[data-testid="skill-detail-drawer"]', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const detail = page.locator('[data-testid="skill-detail-drawer"]');
    out.installedDetailContent = detail.count()
      ? (await detail.locator('[data-testid="skill-detail-content"]').innerText()).length > 50
      : false;
    await detail.locator('[data-testid*="close"], .arco-drawer-close').first().click().catch(() => {});
    await page.waitForTimeout(800);
  }

  // 2) 从 Agent 导入抽屉：内容开关
  await page.locator('[data-testid="btn-import-agent-skills"]').click().catch(() => {});
  await page.waitForSelector('[data-testid="agent-skill-import-drawer"]', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const rows = await page.locator('[data-testid^="agent-skill-import-row-"]').count();
  out.agentRows = rows;
  if (rows > 0) {
    await page.locator('[data-testid^="btn-toggle-agent-skill-content-"]').first().click().catch(() => {});
    await page.waitForTimeout(4000);
    const panels = await page.locator('[data-testid^="agent-skill-content-"]').count();
    const panelText = panels > 0 ? await page.locator('[data-testid^="agent-skill-content-"]').first().innerText() : '';
    out.agentContentPanel = { panels, textLen: panelText.length, head: panelText.slice(0, 120).replace(/\n/g, ' ') };
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
}
run().catch((e) => { console.error('SCRIPT ERROR:', e.message); process.exit(1); });
