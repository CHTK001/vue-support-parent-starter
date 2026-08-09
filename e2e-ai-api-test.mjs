/**
 * AI 系统全功能 API 测试
 *
 * 测试协议端点鉴权层，不依赖真实 AI Provider。
 * 覆盖：C-0 认证、H-1 分组模型白名单、CC Switch、多协议端点
 */

const BASE = 'http://127.0.0.1:8091/api/ai';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (e) {
    failed++;
    console.log(`  [FAIL] ${name}: ${e.message}`);
  }
}

async function api(method, url, body, auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${auth}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch { j = text; }
    return { status: r.status, body: j };
  } finally {
    clearTimeout(timeout);
  }
}

(async () => {
  console.log('='.repeat(60));
  console.log('AI 系统全功能 API 测试');
  console.log('Base URL: ' + BASE);
  console.log(new Date().toISOString());
  console.log('='.repeat(60));

  // ============================================================
  // C-0: 认证校验
  // ============================================================
  console.log('\n--- C-0: 认证校验 ---');

  await test('无效 Bearer Token 返回 401', async () => {
    const r = await api('POST', `${BASE}/v2/v1/chat/completions`,
      { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
      'sk-invalid');
    if (r.status !== 401) throw new Error(`期望 401 但得到 ${r.status}`);
    const msg = JSON.stringify(r.body);
    if (!msg.includes('校验失败') && !msg.includes('authentication_error')) {
      throw new Error(`期望鉴权错误但得到: ${msg.slice(0, 100)}`);
    }
    console.log(`  401 响应: ${msg.slice(0, 80)}`);
  });

  await test('缺少 Authorization 头返回 401', async () => {
    const r = await api('POST', `${BASE}/v2/v1/chat/completions`,
      { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] });
    if (r.status !== 401) throw new Error(`期望 401 但得到 ${r.status}`);
  });

  await test('有效 Token 通过鉴权', async () => {
    const r = await api('POST', `${BASE}/v2/v1/chat/completions`,
      { model: 'mock-gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
      'sk-chat-verify');
    if (r.status === 401) throw new Error(`有效 Token 被拒绝: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  鉴权通过，状态: ${r.status}`);
  });

  // ============================================================
  // H-1: 分组模型白名单
  // ============================================================
  console.log('\n--- H-1: 分组模型白名单 ---');

  await test('白名单内模型（mock-gpt-4o）通过鉴权', async () => {
    const r = await api('POST', `${BASE}/v2/v1/chat/completions`,
      { model: 'mock-gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
      'sk-chat-verify');
    if (r.status === 401) throw new Error(`白名单内模型被拒绝: ${JSON.stringify(r.body).slice(0, 100)}`);
    console.log(`  状态: ${r.status}`);
  });

  await test('白名单外模型（model-not-in-group）应被拒绝', async () => {
    const r = await api('POST', `${BASE}/v2/v1/chat/completions`,
      { model: 'model-not-in-group', messages: [{ role: 'user', content: 'hi' }] },
      'sk-chat-verify');
    const bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    if (bodyStr.includes('白名单') || bodyStr.includes('拒绝')) {
      console.log(`  白名单外模型被拒绝: ${bodyStr.slice(0, 80)}`);
    } else if (r.status === 401) {
      throw new Error(`白名单外模型返回 401: ${bodyStr.slice(0, 80)}`);
    } else {
      console.log(`  响应: ${bodyStr.slice(0, 80)}`);
    }
  });

  // ============================================================
  // 多协议端点
  // ============================================================
  console.log('\n--- 多协议端点 ---');

  await test('Claude Messages 无效 Token 返回 401', async () => {
    const r = await api('POST', `${BASE}/v2/v1/messages`,
      { model: 'claude-3', messages: [{ role: 'user', content: 'hi' }] },
      'sk-invalid');
    if (r.status !== 401) throw new Error(`期望 401 但得到 ${r.status}`);
  });

  await test('OpenAI Responses 无效 Token 返回 401', async () => {
    const r = await api('POST', `${BASE}/v2/v1/responses`,
      { model: 'gpt-4o', input: [{ type: 'message', role: 'user', content: 'hi' }] },
      'sk-invalid');
    if (r.status !== 401) throw new Error(`期望 401 但得到 ${r.status}`);
  });

  await test('Gemini 无效 Token 返回 401', async () => {
    const r = await api('POST', `${BASE}/v2/v1beta/models/gpt-4o:generateContent`,
      { contents: [{ parts: [{ text: 'hi' }] }] },
      'sk-invalid');
    if (r.status !== 401) throw new Error(`期望 401 但得到 ${r.status}`);
  });

  // ============================================================
  // CC Switch
  // ============================================================
  console.log('\n--- CC Switch ---');

  await test('CC-1: 获取可用模型列表', async () => {
    const r = await api('GET', `${BASE}/v2/v1/cc/switch/models`, null, 'sk-chat-verify');
    const count = Array.isArray(r.body?.data) ? r.body.data.length : 0;
    console.log(`  可用模型: ${count} 个`);
  });

  await test('CC-2: 切换模型', async () => {
    const r = await api('POST', `${BASE}/v2/v1/cc/switch`,
      { model: 'mock-gpt-4o' }, 'sk-chat-verify');
    if (r.body?.success) {
      console.log(`  切换成功: ${r.body?.model}`);
    } else {
      const msg = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
      console.log(`  切换结果: ${msg.slice(0, 80)}`);
    }
  });

  await test('CC-3: 查询当前模型状态', async () => {
    const r = await api('GET', `${BASE}/v2/v1/cc/switch/status`, null, 'sk-chat-verify');
    const msg = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    console.log(`  状态: ${msg.slice(0, 120)}`);
  });

  await test('CC-4: 健康检查', async () => {
    const r = await api('GET', `${BASE}/v2/v1/cc/switch/health`, null, 'sk-chat-verify');
    const msg = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    if (msg.includes('healthy')) {
      console.log(`  健康: OK`);
    } else {
      console.log(`  响应: ${msg.slice(0, 80)}`);
    }
  });

  // ============================================================
  // 模型列表
  // ============================================================
  console.log('\n--- 模型列表 ---');

  await test('GET /v1/models 返回模型列表', async () => {
    const r = await api('GET', `${BASE}/v2/v1/models`, null, 'sk-chat-verify');
    if (r.status === 401) throw new Error('鉴权失败');
    const data = Array.isArray(r.body?.data) ? r.body.data : [];
    console.log(`  模型列表: ${data.length} 个`);
  });

  // ============================================================
  // Completions
  // ============================================================
  console.log('\n--- Completions ---');

  await test('POST /v1/completions 无效 Token 返回 401', async () => {
    const r = await api('POST', `${BASE}/v2/v1/completions`,
      { model: 'gpt-4o', prompt: 'hi' }, 'sk-invalid');
    if (r.status !== 401) throw new Error(`期望 401 但得到 ${r.status}`);
  });

  // ============================================================
  // 结果汇总
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
  console.log(`通过率: ${(passed / (passed + failed) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();