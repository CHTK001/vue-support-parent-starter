const http = require('http');

const BASE = 'http://127.0.0.1:8787';
const VITE = 'http://127.0.0.1:5173';

function fetchJSON(method, url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = { hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, method, headers: {} };
    if (body) { opts.headers['Content-Type'] = 'application/json'; }
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, json: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, text: data.substring(0, 200) }); } });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  let passed = 0, failed = 0;
  async function test(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); passed++; }
    catch (e) { console.log(`  ✗ ${name}: ${e.message.substring(0, 120)}`); failed++; }
  }

  console.log('\n=== Backend API Tests ===');

  await test('GET /api/requirements/tag-bindings', async () => {
    const { status, json } = await fetchJSON('GET', `${BASE}/api/requirements/tag-bindings`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.success) throw new Error('success=false');
    if (!Array.isArray(json.data)) throw new Error('data is not array');
  });

  await test('GET /api/knowledge/binding (workpath with slashes)', async () => {
    const { status, json } = await fetchJSON('GET', `${BASE}/api/knowledge/binding?kind=workpath&target_id=D:/ch/project/.local-run`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.success) throw new Error('success=false');
    if (json.data.target_id !== 'D:/ch/project/.local-run') throw new Error('target_id mismatch');
  });

  await test('GET /api/knowledge/binding (simple)', async () => {
    const { status, json } = await fetchJSON('GET', `${BASE}/api/knowledge/binding?kind=workpath&target_id=test`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (json.data.target_id !== 'test') throw new Error('target_id mismatch');
  });

  await test('GET /api/knowledge/binding (conversation)', async () => {
    const { status, json } = await fetchJSON('GET', `${BASE}/api/knowledge/binding?kind=conversation&target_id=abc-123`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (json.data.target_kind !== 'conversation') throw new Error('wrong target_kind');
  });

  await test('GET /v2/ai/models/capabilities', async () => {
    const { status, json } = await fetchJSON('GET', `${BASE}/v2/ai/models/capabilities`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.success) throw new Error('success=false');
    const keys = Object.keys(json.data);
    if (keys.length === 0) throw new Error('no capability groups');
    if (!json.data.ocr || !json.data.feature || !json.data.enhance) throw new Error('missing expected groups');
  });

  await test('POST /api/requirements/autowork (set + query)', async () => {
    const { status } = await fetchJSON('POST', `${BASE}/api/requirements/autowork`, { kind: 'conversation', target_id: 'test-pw', enabled: true, tag: 'e2e-test' });
    if (status !== 200) throw new Error(`autowork POST: HTTP ${status}`);
    const { json } = await fetchJSON('GET', `${BASE}/api/requirements/tag-bindings`);
    const found = json.data.some(g => g.tag === 'e2e-test');
    if (!found) throw new Error('tag-binding not persisted');
  });

  await test('POST /api/fs/metadata (file not found)', async () => {
    const { status, json } = await fetchJSON('POST', `${BASE}/api/fs/metadata`, { path: '/nonexistent', workspace: '' });
    if (!json || (!json.success && !json.data?.success)) throw new Error('unexpected response');
  });

  await test('GET /v2/ocr/config', async () => {
    const { status, json } = await fetchJSON('GET', `${BASE}/v2/ocr/config`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.data || !Array.isArray(json.data)) throw new Error('no config data');
    if (json.data.length === 0) throw new Error('empty config');
  });

  await test('GET /v2/face/config', async () => {
    const { status, json } = await fetchJSON('GET', `${BASE}/v2/face/config`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.data || json.data.length === 0) throw new Error('empty config');
  });

  await test('GET /v2/layout/config', async () => {
    const { status, json } = await fetchJSON('GET', `${BASE}/v2/layout/config`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.data || json.data.length === 0) throw new Error('empty config');
  });

  console.log('\n=== Frontend Proxy Tests ===');

  await test('Vite proxy → backend /api/requirements/tag-bindings', async () => {
    const { status, json } = await fetchJSON('GET', `${VITE}/api/requirements/tag-bindings`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.success) throw new Error('success=false');
  });

  await test('Vite proxy → backend /api/knowledge/binding', async () => {
    const { status, json } = await fetchJSON('GET', `${VITE}/api/knowledge/binding?kind=workpath&target_id=test`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.success) throw new Error('success=false');
  });

  await test('Vite proxy → backend /v2/ai/models/capabilities', async () => {
    const { status, json } = await fetchJSON('GET', `${VITE}/v2/ai/models/capabilities`);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    if (!json.success) throw new Error('success=false');
  });

  console.log('\n=== Summary ===');
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
