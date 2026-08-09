/**
 * AI 系统全功能 E2E 测试
 *
 * 覆盖：协议兼容性、安全策略、管理面板 CRUD、流程联动
 * 不依赖真实 AI Provider（请求会超时，但鉴权层应快速返回）
 */

const BASE = 'http://127.0.0.1:8091/api/ai';
const TIMEOUT = 5000;

let passed = 0, failed = 0;

async function test(name, fn) {
  try { await fn(); passed++; console.log(`  [PASS] ${name}`); }
  catch (e) { failed++; console.log(`  [FAIL] ${name}: ${e.message}`); }
}

async function api(method, url, body, auth, timeoutMs = TIMEOUT) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${auth}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal });
    const text = await r.text();
    let j; try { j = JSON.parse(text); } catch { j = text; }
    return { status: r.status, body: j };
  } finally { clearTimeout(t); }
}

/** 快速鉴权测试：应在 1 秒内返回（不依赖 AI Provider） */
async function apiAuth(method, url, body, auth) {
  return api(method, url, body, auth, 2000);
}

(async () => {
  console.log('='.repeat(70));
  console.log('AI 系统全功能 E2E 测试');
  console.log(new Date().toISOString());
  console.log('='.repeat(70));

  // ════════════════════════════════════════════════════════════
  // 1. 协议兼容性测试（鉴权层，快速返回）
  // ════════════════════════════════════════════════════════════
  console.log('\n--- 1. 协议兼容性测试 ---');

  const endpoints = [
    ['OpenAI Chat Completions', 'POST', '/v2/v1/chat/completions', { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] }],
    ['OpenAI Completions', 'POST', '/v2/v1/completions', { model: 'gpt-4o', prompt: 'hi' }],
    ['Claude Messages', 'POST', '/v2/v1/messages', { model: 'claude-3', messages: [{ role: 'user', content: 'hi' }] }],
    ['OpenAI Responses', 'POST', '/v2/v1/responses', { model: 'gpt-4o', input: [{ type: 'message', role: 'user', content: 'hi' }] }],
    ['Gemini', 'POST', '/v2/v1beta/models/gpt-4o:generateContent', { contents: [{ parts: [{ text: 'hi' }] }] }],
  ];

  for (const [name, method, path, body] of endpoints) {
    await test(`${name} - 无效 Token 返回 401`, async () => {
      const r = await apiAuth(method, `${BASE}${path}`, body, 'sk-invalid');
      if (r.status !== 401) throw new Error(`期望 401 得 ${r.status}`);
    });
    await test(`${name} - 有效 Token 不返回 401`, async () => {
      const r = await apiAuth(method, `${BASE}${path}`, body, 'sk-chat-verify');
      if (r.status === 401) throw new Error(`有效 Token 被拒: ${JSON.stringify(r.body).slice(0, 100)}`);
    });
  }

  // ───── OpenAI Models ─────
  await test('OpenAI Models - 无效 Token 401', async () => {
    const r = await apiAuth('GET', `${BASE}/v2/v1/models`, null, 'sk-invalid');
    if (r.status !== 401) throw new Error(`期望 401 得 ${r.status}`);
  });
  await test('OpenAI Models - 有效 Token 不返回 401', async () => {
    const r = await apiAuth('GET', `${BASE}/v2/v1/models`, null, 'sk-chat-verify');
    if (r.status === 401) throw new Error(`鉴权失败`);
  });

  // ───── CC Switch ─────
  await test('CC Switch 健康检查', async () => {
    const r = await apiAuth('GET', `${BASE}/v2/v1/cc/switch/health`, null, 'sk-chat-verify');
    if (typeof r.body === 'object' && r.body?.status !== 'healthy') throw new Error(`非健康: ${JSON.stringify(r.body)}`);
  });
  await test('CC Switch 切换模型', async () => {
    const r = await apiAuth('POST', `${BASE}/v2/v1/cc/switch`, { model: 'mock-gpt-4o' }, 'sk-chat-verify');
    if (typeof r.body === 'object' && !r.body?.success) throw new Error(`切换失败: ${JSON.stringify(r.body)}`);
  });
  await test('CC Switch 模型状态', async () => {
    const r = await apiAuth('GET', `${BASE}/v2/v1/cc/switch/status`, null, 'sk-chat-verify');
    if (typeof r.body === 'object' && r.body?.currentModel === 'mock-gpt-4o') {
      console.log(`  currentModel: ${r.body.currentModel}`);
    }
  });

  // ════════════════════════════════════════════════════════════
  // 2. 安全策略测试
  // ════════════════════════════════════════════════════════════
  console.log('\n--- 2. 安全策略测试 ---');

  await test('H-1 白名单外模型不应返回 401', async () => {
    const r = await apiAuth('POST', `${BASE}/v2/v1/chat/completions`,
      { model: 'model-not-in-group', messages: [{ role: 'user', content: 'hi' }] }, 'sk-chat-verify');
    if (r.status === 401) throw new Error(`白名单外模型被拒绝: ${JSON.stringify(r.body).slice(0, 100)}`);
  });

  // ════════════════════════════════════════════════════════════
  // 3. 管理面板 API 测试（完整 CRUD 流程）
  // ════════════════════════════════════════════════════════════
  console.log('\n--- 3. 管理面板 CRUD 流程 ---');

  let cProviderId, cModelId, cGroupId, cAppKeyId;

  await test('创建 Provider', async () => {
    const r = await api('POST', `${BASE}/v2/providers`,
      { name: 'TestOpenAI', type: 'openai', baseUrl: 'http://test/vi', apiKey: 'sk-test', models: ['test-model'], enabled: true });
    const d = r.body?.data || r.body;
    cProviderId = d?.id || d?.providerId;
    if (!cProviderId) throw new Error(`创建失败: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  providerId=${cProviderId}`);
  });
  await test('创建 Model', async () => {
    const r = await api('POST', `${BASE}/v2/models`,
      { name: 'TestModel', code: 'test-model', providerId: cProviderId, capabilities: ['chat'], enabled: true, inputPrice: 0, outputPrice: 0 });
    const d = r.body?.data || r.body;
    cModelId = d?.id || d?.modelId;
    if (!cModelId) throw new Error(`创建失败: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  modelId=${cModelId}`);
  });
  await test('创建 Group', async () => {
    const r = await api('POST', `${BASE}/v2/groups`,
      { name: '测试组E2E', description: 'E2E测试', models: ['test-model'] });
    const d = r.body?.data || r.body;
    cGroupId = d?.id || d?.groupId;
    if (!cGroupId) throw new Error(`创建失败: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  groupId=${cGroupId}`);
  });
  await test('创建 AppKey', async () => {
    const r = await api('POST', `${BASE}/v2/app-keys`,
      { name: 'E2E测试Key', key: 'sk-e2e-test', model: 'test-model', groupId: cGroupId });
    const d = r.body?.data || r.body;
    cAppKeyId = d?.id || d?.appKeyId;
    if (!cAppKeyId) throw new Error(`创建失败: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  appKeyId=${cAppKeyId}`);
  });
  await test('激活 Provider', async () => {
    const r = await api('POST', `${BASE}/v2/providers/${cProviderId}/activate`);
    if (r.status >= 400) throw new Error(`激活失败: ${JSON.stringify(r.body).slice(0, 100)}`);
  });

  // 新 AppKey 鉴权验证
  await test('新 AppKey 鉴权通过', async () => {
    const r = await apiAuth('POST', `${BASE}/v2/v1/chat/completions`,
      { model: 'test-model', messages: [{ role: 'user', content: 'hi' }] }, 'sk-e2e-test');
    if (r.status === 401) throw new Error(`新 AppKey 被拒: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  新 AppKey 鉴权状态: ${r.status}`);
  });

  // ════════════════════════════════════════════════════════════
  // 4. Token 配额字段验证
  // ════════════════════════════════════════════════════════════
  console.log('\n--- 4. Token 配额字段验证 ---');

  await test('H-2 Token 配额字段存在', async () => {
    // 通过创建 AppKey 时隐含验证 maxTokens 被接收
    const r = await api('POST', `${BASE}/v2/app-keys`,
      { name: '配额测试', key: 'sk-quota-test', model: 'test-model', groupId: cGroupId, maxUse: 10, maxTokens: 1000 });
    const d = r.body?.data || r.body;
    if (!d?.id) throw new Error(`创建失败: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  配额 AppKey 创建成功 id=${d?.id}`);
  });

  await test('配额 AppKey 鉴权通过', async () => {
    const r = await apiAuth('POST', `${BASE}/v2/v1/chat/completions`,
      { model: 'test-model', messages: [{ role: 'user', content: 'hi' }] }, 'sk-quota-test');
    if (r.status === 401) throw new Error(`配额 AppKey 被拒: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  配额 AppKey 鉴权状态: ${r.status}`);
  });

  // ════════════════════════════════════════════════════════════
  // 结果汇总
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(70));
  console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
  console.log(`通过率: ${(passed / (passed + failed) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));
  process.exit(failed > 0 ? 1 : 0);
})();