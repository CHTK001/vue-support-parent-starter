/**
 * Regression check: /agents -> 「工作流配置」-> 「子Agent管理」 tab.
 *
 * WHY (2026-10-08): the tab called `GET /api/agents/managed/{id}/sub-agents`,
 * which the backend never implemented (only POST/PUT/DELETE exist -> Spring
 * answers GET with 405), so the table was permanently empty. It also read
 * `id/order/condition` while the backend returns `agent_id/sort_order` and has
 * no `condition` column. The page now consumes the `sub_agents` array that
 * `GET /{id}` already returns, so this asserts the tab actually renders rows.
 *
 * The fixture is created over the API and deleted again in a finally block, so
 * it never reads or writes another session's data.
 *
 * Result: .ui-click-sweep-chunks/subagents-tab.json
 * Usage: `ACCEPT_BASE=http://localhost:15689 node src/acceptance/subagents-tab-check.cjs`
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.ACCEPT_BASE || 'http://localhost:15689';
const OUT = path.join(__dirname, '.ui-click-sweep-chunks', 'subagents-tab.json');
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.USER_PASS || 'admin123';
const STAMP = Date.now();

const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: !!ok, detail: String(detail || '') });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' :: ' + detail : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let token = '';
const api = async (p, method = 'GET', body) => {
  const headers = { 'x-oauth-token': token, Authorization: `Bearer ${token}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(BASE + p, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON is a valid answer */ }
  return { status: res.status, json, text };
};

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 180000 });
  // A freshly started dev server re-optimizes deps; first paint measured ~31s.
  await page.waitForSelector('input[type="password"]', { timeout: 150000 });
  await sleep(4000);
  await page.locator('input[type="text"]').first().fill(USER);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('button:has-text("登")').first().click();
  await page.waitForURL((x) => !/\/login/.test(x.pathname), { timeout: 90000 }).catch(() => {});
  await sleep(2500);
}

const masterName = `zz-subagents-tab-${STAMP}`;
const child1 = `zz-sa-c1-${STAMP}`;
const child2 = `zz-sa-c2-${STAMP}`;
let masterId = '';
let browser = null;

(async () => {
  const hc = await fetch(BASE + '/v2/user/me').then((r) => r.status).catch((e) => 'EXC:' + e.message);
  console.log(`connectivity /v2/user/me=${hc}`);
  if (hc !== 200 && hc !== 403) {
    console.log('!! target unreachable - no claims made');
    process.exit(2);
  }

  const lr = await api('/v2/user/login', 'POST', { username: USER, password: PASS });
  token = lr.json?.data?.accessToken || '';
  add('api.login', !!token, `status=${lr.status}`);
  if (!token) process.exit(2);

  try {
    // ---- fixture: own master + two children ----
    const mk = await api('/api/agents/managed', 'POST', {
      name: masterName, description: 'temp fixture (self-deleted)', model: 'agnes-2.0-flash', provider_id: 'agnes',
    });
    masterId = mk.json?.data?.agent_id || '';
    add('fixture.master', mk.status === 200 && !!masterId, `status=${mk.status}`);
    if (!masterId) throw new Error('no master id');

    const c1 = await api(`/api/agents/managed/${masterId}/sub-agents`, 'POST', {
      name: child1, model: 'agnes-2.0-flash', role: 'r1', sort_order: 1, system_prompt: 'prompt-1',
    });
    const c2 = await api(`/api/agents/managed/${masterId}/sub-agents`, 'POST', {
      name: child2, model: 'agnes-2.0-flash', role: 'r2', sort_order: 2, system_prompt: 'prompt-2',
    });
    add('fixture.children', c1.status === 200 && c2.status === 200, `c1=${c1.status} c2=${c2.status}`);

    // ---- drive the real page ----
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1512, height: 950 } });
    const page = await ctx.newPage();

    const subAgentCalls = [];
    const badResponses = [];
    const pageErrors = [];
    page.on('response', (r) => {
      const u = r.url().replace(/^https?:\/\/[^/]+/, '');
      if (/sub-agents/.test(u)) subAgentCalls.push(`${r.status()} ${u}`);
      // /weather-api/ and /typhoon-api/ are the app's third-party widgets.
      if (r.status() >= 400 && !/favicon|\.png|\.svg|open-meteo|weather-api|typhoon-api/.test(u)) {
        badResponses.push(`${r.status()} ${u}`);
      }
    });
    page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 200)));

    await login(page);
    await page.goto(BASE + '/agents', { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForSelector('.el-table__row, .el-table', { timeout: 150000 });
    await sleep(3000);

    const row = page.locator('tr', { hasText: masterName }).first();
    add('ui.fixtureRowVisible', (await row.count()) > 0, `rows=${await page.locator('tr').count()}`);

    await row.locator('button', { hasText: '工作流配置' }).first().click();
    await sleep(3000);
    add('ui.configDialogOpen', (await page.locator('.el-dialog:visible').count()) > 0,
      `dialogs=${await page.locator('.el-dialog:visible').count()}`);

    const pane = page.locator('.el-dialog:visible .el-tab-pane').first();
    await pane.waitFor({ timeout: 15000 }).catch(() => {});

    const bodyRows = pane.locator('.el-table__body tr');
    let rowCount = await bodyRows.count();
    if (rowCount === 0) { await sleep(3000); rowCount = await bodyRows.count(); }
    add('ui.subAgentRows', rowCount === 2, `rows=${rowCount} (expect 2)`);

    const headers = (await pane.locator('.el-table__header th').allInnerTexts()).map((s) => s.trim()).filter(Boolean);
    add('ui.hasOrderColumn', headers.some((h) => /执行顺序/.test(h)), `headers=${headers.join('|')}`);
    add('ui.noConditionColumn', !headers.some((h) => /触发条件/.test(h)), `headers=${headers.join('|')}`);

    // The defect itself: no request may go to the unimplemented list endpoint.
    add('ui.no405', !subAgentCalls.some((c) => c.startsWith('405')),
      `subAgentCalls=[${subAgentCalls.join(', ')}]`);
    add('ui.noUnexpected4xx', badResponses.length === 0, `bad=[${badResponses.slice(0, 4).join(', ')}]`);
    add('ui.noPageErrors', pageErrors.length === 0, `errors=[${pageErrors.slice(0, 2).join(' | ')}]`);

    await browser.close();
    browser = null;
  } catch (e) {
    add('probe.exception', false, (e && e.message) || String(e));
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (masterId) {
      await api(`/api/agents/managed/${masterId}`, 'DELETE');
      const list = await api('/api/agents/managed');
      const leftovers = (Array.isArray(list.json?.data) ? list.json.data : [])
        .map((x) => x?.name).filter((n) => String(n).includes(masterName)).length;
      add('cleanup.removed', leftovers === 0, `leftover=${leftovers}`);
    }
  }

  const failed = checks.filter((c) => !c.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    pass: checks.length - failed.length,
    fail: failed.length,
    checks,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.pass, failed: report.fail, out: OUT }, null, 2));
  process.exit(failed.length ? 1 : 0);
})();
