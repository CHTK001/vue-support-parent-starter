// 验证：ReFlowGraph 属性面板从底部停靠改到画布右侧。
//
// 断言口径（都是「测到了东西」而不是「元素存在」）：
//   1. 面板与画布的横向位置关系：panel.left > canvas.right  => 真的在右侧
//      底部停靠时 panel.left < canvas.left 且 panel.top > canvas.bottom，两个条件都会反过来，
//      所以这条断言同时能证伪旧布局，不是恒真。
//   2. 面板与画布纵向重叠 => 同一行（不是上下堆叠）
//   3. 拖拽把手真的改宽度（拖动前后宽度差 > 50px），且方向正确（向右拖变宽）
//   4. 宽度夹在 [240, 720] 内
//   5. 折叠/展开按钮与图标随之变化
//   6. 选中节点后属性表单真的渲染在右侧面板内（面板不是空壳）
import { chromium } from 'playwright';

// 基址从 PW_BASE 读：应用的 vite.config 里 strictPort:false，端口被占时会顺延，
// 由 pw-run.mjs 从 vite 的 stdout 解析出实际端口后注入，避免脚本打到别人的旧实例上。
const BASE = process.env.PW_BASE || 'http://localhost:19096';
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

const box = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) };
}, sel);

console.log('=== 0. 登录并打开流程设计弹窗 ===');
// 走 routes/index.ts:25 记录的设计路由 /collect/design?flowId=N：
// 采集器管理页上的「流程设计」是行内图标按钮（CollectorView.vue:353 的 COLLECT_ACTIONS.designFlow），
// 没有可见文字，按文本匹配找不到，用路由直达才稳定。
// 但必须是「根路径 + hash」而不是路径式深链：createVite 的 devIndexTemplate 只对 "/" 与
// "/index.html" 返回公共模板，刻意不做任意路径的 SPA fallback（否则会把 /collect/api/**
// 代理路径吞成 index.html），所以 /collect/design?flowId=1 直接 404。
await page.goto(BASE + '/#/collect/design?flowId=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
// waitForFunction 签名是 (fn, arg, options)：options 写在第二参会被当成 arg 传给回调，
// 超时设置完全失效、一直用默认 30s。
await page.waitForFunction(() => {
  const a = document.querySelector('#app');
  return !!a && a.children.length > 0 && (document.body.innerText || '').length > 50;
}, null, { timeout: 180000 });
console.log('  挂载后 hash =', await page.evaluate(() => location.hash));
if ((await page.locator('input[type="password"]').count()) > 0) {
  await page.locator('input[type="text"]').first().fill('sa');
  await page.locator('input[type="password"]').first().fill('123456');
  await page.locator('button').filter({ hasText: '登录' }).first().click();
  await page.waitForTimeout(8000);
  // 登录后整页重载再进设计路由：登录成功会跳 #/collect/dashboard，
  // 那里挂载的 ReTable 有并发会话在修的缺陷，一旦挂载就会把 RouterView 打白屏。
  await page.goto(BASE + '/#/collect/design?flowId=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);
}
await page.waitForFunction(() => !!document.querySelector('.flow-shell'), null, { timeout: 90000 }).catch(() => {});
await page.waitForTimeout(8000);
console.log('  打开后 hash =', await page.evaluate(() => location.hash));
const shellCount = await page.locator('.flow-shell').count();
check('流程设计器已挂载（.flow-shell 存在）', shellCount > 0, `shell=${shellCount}`);


console.log('\n=== 1. 面板与画布的相对位置（证伪底部停靠）===');
const canvas = await box('.flow-canvas-wrap');
const props = await box('.flow-props');
const palette = await box('.flow-palette');
console.log(`  画布 = ${JSON.stringify(canvas)}`);
console.log(`  面板 = ${JSON.stringify(props)}`);
console.log(`  调色板 = ${JSON.stringify(palette)}`);

if (!check('画布容器存在', !!canvas)) { await browser.close(); process.exit(1); }
if (!check('属性面板存在', !!props)) { await browser.close(); process.exit(1); }

check('面板在画布右侧（panel.left >= canvas.right）', props.left >= canvas.right - 2,
  `panel.left=${props.left} canvas.right=${canvas.right}`);
check('面板与画布纵向重叠（同一行，不是上下堆叠）',
  props.top < canvas.bottom && props.bottom > canvas.top,
  `panel=[${props.top},${props.bottom}] canvas=[${canvas.top},${canvas.bottom}]`);
check('面板全高占满（height 100%）', Math.abs(props.h - canvas.h) <= 2, `panel.h=${props.h} canvas.h=${canvas.h}`);
check('面板未挤压画布为 0', canvas.w > 300, `canvas.w=${canvas.w}`);
check('节点库仍在最左（palette.left < canvas.left）', !!palette && palette.left < canvas.left,
  palette ? `palette.left=${palette.left}` : '调色板不存在');
check('三列顺序为 调色板 | 画布 | 面板',
  !!palette && palette.right <= canvas.left + 2 && canvas.right <= props.left + 2,
  `palette.right=${palette?.right} canvas.left=${canvas.left} canvas.right=${canvas.right} panel.left=${props.left}`);

console.log('\n=== 2. 拖拽把手真的能改宽度（向右拖变宽）===');
const head = await box('.flow-props-head');
check('面板头存在（拖拽把手所在行）', !!head, JSON.stringify(head));
const gripCursor = await page.evaluate(() => {
  const el = document.querySelector('.flow-props-head');
  return el ? getComputedStyle(el).cursor : '(无)';
});
check('面板头光标为 ew-resize（横向拖拽）', gripCursor === 'ew-resize', `cursor=${gripCursor}`);

const w0 = props.w;
const yMid = head.top + head.h / 2;
await page.mouse.move(head.left + 6, yMid);
await page.mouse.down();
await page.mouse.move(head.left + 6 + 150, yMid, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(1200);
const props2 = await box('.flow-props');
const canvas2 = await box('.flow-canvas-wrap');
console.log(`  拖后 面板 = ${JSON.stringify(props2)}`);
check('向右拖 150px 后面板变宽', props2.w > w0 + 50, `${w0} -> ${props2.w}`);
check('画布等量变窄（宽度是抢来的，不是凭空多出）', canvas2.w < canvas.w - 50, `${canvas.w} -> ${canvas2.w}`);

console.log('\n=== 3. 宽度上下限夹取 ===');
await page.mouse.move(props2.left + 6, yMid);
await page.mouse.down();
await page.mouse.move(props2.left + 6 - 900, yMid, { steps: 15 });
await page.mouse.up();
await page.waitForTimeout(1000);
const wide = await box('.flow-props');
check('向左猛拖到下限被夹在 240', wide.w >= 240 && wide.w < 300, `w=${wide.w}`);

await page.mouse.move(wide.left + 6, yMid);
await page.mouse.down();
await page.mouse.move(wide.left + 6 + 1200, yMid, { steps: 15 });
await page.mouse.up();
await page.waitForTimeout(1000);
const narrow = await box('.flow-props');
check('向右猛拖到上限被夹在 720', narrow.w <= 720 && narrow.w > 700, `w=${narrow.w}`);

// 恢复到一个好读的宽度再继续
await page.mouse.move(narrow.left + 6, yMid);
await page.mouse.down();
await page.mouse.move(narrow.left + 6 - 380, yMid, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(1000);
const finalBox = await box('.flow-props');
console.log(`  复位后面板宽 = ${finalBox.w}`);

console.log('\n=== 4. 折叠 / 展开 ===');
// 折叠按钮是 layout="square" 的纯图标按钮（ReButton.vue:187-203）：
// 插槽文字只做 tooltip + aria-label，不渲染到按钮上，所以 innerText 恒为空。
// 因此断言必须打在无障碍名与图标上，打在 innerText 上永远失败 —— 那是断言写错，不是组件缺陷。
const collapseBtn = page.locator('.flow-props-head button').last();
const btnDom = async () => page.evaluate(() => {
  const b = document.querySelectorAll('.flow-props-head button');
  const el = b[b.length - 1];
  if (!el) return null;
  return {
    aria: el.getAttribute('aria-label'),
    // 记下整棵图标子树的类名与 svg 路径，square 布局下 ReIcon 不一定用 <use>
    iconClass: el.querySelector('i')?.className || '',
    iconPath: (el.querySelector('svg path')?.getAttribute('d') || '').slice(0, 40),
    iconUse: el.querySelector('use')?.getAttribute('href') || '',
  };
});
const name0 = await btnDom();
console.log('  折叠前按钮 =', JSON.stringify(name0));
check('折叠按钮有 aria-label（square 布局的提示语出口）', !!name0 && !!name0.aria, JSON.stringify(name0?.aria));

await collapseBtn.click().catch(() => {});
await page.waitForTimeout(1000);
const collapsed = await box('.flow-props');
const bodyHidden = await page.evaluate(() => {
  const b = document.querySelector('.flow-props-body');
  return b ? getComputedStyle(b).display : '(无)';
});
check('折叠后面板收窄到 34px', collapsed.w === 34, `w=${collapsed.w}`);
check('折叠后属性表单隐藏', bodyHidden === 'none', `body.display=${bodyHidden}`);

const name1 = await btnDom();
console.log('  折叠后按钮 =', JSON.stringify(name1));
check('按钮无障碍名由「收起」变「展开」', name0?.aria === '收起' && name1?.aria === '展开', `"${name0?.aria}" -> "${name1?.aria}"`);
const iconSig = (n) => `${n?.iconClass}|${n?.iconPath}|${n?.iconUse}`;
check('按钮图标随之切换（收起 ArrowRight / 展开 ArrowLeft）',
  iconSig(name0) !== iconSig(name1) && !iconSig(name0).startsWith('|'),
  `${iconSig(name0)}  ->  ${iconSig(name1)}`);

await collapseBtn.click().catch(() => {});
await page.waitForTimeout(1000);
const expanded = await box('.flow-props');
check('再点恢复宽度', expanded.w > 200, `w=${expanded.w}`);

console.log('\n=== 5. 右侧面板里真的渲染出节点参数表单（不是空壳）===');
// 点画布上的一个节点
const nodeCount = await page.locator('.x6-node').count();
console.log(`  画布节点数 = ${nodeCount}`);
if (nodeCount > 0) {
  await page.locator('.x6-node').first().click({ force: true });
  await page.waitForTimeout(2500);
  const inPanel = await page.evaluate(() => {
    const p = document.querySelector('.flow-props');
    if (!p) return { ok: false, why: '无面板' };
    const labels = Array.from(p.querySelectorAll('.field-label')).map((e) => e.innerText.trim());
    const tabs = Array.from(p.querySelectorAll('.re-tab-capsule__item')).map((e) => e.innerText.trim());
    const r = p.getBoundingClientRect();
    return { ok: true, labels, tabs, w: Math.round(r.width), left: Math.round(r.left) };
  });
  console.log(`  面板内标签 = ${JSON.stringify(inPanel.labels)}`);
  console.log(`  面板内页签 = ${JSON.stringify(inPanel.tabs)}`);
  check('选中节点后右侧面板出现参数标签', inPanel.labels && inPanel.labels.length > 0, `${inPanel.labels?.length} 个`);
  check('面板内含节点/连线/流程三个页签', (inPanel.tabs || []).length === 3, JSON.stringify(inPanel.tabs));
} else {
  check('画布上有节点可点', false, '.x6-node 数量为 0，可能画布未装载流程');
}

await page.screenshot({ path: 'D:/ch/project/.openchamber/screenshots/flow-props-right.png' });
console.log('  截图: flow-props-right.png');

console.log('\nJS 错误: ' + (jsErr.length ? '\n  ' + jsErr.join('\n  ') : '无'));
console.log(`\n===== 汇总：通过 ${pass} / ${pass + fails.length} =====`);
console.log('未通过: ' + (fails.length ? fails.join(', ') : '无'));
await browser.close();
