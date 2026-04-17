import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  const results = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/v2/project')) {
      try {
        const body = await res.json().catch(() => null);
        results.push({ url, status: res.status(), body });
      } catch {}
    }
  });

  try {
    // 先打开页面让 cookie/session 初始化
    await page.goto('http://localhost:8868', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 直接通过 fetch 调用接口（走 vite proxy，会带上正确的 header）
    console.log('测试 GET /v2/devops/project/list ...');
    const listResult = await page.evaluate(async () => {
      const res = await fetch('/v2/devops/project/list?version=1.0.0');
      return { status: res.status, body: await res.json().catch(() => null) };
    });
    console.log('  status:', listResult.status);
    console.log('  body:', JSON.stringify(listResult.body));

    console.log('\n测试 POST /v2/devops/project/save ...');
    const saveResult = await page.evaluate(async () => {
      const res = await fetch('/v2/devops/project/save?version=1.0.0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: '测试项目001', status: 1, sortOrder: 0 }),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    });
    console.log('  status:', saveResult.status);
    console.log('  body:', JSON.stringify(saveResult.body));

    if (saveResult.body?.code === '00000') {
      const projectId = saveResult.body?.data?.projectId;
      console.log('  ✅ 保存成功，projectId:', projectId);

      // 测试 list 再次查询
      const listResult2 = await page.evaluate(async () => {
        const res = await fetch('/v2/devops/project/list?version=1.0.0');
        return { status: res.status, body: await res.json().catch(() => null) };
      });
      console.log('\n再次查询列表:');
      console.log('  count:', listResult2.body?.data?.length);
      console.log('  first:', JSON.stringify(listResult2.body?.data?.[0]));
    }

    console.log('\n✅ 完成');
  } catch (err) {
    console.error('❌ 失败:', err.message);
  } finally {
    await browser.close();
  }
})();
