/* Post-conflict-resolution UI check: markets still correct + bots page renders. */
const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push('PAGEERROR: ' + e.message));

  async function openTab(hubPath, tabText, waitMs = 6000) {
    await page.goto(BASE + '#/' + hubPath, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const tab = page.getByRole('tab', { name: tabText }).first();
    if (await tab.count()) {
      await tab.click().catch(() => {});
    } else {
      await page.getByText(tabText, { exact: false }).first().click().catch(() => {});
    }
    await page.waitForTimeout(waitMs);
  }
  const bodyText = () => page.evaluate(() => document.body.innerText || '');

  const out = {};

  // 1) 角色市场：作者专家包
  await openTab('presets', '设定市场', 9000);
  let t = await bodyText();
  out.preset = {
    openclaw: /openclaw/i.test(t),
    obra: /obra/i.test(t),
    flatSkillNames: /agent-transcript/.test(t),
  };

  // 2) MCP 市场：诚实空态
  await openTab('mcp', 'MCP市场');
  t = await bodyText();
  out.mcpHonestEmpty = /暂无可用数据源|未配置数据源/.test(t);

  // 3) 插件市场：诚实空态
  await openTab('plugins', '插件市场');
  t = await bodyText();
  out.pluginHonestEmpty = /暂无可用数据源|未配置数据源/.test(t);

  // 4) Bot 页（BotImPage 冲突解决后是否可渲染）
  await page.goto(BASE + '#/bots', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);
  t = await bodyText();
  out.botsPage = {
    rendered: t.length > 100,
    hasCrmOrBot: /客服|Bot|会话|管理/i.test(t),
    snippet: t.slice(0, 300),
  };

  // 5) 技能市场（回归：仍显示扁平技能榜）
  await openTab('skills', '', 9000);
  t = await bodyText();
  out.skillMarket = {
    flatSkillNames: /agent-transcript|auto-qa|autoreview/.test(t),
  };

  console.log(JSON.stringify(out, null, 2));
  console.log('\n=== page errors (' + pageErrors.length + ') ===');
  [...new Set(pageErrors)].slice(0, 10).forEach((e) => console.log(' - ' + e.slice(0, 200)));

  await browser.close();
}

run().catch((e) => { console.error('SCRIPT ERROR:', e.message); process.exit(1); });
