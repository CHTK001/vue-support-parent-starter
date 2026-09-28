// 验证：ReFlowGraph 从 40×40 图标徽章节点重构为 180×36 横向卡片（x6-vue-shape）后的行为。
//
// 覆盖 pw-dag-practice.mjs 断言不到的 6 点（那些是官方 DAG 规则层面的，本脚本是渲染层面）：
//   1. 节点体是真实 DOM（foreignObject + .flow-node-card），不再是一坨自绘 SVG 徽章。
//   2. 卡片 DOM 尺寸 = 180×36（shapes.ts 的 NODE_WIDTH/NODE_HEIGHT），不是 40×40。
//   3. 卡片上的文字 = 节点 data 里的显示名（不是写死在模板里）。
//   4. 改名后卡片文字跟着变 —— 这一条真正验证 FlowNodeCard 自己订阅的 change:data。
//      x6-vue-shape 的 node 是普通 prop、NodeView.confirmUpdate 不会因 setData 带 vue action
//      而重渲（见 @antv/x6-vue-shape/es/view.js），所以若不订阅，改名在画面上不会有任何反应。
//   5. 端口静止 opacity:0、节点 hover 后 opacity:1（原 CSS 只有隐藏、没有放回规则，
//      注释声称有实为无，是真实缺陷）。
//   6. exportPNG 导出的 PNG 非空白 —— foreignObject 能否被 X6 的 toPNG 光栅化。
//
// 选择器一律限定 .flow-canvas .x6-graph-svg：小地图里也渲染了一份 0×0 的同名节点，不加限定会数两遍。
import { chromium } from 'playwright';

// 基址从 PW_BASE 读：应用的 vite.config 里 strictPort:false，端口被占时会顺延，
// 由 pw-run.mjs 从 vite 的 stdout 里解析出实际端口后注入，避免脚本打到别人的旧实例上。
const BASE = process.env.PW_BASE || 'http://localhost:19096';
const MAIN = '.flow-canvas .x6-graph-svg';
const fails = [];
let pass = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass += 1; } else { fails.push(name); }
  console.log(`  [${cond ? 'PASS' : 'FAIL'}] ${name}${detail ? '  -> ' + detail : ''}`);
  return cond;
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 950 },
  locale: 'zh-CN',
  acceptDownloads: true,
});
const page = await ctx.newPage();
const jsErr = [];
page.on('pageerror', (e) => jsErr.push(String(e).slice(0, 200)));

const scaleOf = () => page.evaluate((m) => {
  const t = document.querySelector(`${m} .x6-graph-svg-viewport`);
  if (!t) return 1;
  const tr = t.getAttribute('transform') || '';
  const sc = tr.match(/scale\(\s*([\d.]+)/);
  if (sc) return Number(sc[1]);
  const m2 = tr.match(/matrix\(\s*(-?[\d.]+)/);
  return m2 ? Number(m2[1]) : 1;
}, MAIN);

const nodeBox = (id) => page.evaluate(([m, nid]) => {
  const el = document.querySelector(`${m} .x6-node[data-cell-id="${nid}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) };
}, [MAIN, id]);

console.log('=== 0. 登录并打开流程设计器 ===');
// 入口必须是「根路径 + hash」，不能写成 /collect/design?flowId=1 这种路径式深链：
// createVite 的 devIndexTemplate 只对 "/" 与 "/index.html" 返回公共模板，刻意不做任意路径的
// SPA fallback（否则会把 /collect/api/** 代理路径吞成 index.html），路径式深链直接 404。
// 实测 19096 上 "/" 返回 200，而 "/collect/design?flowId=1" 返回 404。
await page.goto(BASE + '/#/collect/design?flowId=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
// waitForFunction 签名是 (fn, arg, options)：旧代码把 options 写在第二参会被当成 arg，
// 180s 超时从未生效、一直用默认 30s，故深链首次加载时经常假超时。
await page.waitForFunction(() => {
  const a = document.querySelector('#app');
  return !!a && a.children.length > 0 && (document.body.innerText || '').length > 50;
}, null, { timeout: 180000 });
// 登录页的输入框靠 placeholder 区分（见 pw-diag-login.mjs 实测：无 name/id，
// username 是 input[type=text]、password 是 input[type=password]），按钮文案是「登录」。
if ((await page.locator('input[type="password"]').count()) > 0) {
  await page.locator('input[type="text"]').first().fill('sa');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button').filter({ hasText: '登录' }).first().click();
  await page.waitForTimeout(8000);
  // 登录后必须「整页重载」再进设计路由，不能只改 location.hash。
  // 原因：登录成功会跳 #/collect/dashboard，而 DashboardView 里的 ReTable 目前有并发会话
  // 正在修的 TDZ 缺陷（ReTable.vue:1386 注释自述 "Cannot access 'dataList' before
  // initialization"），一旦挂载就抛未捕获错误把整个 RouterView 打白屏 —— 同路由内改 hash
  // 绕不开。整页重载时 token 已在 storage 里，路由守卫直接放行，Dashboard 根本不会挂载。
  // 这是在别人的缺陷修好之前仍能验收本组件的隔离手段，不改动 ReTable。
  await page.goto(BASE + '/#/collect/design?flowId=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);
}
await page.waitForFunction(() => !!document.querySelector('.flow-shell'), null, { timeout: 90000 }).catch(() => {});
await page.waitForTimeout(8000);
console.log(`  当前 URL: ${page.url()}`);
if (!(await check('设计器已挂载', (await page.locator('.flow-shell').count()) > 0))) {
  await browser.close();
  process.exit(1);
}
// 点空白清选中，免得连线工具/选中态盖住节点
await page.mouse.click(60, 300);
await page.waitForTimeout(500);

const nodeIds = await page.evaluate((m) => Array.from(document.querySelectorAll(`${m} .x6-node`))
  .map((n) => n.getAttribute('data-cell-id')), MAIN);
const nodeN = nodeIds.length;
check('画布上有节点可供取样', nodeN > 0, `${nodeN} 个`);
if (!nodeN) {
  await browser.close();
  process.exit(1);
}
const id0 = nodeIds[0];

console.log('\n=== 1. 节点体是 foreignObject 里的真实 DOM（vue-shape），不是自绘 SVG 徽章 ===');
const foN = await page.locator(`${MAIN} .x6-node foreignObject`).count();
const cardN = await page.locator(`${MAIN} .x6-node foreignObject .flow-node-card`).count();
const iconN = await page.locator(`${MAIN} .x6-node foreignObject .flow-node-icon svg path`).count();
console.log(`  foreignObject ${foN} / 卡片 ${cardN} / 图标 path ${iconN}（节点 ${nodeN}）`);
check('每个节点都有一个 foreignObject', foN === nodeN, `${foN}/${nodeN}`);
check('foreignObject 内挂载了 FlowNodeCard 组件根节点', cardN === nodeN, `${cardN}/${nodeN}`);
check('卡片左侧有 20×20 图标块（vue-shape 渲染出真实 svg）', iconN === nodeN, `${iconN}/${nodeN}`);
check('旧的自绘徽章节点已不存在', (await page.locator(`${MAIN} .x6-node .badge`).count()) === 0
  && (await page.locator(`${MAIN} .x6-node .x6-node-badge`).count()) === 0);

console.log('\n=== 2. 卡片 DOM 尺寸 180×36（shapes.ts 的 NODE_WIDTH/NODE_HEIGHT）===');
const scale = await scaleOf();
const box = await nodeBox(id0);
// 量三层：X6 节点 <g> 的墨迹包围盒、foreignObject 本身、卡片根 div。
// 必须分清：getBoundingClientRect 取的是 SVG 的「墨迹」范围（含描边），
// 而 NODE_WIDTH/HEIGHT 约束的是 foreignObject / 卡片盒，二者不是一个量。
const geom = await page.evaluate(([m, nid]) => {
  const g = document.querySelector(`${m} .x6-node[data-cell-id="${nid}"]`);
  if (!g) return null;
  const fo = g.querySelector('foreignObject');
  const card = g.querySelector('.flow-node-card');
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { w: Math.round(b.width), h: Math.round(b.height) };
  };
  // 把 <g> 下每个直接子元素的尺寸也列出来，好看清多出来的 8px 来自谁
  const kids = Array.from(g.children).map((el) => {
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: (el.getAttribute('class') || '').slice(0, 40),
      w: Math.round(b.width),
      h: Math.round(b.height),
      stroke: cs.stroke,
      strokeWidth: cs.strokeWidth,
    };
  });
  return {
    group: r(g),
    foAttr: fo ? { w: Number(fo.getAttribute('width')), h: Number(fo.getAttribute('height')) } : null,
    foRect: r(fo),
    cardRect: r(card),
    kids,
  };
}, [MAIN, id0]);
console.log(`  画布 scale=${scale}，节点 ${id0}`);
if (geom) {
  console.log(`  <g class=x6-node> 墨迹盒   : ${geom.group.w}×${geom.group.h}`);
  console.log(`  foreignObject 属性/实测    : ${geom.foAttr ? `${geom.foAttr.w}×${geom.foAttr.h}` : '无'} / ${geom.foRect ? `${geom.foRect.w}×${geom.foRect.h}` : '无'}`);
  console.log(`  .flow-node-card 实测       : ${geom.cardRect ? `${geom.cardRect.w}×${geom.cardRect.h}` : '无'}`);
  geom.kids.forEach((k) => console.log(`    子元素 <${k.tag} class="${k.cls}"> ${k.w}×${k.h} stroke=${k.stroke} stroke-width=${k.strokeWidth}`));
}
check('节点屏幕尺寸可读', !!box && box.w > 0);
if (geom && geom.foAttr && geom.cardRect) {
  const foW = geom.foAttr.w / scale;
  const foH = geom.foAttr.h / scale;
  console.log(`  还原到画布局部坐标：foreignObject ${foW.toFixed(2)}×${foH.toFixed(2)}`);
  check('foreignObject 宽 = 180（改动前是 40，可证伪）', Math.abs(foW - 180) <= 0.5, `${foW.toFixed(2)}`);
  check('foreignObject 高 = 36（改动前是 40，可证伪）', Math.abs(foH - 36) <= 0.5, `${foH.toFixed(2)}`);
  const cardW = geom.cardRect.w / scale;
  const cardH = geom.cardRect.h / scale;
  check('卡片根 div 铺满 foreignObject（180×36）',
    Math.abs(cardW - foW) <= 1 && Math.abs(cardH - foH) <= 1,
    `${cardW.toFixed(2)}×${cardH.toFixed(2)}`);
  check('卡片确实是横向卡片（宽 > 高，改动前是正方形）', foW > foH * 3, `宽高比 ${(foW / foH).toFixed(2)}`);
  // 端口 <g>（8×8）挂在卡片边框中点上，各向外探出 4px，所以 <g> 的墨迹盒必然比
  // foreignObject 大 8×8。这不是缺陷，测尺寸必须量 foreignObject / 卡片 div，不能量 <g>。
  console.log(`  注：<g> 的 ${geom.group.w}×${geom.group.h} 是 foreignObject 加上四个 8×8 端口 <g> `
    + `（各向外探出 4px），故大 ${geom.group.w - geom.foAttr.w}×${geom.group.h - geom.foAttr.h}，属预期`);
}

console.log('\n=== 3. 四向磁吸端口齐全且在卡片边框中点 ===');
const ports = await page.evaluate(([m, nid]) => {
  const want = ['top', 'right', 'bottom', 'left'];
  return want.map((p) => {
    const el = document.querySelector(`${m} .x6-node[data-cell-id="${nid}"] circle.x6-port-body[port="${p}"]`);
    if (!el) return { p, ok: false };
    const r = el.getBoundingClientRect();
    return { p, ok: r.width > 0, x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
}, [MAIN, id0]);
console.log('  ' + ports.map((x) => `${x.p}=${x.ok ? '有' : '无'}`).join(' '));
check('top/right/bottom/left 四个端口都在（持久化数据里可能是 left/right，不能砍）',
  ports.every((x) => x.ok), ports.filter((x) => x.ok).map((x) => x.p).join(','));

console.log('\n=== 4. 端口静止隐藏、节点 hover 后淡入（原 CSS 缺放回规则，是真实缺陷）===');
const opacityOf = () => page.evaluate(([m, nid]) => {
  const el = document.querySelector(`${m} .x6-node[data-cell-id="${nid}"] circle.x6-port-body[port="right"]`);
  return el ? Number(getComputedStyle(el).opacity) : null;
}, [MAIN, id0]);
await page.mouse.move(20, 300);
await page.waitForTimeout(500);
const opOff = await opacityOf();
console.log(`  移开时 opacity=${opOff}`);
await page.mouse.move(box.cx, box.cy);
await page.waitForTimeout(500);
const opOn = await opacityOf();
console.log(`  悬停时 opacity=${opOn}`);
check('未悬停时端口不可见（opacity 0）', opOff !== null && opOff < 0.05, `opacity=${opOff}`);
check('悬停节点后端口淡入（opacity 1）', opOn !== null && opOn > 0.95, `opacity=${opOn}`);

console.log('\n=== 5. 改名后卡片文字跟着变（验证 change:data 订阅，vue-shape 自己不会重渲）===');
await page.mouse.move(box.cx, box.cy);
await page.mouse.click(box.cx, box.cy);
await page.waitForTimeout(900);
const labelSel = `${MAIN} .x6-node[data-cell-id="${id0}"] .flow-node-label`;
const before = (await page.locator(labelSel).first().textContent() || '').trim();
const nameInput = page.locator('.field', { hasText: '节点名称' }).locator('input').first();
const hasPanel = (await nameInput.count()) > 0;
if (!check('选中节点后属性面板出现「节点名称」输入框', hasPanel)) {
  await browser.close();
  process.exit(1);
}
const NEW = '验收改名_Z9';
await nameInput.fill(NEW);
await page.waitForTimeout(1200);
const after = (await page.locator(labelSel).first().textContent() || '').trim();
console.log(`  卡片文字：${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
check('改名前卡片文字 = 原显示名', before.length > 0, JSON.stringify(before));
check('改名后卡片文字已更新为新名（change:data 订阅生效）', after === NEW, `实际 ${JSON.stringify(after)}`);
const titleAttr = await page.locator(labelSel).first().getAttribute('title');
check('卡片 title 属性同步为完整显示名（未截断时可读）', titleAttr === NEW, `title=${JSON.stringify(titleAttr)}`);

console.log('\n=== 6. 类型标签判据：与显示名不同才占位 ===');
const kind = await page.evaluate(([m, nid]) => {
  const el = document.querySelector(`${m} .x6-node[data-cell-id="${nid}"] .flow-node-kind`);
  const label = document.querySelector(`${m} .x6-node[data-cell-id="${nid}"] .flow-node-label`);
  return { kind: el ? el.textContent.trim() : null, label: label ? label.textContent.trim() : null };
}, [MAIN, id0]);
console.log(`  类型标签 ${JSON.stringify(kind.kind)} / 显示名 ${JSON.stringify(kind.label)}`);
check('改名后类型标签重新出现（不再与显示名重复而被隐藏）', !!kind.kind && kind.kind !== kind.label,
  `kind=${JSON.stringify(kind.kind)} label=${JSON.stringify(kind.label)}`);

console.log('\n=== 7. exportPNG 导出的 PNG 非空白（foreignObject 能否被 X6 toPNG 光栅化）===');
const dl = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
await page.locator('button', { hasText: '导出图片' }).first().click();
const download = await dl;
let pngInfo = null;
if (download) {
  const p = await download.path();
  const buf = p ? Buffer.from(await (await import('node:fs/promises')).readFile(p)) : null;
  if (buf) {
    // 交给浏览器自己解码：把 dataURL 塞进 Image 画到 canvas 上数非白像素
    pngInfo = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let nonWhite = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250) nonWhite += 1;
      }
      return { w: c.width, h: c.height, nonWhite, total: d.length / 4 };
    }, buf.toString('base64'));
  }
}
console.log('  ' + JSON.stringify(pngInfo));
check('导出图片触发了下载', !!download, download ? download.suggestedFilename() : '未触发');
check('PNG 尺寸可解码', !!pngInfo && pngInfo.w > 0 && pngInfo.h > 0, pngInfo ? `${pngInfo.w}×${pngInfo.h}` : '无');
// 关键断言：若浏览器不渲染 SVG-as-image 里的 foreignObject，导出的图会「有连线、无节点卡片」，
// 画布大片留白 -> 非白像素比例极低。所以这里要求节点卡片区域必须着上色。
check('PNG 非空白：非白像素比例 > 0.5%（foreignObject 已被光栅化）',
  !!pngInfo && pngInfo.nonWhite / pngInfo.total > 0.005,
  pngInfo ? `${((pngInfo.nonWhite / pngInfo.total) * 100).toFixed(3)}%` : '无');

console.log('\n=== 8. JS 错误 ===');
check('全程无 JS 错误', jsErr.length === 0, jsErr.length ? JSON.stringify(jsErr) : '无');

console.log(`\n===== 汇总：通过 ${pass} / ${pass + fails.length} =====`);
if (fails.length) console.log('未通过: ' + fails.join(' | '));
await browser.close();
process.exit(fails.length ? 1 : 0);
