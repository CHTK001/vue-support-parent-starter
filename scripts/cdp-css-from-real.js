/**
 * 在「真实 monitor 的 CSS」上做排查，不依赖后端。
 *
 * 做法：把 monitor 主题的真实样式表（element.scss 编译产物 / vite 注入的 style）
 * 直接搬到一个本地静态页里 —— 页面 DOM 由脚本按真实首页结构生成，
 * 但不需要登录、不需要接口。
 *
 * 实测项：
 *   A 原样（:hover + transition 全开）
 *   B 关掉所有 transition
 *   C 关掉 :hover 带来的重算（给侧栏加 contain: style）
 *   D 两者都做
 *
 * 用法：node scripts/cdp-css-from-real.js
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "D:\\ch\\.trace";
const CATS = ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink.user_timing", "blink", "toplevel", "benchmark"].join(",");

/** 复刻 monitor 侧边栏与卡片区的真实 CSS 特征 */
const BASE_CSS = `
  * { box-sizing: border-box; }
  body { margin:0; font: 13px/1.5 -apple-system, "Segoe UI", system-ui; color:#303133; }
  .layout { display:flex; height:100vh; }
  .el-aside { width:220px; border-right:1px solid #e4e7ed; overflow:hidden; }
  .el-menu { list-style:none; margin:0; padding:0; }
  .el-menu-item { padding:0 16px; height:40px; line-height:40px; cursor:pointer;
      transition: background-color .3s ease-in, border-color .3s ease-in, box-shadow .3s ease-in, color .3s ease-in; }
  .el-menu-item:hover { background:#ecf5ff; color:#409eff; }
  .el-menu-item:hover .menu-icon { transform: rotate(90deg); }
  .menu-icon { display:inline-block; transition: transform .3s; }
  .main { flex:1; padding:16px; overflow:auto; }
  .home-welcome { display:flex; align-items:center; gap:12px; padding:12px; }
  .home-welcome__avatar-box { width:56px; height:56px; }
  .home-welcome__avatar { width:56px; height:56px; border-radius:50%; }
  .home-card__welcome { transition: background-color .3s; }
  .widget-renderer { border:1px solid #ebeef5; border-radius:8px; margin:8px; }
  .widget-renderer:hover { box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  .aw__item { display:flex; gap:8px; padding:10px 12px; transition: background .3s; }
  .aw__item:hover { background:#f5f7fa; }
  .aw__add { border:none; background:none; cursor:pointer; transition: color .2s; }
  .aw__add:hover { color:#409eff; }
`;

/** 生成与真实首页规模相当的 DOM */
function buildDom(menuCount = 14, cardCount = 6) {
  const menu = Array.from({ length: menuCount }, (_, i) => {
    const subs = Array.from(
      { length: 5 },
      (_, j) => `<li class="el-menu-item" style="padding-left:36px"><span class="menu-icon">&#9679;</span> 子菜单 ${i}-${j}</li>`
    ).join("");
    return `<li class="el-menu-item"><span class="menu-icon">&#9656;</span> 菜单 ${i}</li>${subs}`;
  }).join("");

  const cards = Array.from({ length: cardCount }, (_, c) => {
    const rows = Array.from(
      { length: 8 },
      (_, r) => `<div class="aw__item"><div class="aw__item-time">0${r}:00</div><div>条目 ${r}</div><button class="aw__add">+</button></div>`
    ).join("");
    return `<div class="widget-renderer"><div style="padding:8px 12px;font-weight:600">组件 ${c}</div>${rows}</div>`;
  }).join("");

  return `<div class="layout">
    <aside class="el-aside"><ul class="el-menu">${menu}</ul></aside>
    <main class="main">
      <div class="home-card__welcome"><div class="home-welcome">
        <div class="home-welcome__avatar-box"><img class="home-welcome__avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"></div>
        <div><div>愿你今晚做个好梦。</div><div>管理员的仪表板</div></div>
      </div></div>
      ${cards}
    </main>
  </div>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}</style></head><body>${buildDom()}<script>window.__nodes=document.querySelectorAll('*').length;</script></body></html>`;
  const file = path.join(OUT, "real-css-page.html");
  fs.writeFileSync(file, html, "utf8");

  await page.goto("file:///" + file.replace(/\\/g, "/"));
  await sec(800);
  console.log("页面节点数:", await page.evaluate(() => window.__nodes));

  async function round(label, prepare, x0, y0) {
    if (prepare) await prepare();
    await sec(400);
    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(500);
    const t = Date.now();
    await page.mouse.move(x0, y0);
    for (let i = 1; i <= 150; i++) {
      await page.mouse.move(x0 + (i % 60) * 3, y0 + (i % 40) * 5);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    await sec(400);
    const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
    await cdp.send("Tracing.end");
    await done;
    await sec(250);

    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const ms = +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    const r = { label, moves: mm.length, ult: ult.length, ms };
    console.log(`${label.padEnd(36)} moves=${String(r.moves).padStart(3)} 样式重算=${String(r.ult).padStart(4)}次 ${String(ms + "ms").padStart(8)}`);
    return r;
  }

  const R = [];
  // 扫过侧边栏菜单（hover 最密集处）
  R.push(await round("A 原样（鼠标扫过侧边栏）", null, 20, 60));

  R.push(
    await round(
      "B 关掉所有 transition",
      async () => {
        await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important}` });
      },
      20,
      60
    )
  );

  // 恢复：重新加载页面再试 C
  await page.goto("file:///" + file.replace(/\\/g, "/"));
  await sec(700);
  R.push(
    await round(
      "C 侧边栏加 contain: style",
      async () => {
        await page.addStyleTag({ content: `.el-aside{contain:style layout}` });
      },
      20,
      60
    )
  );

  await page.goto("file:///" + file.replace(/\\/g, "/"));
  await sec(700);
  R.push(await round("D 扫过主内容区（非菜单）", null, 400, 200));

  console.log("\n==================== 汇总 ====================");
  R.forEach((r) => console.log(`${r.label.padEnd(32)} ${String(r.ult).padStart(5)} 次 / ${r.ms}ms`));
  if (R.length >= 2) console.log(`\n关 transition: ${R[0].ult} -> ${R[1].ult} 次（少 ${R[0].ult - R[1].ult}）`);
  if (R.length >= 3) console.log(`contain:style : ${R[0].ult} -> ${R[2].ult} 次（少 ${R[0].ult - R[2].ult}）`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
