/* Full skills-hub E2E walkthrough — fresh navigation per step to avoid drawer-mask interference. */
const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';
const SHOTS = 'D:\\ch\\project\\vue-support-parent-starter\\pages\\ai\\e2e\\shots';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  await context.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  const page = await context.newPage();
  const out = { steps: {} };
  const shot = async (n) => { await page.screenshot({ path: `${SHOTS}\\${n}`, fullPage: false }).catch(() => {}); };
  const closeDrawer = async (testid, textRe) => {
    const btn = page.locator(`[data-testid="${testid}"] button`).filter({ hasText: textRe }).first();
    if (await btn.count()) {
      await btn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(900);
    }
  };

  // ---------- 1) 已安装：卡片 + 详情抽屉 SKILL.md 内容 ----------
  await page.goto(BASE + '/#/skills', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-testid="skills-library-surface"]', { timeout: 20000 });
  await page.waitForTimeout(3000);
  let body = await page.evaluate(() => document.body.innerText || '');
  out.steps.installed = {
    tabBadge: /已安装技能\s*\d+/.test(body),
    overview: (await page.locator('[data-testid="skills-library-overview"]').count()) > 0,
    cards: await page.locator('[data-testid^="skill-card-"]').count(),
  };
  if (out.steps.installed.cards > 0) {
    await page.locator('[data-testid^="skill-card-"]').first().click();
    await page.waitForSelector('[data-testid="skill-detail-drawer"]', { timeout: 8000 });
    await page.waitForTimeout(3000);
    const dText = await page.locator('[data-testid="skill-detail-drawer"]').innerText();
    out.steps.installed.detailShowsSkillMd = /SKILL|Baseline|##|^-|MUST/i.test(dText) && dText.length > 150;
    out.steps.installed.contentReadFailed = /无法读取该技能文件/.test(dText);
  }
  await shot('01-installed.png');
  await closeDrawer('skill-detail-drawer', /关闭|Close/);

  // ---------- 2) 从 Agent 导入：本机扫描内容预览（重新导航重置） ----------
  await page.goto(BASE + '/#/skills', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-testid="btn-import-agent-skills"]', { timeout: 20000 });
  await page.locator('[data-testid="btn-import-agent-skills"]').click();
  await page.waitForSelector('[data-testid="agent-skill-import-drawer"]', { timeout: 10000 });
  await page.waitForTimeout(5000);
  let agentRows = await page.locator('[data-testid^="agent-skill-import-row-"]').count();
  if (agentRows === 0) { await page.waitForTimeout(5000); agentRows = await page.locator('[data-testid^="agent-skill-import-row-"]').count(); }
  out.steps.agent = { rows: agentRows };
  if (agentRows > 0) {
    await page.locator('[data-testid^="btn-toggle-agent-skill-content-"]').first().click();
    await page.waitForTimeout(5000);
    const panel = page.locator('[data-testid^="agent-skill-content-"]').first();
    const panelText = panel.count() ? await panel.innerText() : '';
    out.steps.agent.contentShown = panelText.length > 20;
    out.steps.agent.contentHead = panelText.slice(0, 80).replace(/\n/g, ' ');
  }
  await shot('02-agent-content.png');
  await closeDrawer('agent-skill-import-drawer', /取消|Cancel/);

  // ---------- 3) 市场 tab：刷新出卡、无"服务不可用"（重新导航重置） ----------
  await page.goto(BASE + '/#/skills', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-testid="skills-library-surface"]', { timeout: 20000 });
  await page.getByRole('tab', { name: /技能市场/ }).click();
  await page.waitForTimeout(2000);
  const syncBtn = page.locator('[data-testid="btn-sync-skill-market"]').first();
  if (await syncBtn.count()) { await syncBtn.click(); }
  let marketCards = 0;
  for (let i = 0; i < 20; i++) {
    marketCards = await page.locator('[data-testid^="skill-market-card-"]').count();
    if (marketCards > 0) break;
    await page.waitForTimeout(2000);
  }
  const bodyMarket = await page.evaluate(() => document.body.innerText || '');
  out.steps.market = {
    cards: marketCards,
    serviceUnavailableShown: /服务暂时不可用/.test(bodyMarket),
    sampleNames: marketCards > 0 ? (await page.locator('[data-testid^="skill-market-card-"]').first().innerText()).slice(0, 80) : '(none)',
  };
  await shot('03-market.png');

  // 市场详情：获取内容（离线则降级文案，也算走通）
  if (marketCards > 0) {
    await page.locator('[data-testid^="skill-market-card-"]').first().click();
    await page.waitForSelector('[data-testid="skill-market-detail-drawer"]', { timeout: 8000 });
    await page.waitForTimeout(800);
    const fetchBtn = page.locator('[data-testid^="btn-preview-market-content-"]').first();
    if (await fetchBtn.count()) {
      await fetchBtn.click();
      let secText = '';
      for (let i = 0; i < 25; i++) {
        await page.waitForTimeout(1000);
        const sec = page.locator('[data-testid^="market-skill-content-"]').first();
        secText = sec.count() ? await sec.innerText() : '';
        if (/无法获取|打开市场|来源不可达|SKILL|^-|MUST|SHOULD/i.test(secText) && secText.length > 10) break;
      }
      out.steps.market.contentSection = secText.slice(0, 160).replace(/\n/g, ' ');
    }
  }
  await closeDrawer('skill-market-detail-drawer', /关闭|Close/);

  // ---------- 4) MCP / 插件市场：诚实空态（分别重新导航） ----------
  await page.goto(BASE + '/#/mcp', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.getByRole('tab', { name: /MCP市场/ }).click().catch(() => {});
  await page.waitForTimeout(3000);
  const mcpText = await page.evaluate(() => document.body.innerText || '');
  out.steps.mcpMarket = {
    honestEmpty: /暂无可用数据源|未配置数据源/.test(mcpText),
    snippet: (mcpText.match(/MCP 市场[^\n]*/) || ['(not found)'])[0],
  };
  await shot('04-mcp.png');

  await page.goto(BASE + '/#/plugins', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.getByRole('tab', { name: /插件市场/ }).click().catch(() => {});
  await page.waitForTimeout(3000);
  const pluginText = await page.evaluate(() => document.body.innerText || '');
  out.steps.pluginMarket = {
    honestEmpty: /暂无可用数据源|未配置数据源/.test(pluginText),
    snippet: (pluginText.match(/插件市场[^\n]*/g) || ['(not found)']).join(' | ').slice(0, 160),
  };
  await shot('05-plugins.png');

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
  const svcBad = out.steps.market && out.steps.market.serviceUnavailableShown;
  console.log(svcBad ? 'FAIL: service-unavailable shown' : 'PASS: no service-unavailable errors');
}
run().catch((e) => { console.error('SCRIPT ERROR:', e.message); process.exit(1); });
