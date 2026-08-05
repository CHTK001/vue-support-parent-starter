// 远程桌面测试 - vue-support-remote-starter 前端 (Vue3 + ElementPlus)
import { chromium } from 'playwright';

const agentRes = await fetch('http://127.0.0.1:3000/api/agents').then(r => r.json());
const agent = agentRes.find(a => a.ipAddress === '127.0.0.1') || agentRes[0];
if (!agent) { console.log('NO AGENT'); process.exit(1); }
console.log('Using agent:', agent.agentId, 'verifyCode=', agent.verifyCode);

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', m => console.log('console:', m.text()));
page.on('pageerror', e => console.log('error:', e.message));
page.on('websocket', ws => {
  console.log('WS open:', ws.url());
  ws.on('framereceived', f => console.log('WS recv:', f.payload.length, 'bytes'));
  ws.on('framesent', f => console.log('WS send:', f.payload.length, 'bytes'));
});

await page.goto('http://127.0.0.1:28849/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.el-form-item', { timeout: 30000 });
await page.waitForTimeout(3000);

console.log('Title:', await page.title());

// 通过 ElementPlus label 找到 "目标 ID" / "验证码" 字段（其内部 <input>）
async function fillByLabel(label, value) {
  const ok = await page.evaluate(({ label, value }) => {
    const items = Array.from(document.querySelectorAll('.el-form-item'));
    for (const item of items) {
      const lbl = item.querySelector('.el-form-item__label');
      if (lbl && lbl.textContent && lbl.textContent.trim().includes(label)) {
        const input = item.querySelector('input');
        if (input) {
          input.focus();
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
          return true;
        }
      }
    }
    return false;
  }, { label, value });
  return ok;
}

let ok;
ok = await fillByLabel('目标 ID', agent.agentId);
console.log('fill 目标 ID:', ok);
ok = await fillByLabel('验证码', agent.verifyCode);
console.log('fill 验证码:', ok);

await page.waitForTimeout(500);

// 强制覆盖 Gateway 地址（页面第一个 input）为 8081
for (let i = 0; i < 10; i++) {
  const r = await page.evaluate(() => {
    const inp = document.querySelectorAll('.connection-settings input')[0];
    if (!inp) return { found: false, nAll: document.querySelectorAll('input').length, body: document.body.innerText.slice(0, 200) };
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, 'ws://127.0.0.1:8081');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.dispatchEvent(new Event('blur', { bubbles: true }));
    return { found: true, value: inp.value };
  });
  console.log('Gateway set:', JSON.stringify(r));
  if (r && r.found) break;
  await page.waitForTimeout(500);
}

await page.waitForTimeout(500);

// 点击连接按钮（ElementPlus 类型="primary" 含文字"连接"）
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button.connect-btn'));
  for (const b of btns) {
    if (b.textContent.includes('连接')) { b.click(); return; }
  }
});
console.log('clicked 连接');

// 等到 DesktopViewer 渲染（检测 video/canvas 出现）
await page.waitForFunction(() => {
  return document.querySelector('canvas,video,.desktop-viewer,.desktop-canvas') !== null
    || document.body.textContent.includes('已连接');
}, { timeout: 30000 });

// 等到 canvas 真的有非空内容（通过 getContext 读一像素验证）
await page.waitForFunction(() => {
  const c = document.querySelector('canvas');
  if (!c) return false;
  if (c.width < 100 || c.height < 100) return false;
  try {
    const ctx = c.getContext('2d');
    if (!ctx) return false;
    const d = ctx.getImageData(c.width/2, c.height/2, 1, 1).data;
    return d[0] !== 0 || d[1] !== 0 || d[2] !== 0;
  } catch { return false; }
}, { timeout: 30000 }).catch(() => console.log('canvas content wait timeout'));

await page.waitForTimeout(3000);

await page.screenshot({ path: 'D:/ch/project/remote_screen.png', fullPage: false });
console.log('saved remote_screen.png');

// 抓 FPS 文本
const fpsText = await page.evaluate(() => {
  const m = document.body.innerText.match(/(\d+)\s*fps/);
  return m ? m[0] : 'no fps';
});
console.log('FPS:', fpsText);

await browser.close();
console.log('DONE');
