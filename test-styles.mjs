import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:7788', { timeout: 20000, waitUntil: 'networkidle' });
  await p.waitForSelector('.connection-form', { timeout: 15000 });
  await p.waitForTimeout(2000);
  const styles = await p.$eval('.connection-form', el => {
    const s = getComputedStyle(el);
    return {
      borderRadius: s.borderRadius,
      border: s.border,
      padding: s.padding,
      background: s.background,
      display: s.display,
      gap: s.gap,
    };
  });
  console.log('connection-form 样式:', JSON.stringify(styles, null, 2));
  // 检查页面整体布局
  const body = await p.$$eval('div', els => els.slice(0, 20).map(e => ({ cls: e.className.slice(0, 60), h: e.getBoundingClientRect().height })));
  console.log('前 20 个 div:', JSON.stringify(body, null, 2));
  await p.screenshot({ path: 'G:/work/test-shots/01-home.png' });
  await b.close();
})();