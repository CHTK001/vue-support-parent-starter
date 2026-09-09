/* Market-fix UI check: verify role market shows author packages, MCP/plugin markets show honest empty state. */
const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // Clear any cached market data on every page load so the check reflects live backend data.
  await context.addInitScript(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  async function openMarketTab(hubPath, tabText, waitMs = 2000) {
    await page.goto(BASE + hubPath, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    // click the market tab header if present
    const tab = page.getByRole('tab', { name: tabText }).first();
    if (await tab.count()) {
      await tab.click().catch(() => {});
      await page.waitForTimeout(waitMs);
    } else {
      // fallback: click by text
      await page.getByText(tabText, { exact: false }).first().click().catch(() => {});
      await page.waitForTimeout(waitMs);
    }
  }

  async function bodyText() {
    return await page.evaluate(() => document.body.innerText || '');
  }

  const results = {};

  // 1) Role / Preset market — expect author packages (openclaw / obra / mattpocock / vinta)
  await openMarketTab('/presets', '设定市场', 9000);
  const presetText = await bodyText();
  results.preset = {
    finalUrl: page.url(),
    hasOpenclaw: /openclaw/i.test(presetText),
    hasObra: /obra/i.test(presetText),
    hasExpertPackageWord: /专家包/i.test(presetText),
    hasFlatSkillNames: /agent-transcript/.test(presetText),
    stillLoading: /请稍候|加载中/.test(presetText),
    snippet: presetText.slice(0, 900),
  };

  // 2) MCP market — expect honest empty state, no items
  await openMarketTab('/mcp', 'MCP市场');
  const mcpText = await bodyText();
  results.mcp = {
    finalUrl: page.url(),
    hasHonestEmpty: /暂无可用数据源|未配置数据源|no data source/i.test(mcpText),
    snippet: mcpText.slice(0, 500),
  };

  // 3) Plugin market — expect honest empty state, no items
  await openMarketTab('/plugins', '插件市场');
  const pluginText = await bodyText();
  results.plugin = {
    finalUrl: page.url(),
    hasHonestEmpty: /暂无可用数据源|未配置数据源|no data source/i.test(pluginText),
    snippet: pluginText.slice(0, 500),
  };

  console.log('=== ROLE/PRESET market ===');
  console.log(JSON.stringify(results.preset, null, 2));
  console.log('\n=== MCP market ===');
  console.log(JSON.stringify(results.mcp, null, 2));
  console.log('\n=== PLUGIN market ===');
  console.log(JSON.stringify(results.plugin, null, 2));

  console.log('\n=== console/page errors (' + consoleErrors.length + ') ===');
  const unique = [...new Set(consoleErrors)].slice(0, 20);
  unique.forEach((e) => console.log(' - ' + e.slice(0, 200)));

  await browser.close();
  return results;
}

run().catch((e) => { console.error('SCRIPT ERROR:', e); process.exit(1); });
