const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });

  // In-page simulation of httpBridge's httpRequest for capabilities
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(6000);

  const sim = await page.evaluate(async () => {
    // Simulate httpBridge request exactly
    const url = '/v2/ai/models/capabilities';
    const resp = await fetch(url, { cache: 'no-store' });
    const contentType = resp.headers.get('Content-Type');
    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = null; }
    // httpBridge unwrap logic
    let data = json;
    if (json && typeof json === 'object' && 'data' in json) data = json.data;
    return {
      status: resp.status,
      contentType,
      textLen: text.length,
      parsed: !!json,
      success: json?.success,
      dataKeys: data && typeof data === 'object' ? Object.keys(data) : null,
      classifyLen: data?.classify?.length,
      hasData: !!(json && 'data' in json)
    };
  });
  console.log('httpBridge sim for capabilities:', JSON.stringify(sim, null, 2));

  // Also fetch the specific capabilities used by image-recognition mapping
  const check = await page.evaluate(async () => {
    const resp = await fetch('/v2/ai/models/capabilities');
    const j = await resp.json();
    const d = j.data;
    return {
      classify: d?.classify?.length,
      'image-detect': d?.['image-detect']?.length,
      segment: d?.segment?.length,
      enhance: d?.enhance?.length
    };
  });
  console.log('Used capabilities:', JSON.stringify(check));

  await browser.close();
})();