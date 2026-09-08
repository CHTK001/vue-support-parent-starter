const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  let passed = 0, failed = 0;

  async function assert(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (e) {
      console.log(`  ✗ ${name}: ${e.message.substring(0, 120)}`);
      failed++;
    }
  }

  // ── Settings Pages ──────────────────────────────────────
  console.log('\n=== Settings Pages ===');

  for (const [path, expectText, expectMinSelects] of [
    ['ocr', 'OCR', 1],
    ['face', '人脸', 1],
    ['image-recognition', '图', 1],
    ['layout', '版面', 1],
  ]) {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));

    await page.goto(`http://127.0.0.1:5173/settings/${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);

    const text = await page.evaluate(() => document.body.innerText);
    const selects = await page.$$('.arco-select');

    await assert(`${path} page renders`, async () => {
      if (!text.includes(expectText)) throw new Error(`missing "${expectText}" in page text`);
    });
    await assert(`${path} has selects (>=${expectMinSelects})`, async () => {
      if (selects.length < expectMinSelects) throw new Error(`only ${selects.length} selects`);
    });

    // Click first select to verify options load from capabilities endpoint
    if (selects.length > 0) {
      await assert(`${path} select has options`, async () => {
        await selects[0].click({ force: true });
        await page.waitForTimeout(500);
        const opts = await page.$$('[class*="select-option"]');
        if (opts.length === 0) throw new Error('no options rendered');
        console.log(`    (${opts.length} options)`);
        await page.keyboard.press('Escape');
      });
    }

    await page.close();
  }

  // ── Usage Library Page ──────────────────────────────────
  console.log('\n=== Usage Library Page ===');
  {
    const page = await browser.newPage();
    const diffErrors = [];
    page.on('pageerror', e => { if (e.message.includes('diff')) diffErrors.push(e.message); });
    await page.goto('http://127.0.0.1:5173/settings/usage-library', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
    await assert('no dayjs diff errors', async () => {
      if (diffErrors.length > 0) throw new Error(diffErrors[0]);
    });
    await page.close();
  }

  // ── Zoom Fix ────────────────────────────────────────────
  console.log('\n=== Zoom Fix Verification ===');
  {
    const page = await browser.newPage();
    const zoomErrors = [];
    page.on('console', m => {
      if (m.type() === 'error' && (m.text().includes('zoom') || m.text().includes('metadata'))) {
        zoomErrors.push(m.text());
      }
    });
    for (const p of ['ocr', 'face', 'image-recognition', 'layout']) {
      await page.goto(`http://127.0.0.1:5173/settings/${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
    }
    await assert('no zoom/metadata errors across all pages', async () => {
      if (zoomErrors.length > 0) throw new Error(zoomErrors.length + ' errors: ' + zoomErrors[0]);
    });
    await page.close();
  }

  // ── Backend API ─────────────────────────────────────────
  console.log('\n=== Backend API ===');
  {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 10000 });

    const apiTests = [
      ['GET /api/requirements/tag-bindings', '/api/requirements/tag-bindings', 'success'],
      ['GET /api/knowledge/binding?kind=workpath&target_id=test', '/api/knowledge/binding?kind=workpath&target_id=test', 'success'],
      ['GET /v2/ai/models/capabilities', '/v2/ai/models/capabilities', 'ocr'],
    ];

    for (const [name, url, check] of apiTests) {
      await assert(name, async () => {
        const resp = await page.evaluate(async (u) => {
          const r = await fetch(u);
          return { status: r.status, body: await r.text() };
        }, url);
        if (resp.status !== 200) throw new Error(`HTTP ${resp.status}`);
        if (!resp.body.includes(check)) throw new Error(`missing "${check}" in response`);
      });
    }

    await assert('POST /api/fs/metadata', async () => {
      const resp = await page.evaluate(async () => {
        const r = await fetch('/api/fs/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/tmp', workspace: '' })
        });
        return { status: r.status, body: await r.text() };
      });
      if (!resp.body.includes('success') && !resp.body.includes('error')) throw new Error('unexpected response');
    });

    await page.close();
  }

  // ── Summary ─────────────────────────────────────────────
  await browser.close();
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
})();
