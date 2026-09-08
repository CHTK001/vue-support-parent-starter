const { chromium } = require('playwright');

const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:5173';
const API  = 'http://127.0.0.1:8787';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  let passed = 0, failed = 0;
  async function test(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); passed++; }
    catch (e) { console.log(`  ✗ ${name}: ${e.message.substring(0, 120)}`); failed++; }
  }

  // ── Settings Pages (via Vite proxy) ─────────────────────
  console.log('\n=== Settings Pages (Playwright + Edge) ===');
  for (const [path, expectText, minSelects] of [
    ['ocr', 'OCR', 1],
    ['face', '人脸', 1],
    ['image-recognition', '图', 1],
    ['layout', '版面', 1],
  ]) {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));

    await test(`${path} page renders`, async () => {
      await page.goto(`${BASE}/settings/${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes(expectText)) throw new Error(`missing "${expectText}"`);
    });

    await test(`${path} has model selects`, async () => {
      const selects = await page.$$('.arco-select');
      if (selects.length < minSelects) throw new Error(`only ${selects.length} selects`);
    });

    await test(`${path} select has options`, async () => {
      const selects = await page.$$('.arco-select');
      if (selects.length === 0) throw new Error('no selects');
      await selects[0].click({ force: true });
      await page.waitForTimeout(500);
      const opts = await page.$$('[class*="select-option"]');
      if (opts.length === 0) throw new Error('no options');
      console.log(`    (${opts.length} options)`);
      await page.keyboard.press('Escape');
    });

    await page.close();
  }

  // ── Usage Library: dayjs diff fix ───────────────────────
  console.log('\n=== Usage Library Fix ===');
  await test('no dayjs diff errors', async () => {
    const page = await browser.newPage();
    const diffErrors = [];
    page.on('pageerror', e => { if (e.message.includes('diff')) diffErrors.push(e.message); });
    await page.goto(`${BASE}/settings/usage-library`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    if (diffErrors.length > 0) throw new Error(diffErrors[0]);
    await page.close();
  });

  // ── Zoom Fix ────────────────────────────────────────────
  console.log('\n=== Zoom Fix (no metadata errors) ===');
  await test('no zoom/metadata errors on all pages', async () => {
    const page = await browser.newPage();
    const zoomErrors = [];
    page.on('console', m => {
      if (m.type() === 'error' && (m.text().includes('zoom') || m.text().includes('metadata'))) {
        zoomErrors.push(m.text());
      }
    });
    for (const p of ['ocr', 'face', 'image-recognition', 'layout']) {
      await page.goto(`${BASE}/settings/${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
    }
    if (zoomErrors.length > 0) throw new Error(zoomErrors.length + ' errors');
    await page.close();
  });

  // ── Backend API (via browser fetch) ──────────────────────
  console.log('\n=== Backend API (via fetch) ===');
  {
    const page = await browser.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 10000 });

    const apiTests = [
      ['GET /api/requirements/tag-bindings',       '/api/requirements/tag-bindings',        'success'],
      ['GET /api/knowledge/binding (workpath)',     '/api/knowledge/binding?kind=workpath&target_id=D:/test', 'success'],
      ['GET /api/knowledge/binding (conversation)', '/api/knowledge/binding?kind=conversation&target_id=x', 'success'],
      ['GET /v2/ai/models/capabilities',            '/v2/ai/models/capabilities',             'ocr'],
      ['GET /v2/ocr/config',                        '/v2/ocr/config',                         'detector_model'],
      ['GET /v2/layout/config',                     '/v2/layout/config',                      'layout_model'],
    ];
    for (const [name, url, check] of apiTests) {
      await test(name, async () => {
        const resp = await page.evaluate(async (u) => {
          const r = await fetch(u);
          return { status: r.status, body: await r.text() };
        }, url);
        if (resp.status !== 200) throw new Error(`HTTP ${resp.status}`);
        if (!resp.body.includes(check)) throw new Error(`missing "${check}"`);
      });
    }

    await test('POST /api/fs/metadata', async () => {
      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/fs/metadata', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/tmp', workspace: '' })
        });
        return await r.text();
      });
      if (!resp.includes('success') && !resp.includes('error')) throw new Error('bad response');
    });

    await page.close();
  }

  await browser.close();
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
})();
