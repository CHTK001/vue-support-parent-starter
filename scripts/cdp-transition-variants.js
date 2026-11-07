/**
 * 最后一轮验证：把「transition 导致每次鼠标移动重算整页样式」这条规律，
 * 在多种 CSS 组合下钉死，并给出可落地的修复方案效果。
 *
 * 六组：
 *   1. transition 全开（现状）
 *   2. transition 全关
 *   3. 只保留 opacity/transform 的 transition（合成层友好，不触发样式重算）
 *   4. transition-duration 改为 0s（保留 transition 声明，零时长）
 *   5. 只给菜单项加 will-change: background-color（试图预先分配）
 *   6. transition 全开 + prefer-reduced-motion（真实用户可能有的设置）
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "D:\\ch\\.trace";
const CATS = ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink.user_timing", "blink", "toplevel", "benchmark"].join(",");

const BASE = `
  * { box-sizing:border-box } body { margin:0; font:13px/1.5 system-ui }
  .layout { display:flex; height:100vh }
  .el-aside { width:220px; border-right:1px solid #e4e7ed; overflow:hidden }
  .el-menu { list-style:none; margin:0; padding:0 }
  .el-menu-item { padding:0 16px; height:40px; line-height:40px; cursor:pointer; transition: background-color .3s ease-in, border-color .3s ease-in, box-shadow .3s ease-in, color .3s ease-in }
  .el-menu-item:hover { background:#ecf5ff; color:#409eff }
  .el-menu-item:hover .menu-icon { transform: rotate(90deg) }
  .menu-icon { display:inline-block; transition: transform .3s }
  .main { flex:1; padding:16px; overflow:auto }
  .widget-renderer { border:1px solid #ebeef5; border-radius:8px; margin:8px; transition: box-shadow .3s }
  .widget-renderer:hover { box-shadow: 0 2px 12px rgba(0,0,0,.08) }
  .aw__item { display:flex; gap:8px; padding:10px 12px; transition: background .3s }
  .aw__item:hover { background:#f5f7fa }
`;

function dom(menuCount = 14) {
  const menu = Array.from({ length: menuCount }, (_, i) => {
    const subs = Array.from(
      { length: 5 },
      (_, j) => `<li class="el-menu-item" style="padding-left:36px"><span class="menu-icon">&#9679;</span> 子 ${i}-${j}</li>`
    ).join("");
    return `<li class="el-menu-item"><span class="menu-icon">&#9656;</span> 菜单 ${i}</li>${subs}`;
  }).join("");
  const rows = Array.from({ length: 8 }, (_, r) => `<div class="aw__item"><div>条目 ${r}</div><button>+</button></div>`).join("");
  const cards = Array.from({ length: 6 }, (_, c) => `<div class="widget-renderer">${rows}</div>`).join("");
  return `<div class="layout"><aside class="el-aside"><ul class="el-menu">${menu}</ul></aside><main class="main">${cards}</main></div>`;
}

const VARIANTS = [
  ["1 transition 全开（现状）", ""],
  ["2 transition 全关", "*,*::before,*::after{transition:none!important}"],
  [
    "3 只保留 transform/opacity 过渡",
    "*:not(.menu-icon){transition-property:none!important} .menu-icon{transition:transform .3s!important}",
  ],
  ["4 duration 归零", "*,*::before,*::after{transition-duration:0s!important}"],
  ["5 菜单项 will-change", ".el-menu-item{will-change:background-color}"],
  ["6 减少动效偏好", ""],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });

  const results = [];

  for (let vi = 0; vi < VARIANTS.length; vi++) {
    const [label, extraCss] = VARIANTS[vi];
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: label.includes("减少动效") ? "reduce" : "no-preference",
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}</style><style>${extraCss}</style></head><body>${dom()}</body></html>`;
    const file = path.join(OUT, `variant-${vi}.html`);
    fs.writeFileSync(file, html, "utf8");
    await page.goto("file:///" + file.replace(/\\/g, "/"));
    await sec(600);

    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(500);
    const t = Date.now();
    await page.mouse.move(20, 60);
    for (let i = 1; i <= 150; i++) {
      await page.mouse.move(20 + (i % 60) * 3, 60 + (i % 40) * 5);
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
    const paint = xs.filter((e) => e.name === "Paint");
    const ms = +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    results.push({ label, moves: mm.length, ult: ult.length, ms, paint: paint.length });
    console.log(`${label.padEnd(28)} moves=${String(mm.length).padStart(3)} 重算=${String(ult.length).padStart(4)}次 ${String(ms + "ms").padStart(8)} Paint=${paint.length}`);

    await ctx.close();
  }

  console.log("\n==================== 汇总 ====================");
  console.log("方案                          重算次数   重算耗时   相对现状");
  const base = results[0];
  results.forEach((r) => {
    const d = r.ult - base.ult;
    const pct = base.ult ? Math.round((d / base.ult) * 100) : 0;
    console.log(
      `${r.label.padEnd(28)} ${String(r.ult).padStart(6)} ${String(r.ms + "ms").padStart(10)} ${(d === 0 ? "基线" : `${d > 0 ? "+" : ""}${d} (${pct}%)`).padStart(12)}`
    );
  });

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
