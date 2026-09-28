// 验证：ReFlowGraph 按 X6 官方 DAG 示例（x6.antv.antgroup.com/examples/showcase/practices/#dag，
// 源码 site/examples/showcase/practices/demo/dag.tsx）对齐后的行为。
//
// 断言口径的教训（2026-09-28 实测，务必先读）：
//   端口到端口的合成拖拽在这个无头环境里落点不稳定，不能用来断言方向规则。
//   证据：改动前/后各跑一次 4x4 穷举（各 32 次拖拽），两版都是「16 组里恰好 1 组能连」，
//   且命中的组合不同（旧的 A.top->B.right，新的 A.right->B.right）；diag3 里 left->right
//   成功、diag4 里同一组合又失败。结论：这是落点问题，不是产品行为。
//   因此方向规则改为抽成纯函数 internals/dagRules.ts，用 .tmp/dag-rules-check.mjs
//   直接编译真源码验（32/32），不在这里重复断言。
//   本脚本只保留「不依赖落点」的观测点。
//
// 可靠观测点（每条都能证伪）：
//   1. 拖拽中途出现 stroke-dasharray="5 5" 的预览边 => createEdge 的官方虚线预览已生效。
//      改动前没有这条虚线，能证伪。
//   2. 落成的边是实线、且图中「6 4 虚线」计数不增 => edge:connected 按语义重绘生效。
//      若照抄官方那样无脑清 strokeDasharray，会把 6 4 的边也抹平（语义是「不传递变量」）。
//   3. ctrl+滚轮放大/缩小分别夹在 1.5 / 0.5 => 新 minScale/maxScale 生效。
//      改动前是 2.5 / 0.3，能证伪。这条同时证明 engine.ts 的改动确实已上线。
//   4. 橡皮筋框选同时罩住 >=2 个节点 => rubberNode/rubberEdge 生效。
//   5. 原有连线一条不少、调色板可加节点、全程无 JS 错误。
//
// 选择器全部限定在 .flow-canvas .x6-graph-svg：小地图 .x6-widget-minimap 里也渲染了
// 一份同 id 的节点/连线（尺寸 0x0），不加限定会把每个元素数两遍（v1/v3 就栽在这）。
import { chromium } from 'playwright';

// 基址从 PW_BASE 读（端口可能因 strictPort:false 顺延，由 pw-run.mjs 解析后注入）。
const BASE = process.env.PW_BASE || 'http://localhost:19096';
const MAIN = '.flow-canvas .x6-graph-svg';
const fails = [];
let pass = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; } else { fails.push(name); }
  console.log(`  [${cond ? 'PASS' : 'FAIL'}] ${name}${detail ? '  -> ' + detail : ''}`);
  return cond;
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, locale: 'zh-CN' });
const page = await ctx.newPage();
const jsErr = [];
page.on('pageerror', (e) => jsErr.push(String(e).slice(0, 200)));

const edgeCount = () => page.locator(`${MAIN} .x6-edge`).count();
/** 统计「不传递变量」语义的虚线边（6 4），与预览虚线（5 5）区分开 */
const dashedCount = (dash) => page.locator(`${MAIN} .x6-edge path[stroke-dasharray="${dash}"]`).count();
const scaleOf = () => page.evaluate((m) => {
  const t = document.querySelector(`${m} .x6-graph-svg-viewport`);
  if (!t) return null;
  const tr = t.getAttribute('transform') || '';
  const sc = tr.match(/scale\(\s*([\d.]+)/);
  if (sc) return Number(sc[1]);
  const m2 = tr.match(/matrix\(\s*(-?[\d.]+)/);
  return m2 ? Number(m2[1]) : null;
}, MAIN);
const portAt = (id, p) => page.evaluate(([m, nid, pp]) => {
  const el = document.querySelector(`${m} .x6-node[data-cell-id="${nid}"] circle.x6-port-body[port="${pp}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width ? { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } : null;
}, [MAIN, id, p]);
const nodeAt = (id) => page.evaluate(([m, nid]) => {
  const el = document.querySelector(`${m} .x6-node[data-cell-id="${nid}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
}, [MAIN, id]);

console.log('=== 0. 登录并打开流程设计器 ===');
// 入口必须是「根路径 + hash」：createVite 的 devIndexTemplate 只对 "/" 与 "/index.html"
// 返回公共模板，刻意不做任意路径的 SPA fallback（否则会把 /collect/api/** 代理路径吞成
// index.html），所以 /collect/design?flowId=1 这种路径式深链直接 404。
await page.goto(BASE + '/#/collect/design?flowId=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
// waitForFunction 签名是 (fn, arg, options)：旧代码把 options 写在第二参会被当成 arg，
// 180s 超时从未生效、一直用默认 30s，故深链首次加载时经常假超时。
await page.waitForFunction(() => {
  const a = document.querySelector('#app');
  return !!a && a.children.length > 0 && (document.body.innerText || '').length > 50;
}, null, { timeout: 180000 });
if ((await page.locator('input[type="password"]').count()) > 0) {
  await page.locator('input[type="text"]').first().fill('sa');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button').filter({ hasText: '登录' }).first().click();
  await page.waitForTimeout(8000);
  // 登录后「整页重载」再进设计路由，不能只改 location.hash：登录成功会跳
  // #/collect/dashboard，一旦挂载 CollectDashboard 就有机会被它内部 ReTable 的缺陷打白屏
  // （全程不透明，见 pw-card-node.mjs 同处注释），同路由内改 hash 绕不开。
  // 整页重载时 token 已在 storage 里，守卫直接放行，Dashboard 根本不会挂载。
  await page.goto(BASE + '/#/collect/design?flowId=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);
}
await page.waitForFunction(() => !!document.querySelector('.flow-shell'), null, { timeout: 90000 }).catch(() => {});
await page.waitForTimeout(8000);
console.log(`  当前 URL: ${page.url()}`);
if (!(await check('设计器已挂载', (await page.locator('.flow-shell').count()) > 0))) {
  await browser.close(); process.exit(1);
}

const edges0 = await edgeCount();
const dashed64_0 = await dashedCount('6 4');
// 5 5 是「拖拽中的预览边」专用样式，正常状态下画布上不该有；
// 存成基线是为了第 3 节能断言「新连的边没有把预览虚线带下来」。
const dashed55_0 = await dashedCount('5 5');
const nodes0 = await page.locator(`${MAIN} .x6-node`).count();
console.log(`  主画布基线：节点 ${nodes0} 边 ${edges0}（其中 6 4 虚线 ${dashed64_0} 条，5 5 预览虚线 ${dashed55_0} 条）`);
check('载入后画布上不存在残留的 5 5 预览虚线', dashed55_0 === 0, `${dashed55_0} 条`);
check('原有连线已载入（数据通路未回归）', edges0 > 0, `${edges0} 条`);

console.log('\n=== 1. 从调色板加 4 个新节点（回归 addNode，并为后续取样提供无边节点）===');
const chips = page.locator('.flow-chip');
for (let i = 0; i < 4; i += 1) { await chips.nth(i).click(); await page.waitForTimeout(800); }
const nodes1 = await page.locator(`${MAIN} .x6-node`).count();
const fresh = await page.evaluate((m) => Array.from(document.querySelectorAll(`${m} .x6-node`))
  .map((n) => n.getAttribute('data-cell-id')), MAIN);
check('调色板点击可新增节点（addNode 未回归）', nodes1 === nodes0 + 4, `${nodes0} -> ${nodes1}`);
check('加节点未连带改动既有边', (await edgeCount()) === edges0 && (await dashedCount('6 4')) === dashed64_0,
  `边 ${edges0} -> ${await edgeCount()}，6 4 虚线 ${dashed64_0} -> ${await dashedCount('6 4')}`);

console.log('\n=== 2. 拖拽中途出现 5 5 虚线预览边（createEdge 官方虚线预览生效）===');
// 落点不稳定，但「起连」是稳的：diag3 实测 3 次拖拽预览边都出现。取新节点间 3 组尝试，
// 只要中途出现预览边即证明 createEdge 的虚线预览已上线（改动前不存在这条虚线）。
let sawPreview = false;
const previewProbe = async (from, fp, to, tp) => {
  const a = await portAt(from, fp);
  const b = await portAt(to, tp);
  if (!a || !b) return;
  await page.mouse.move(a.x, a.y);
  await page.waitForTimeout(140);
  await page.mouse.down();
  await page.waitForTimeout(140);
  const steps = 14;
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);
    await page.waitForTimeout(26);
  }
  await page.waitForTimeout(260);
  const n = await page.locator(`${MAIN} path[stroke-dasharray="5 5"]`).count();
  if (n > 0) sawPreview = true;
  await page.mouse.up();
  await page.waitForTimeout(700);
};
const [A, B, C, D] = fresh.slice(-4);
await previewProbe(A, 'bottom', B, 'top');
check('拖拽中途出现 5 5 虚线预览边（改动前无此虚线，可证伪）', sawPreview,
  // 报 sawPreview 而不是现读 DOM：现读是「松手后」的值，恒为 0，写出来会让人误判这条断言没生效
  `拖拽中途 sawPreview=${sawPreview}，松手后残留 ${await page.locator(`${MAIN} path[stroke-dasharray="5 5"]`).count()} 条`);
check('松手后预览边已消失（临时边不残留）', (await page.locator(`${MAIN} path[stroke-dasharray="5 5"]`).count()) === 0);

console.log('\n=== 3. 落成的边是实线、6 4 虚线计数不增（edge:connected 按语义重绘生效）===');
// 落点不稳定 -> 重试若干组合直到有一条真的连上，再对结果断言
const combos = [[A, 'bottom', B, 'top'], [A, 'right', B, 'right'], [C, 'right', D, 'right'],
  [A, 'left', B, 'right'], [C, 'bottom', D, 'top'], [A, 'bottom', C, 'right']];
let made = false;
for (const [f, fp, t, tp] of combos) {
  const n0 = await edgeCount();
  await previewProbe(f, fp, t, tp);
  if ((await edgeCount()) > n0) { made = true; break; }
}
const edges1 = await edgeCount();
const dashed64_1 = await dashedCount('6 4');
const dashed55_1 = await dashedCount('5 5');
console.log(`  边 ${edges0} -> ${edges1}，6 4 虚线 ${dashed64_0} -> ${dashed64_1}，5 5 预览虚线 ${dashed55_0} -> ${dashed55_1}`);
check('至少成功连上一条边（落点重试后仍应能连）', made, `边 ${edges0} -> ${edges1}`);
check('新连成的边为实线（6 4 语义虚线计数未增加）', edges1 > edges0 && dashed64_1 === dashed64_0,
  `6 4 虚线未增加 = ${dashed64_1 === dashed64_0}`);
// 这条是本轮实测抓出来的真缺陷，单列一条断言：
// edge:connected 里调 edge.setAttrs(flowEdgeAttrs(...)) 想把预览虚线抹掉，但 X6 的 setAttrs
// 是深合并，flowEdgeAttrs 在「传递变量」分支原本返回 strokeDasharray: undefined，
// undefined 删不掉已有的 "5 5"，结果每条新连的线都留着一段预览虚线，
// 视觉上像「没连完的临时线」。旧断言只查 6 4 计数，恰好漏掉，故此处显式查 5 5 必须归零。
check('新连成的边不残留 5 5 预览虚线（setAttrs 深合并陷阱）', dashed55_1 === 0,
  `5 5 虚线 ${dashed55_1} 条`);

console.log('\n=== 4. 橡皮筋框选罩住 >=2 个节点（rubberNode / rubberEdge 生效）===');
const p1 = await nodeAt(A);
const p2 = await nodeAt(B);
const wrap = await page.evaluate(() => {
  const el = document.querySelector('.flow-canvas-wrap');
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) };
});
const sx = Math.min(p1.x, p2.x) - 55;
const sy = Math.min(p1.y, p2.y) - 55;
const ex = Math.max(p1.x, p2.x) + 55;
const ey = Math.max(p1.y, p2.y) + 55;
if (sx > wrap.left && sy > wrap.top && ex < wrap.right && ey < wrap.bottom) {
  await page.mouse.move(sx, sy);
  await page.waitForTimeout(150);
  await page.mouse.down();
  const steps = 14;
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(sx + ((ex - sx) * i) / steps, sy + ((ey - sy) * i) / steps);
    await page.waitForTimeout(22);
  }
  await page.mouse.up();
  await page.waitForTimeout(600);
  const selN = await page.locator(`${MAIN} .x6-node-selected`).count();
  check('橡皮筋框选同时罩住 >=2 个节点（rubberNode）', selN >= 2, `选中 ${selN} 个`);
} else {
  check('橡皮筋框选同时罩住 >=2 个节点（rubberNode）', false, `拖拽区 [${sx},${sy}]-[${ex},${ey}] 越出画布`);
}

console.log('\n=== 5. ctrl+滚轮缩放夹在官方 DAG 的 [0.5, 1.5]（改动前是 [0.3, 2.5]）===');
const z0 = await scaleOf();
for (let i = 0; i < 14; i += 1) {
  await page.mouse.move(wrap.cx, wrap.cy);
  await page.keyboard.down('Control'); await page.mouse.wheel(0, -120); await page.keyboard.up('Control');
  await page.waitForTimeout(80);
}
await page.waitForTimeout(400);
const zMax = await scaleOf();
for (let i = 0; i < 30; i += 1) {
  await page.mouse.move(wrap.cx, wrap.cy);
  await page.keyboard.down('Control'); await page.mouse.wheel(0, 120); await page.keyboard.up('Control');
  await page.waitForTimeout(80);
}
await page.waitForTimeout(400);
const zMin = await scaleOf();
console.log(`  scale: 初始 ${z0} 放大到底 ${zMax} 缩小到底 ${zMin}`);
// 注意：z0 通常是 null —— X6 在首次缩放前不会往 .x6-graph-svg-viewport 上写 transform。
// 这是库的固有行为、不是缺陷，所以只要求两端夹取值可读，z0 不参与判定。
check('两端夹取值可读（transform 解析正确）', zMax !== null && zMin !== null, `max=${zMax} min=${zMin}`);
check('放大被夹在 1.5（官方上限，改动前 2.5）', zMax !== null && zMax <= 1.5001, `max=${zMax}`);
check('缩小被夹在 0.5（官方下限，改动前 0.3）', zMin !== null && zMin >= 0.4999, `min=${zMin}`);

console.log('\n=== 6. JS 错误 ===');
check('全程无 JS 错误', jsErr.length === 0, jsErr.length ? JSON.stringify(jsErr) : '无');

console.log(`\n===== 汇总：通过 ${pass} / ${pass + fails.length} =====`);
if (fails.length) console.log('未通过: ' + fails.join(' | '));
await browser.close();
process.exit(fails.length ? 1 : 0);
