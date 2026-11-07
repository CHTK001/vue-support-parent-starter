/**
 * 纯浏览器对照（不需要后端）：确认「鼠标移动本身」是否触发整页样式重算，
 * 以及弹窗/拖拽是否会让它变多。
 *
 * 页面：什么都不依赖的静态页，DOM 规模与 monitor 首页相当（约 2600 个节点，
 * 带一圈带 transition 的菜单项 —— 复刻真实页面的 CSS 特征）。
 *
 * 四组，各 150 次 mousemove：
 *   A 空移（不按键）
 *   B 按住左键拖动一个 fixed 定位的 div（模拟弹窗拖拽，transform 位移）
 *   C 空移，但页面里有一个 overscroll/transition 密集的弹窗
 *   D 完全不动
 *
 * 输出：mousemove 数 / UpdateLayoutTree 次数 / 耗时 / 每次移动代价
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "D:\\ch\\.trace";
const CATS = [
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "blink.user_timing",
  "latencyInfo",
  "benchmark",
  "v8.execute",
  "cc",
  "gpu",
  "blink",
  "toplevel",
].join(",");

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin:0; font: 13px/1.5 system-ui; }
  .menu li { list-style:none; padding:8px 12px; transition: background-color .3s ease-in, border-color .3s ease-in, box-shadow .3s ease-in; }
  .menu li:hover { background:#eef; }
  .menu i { transition: transform .3s; display:inline-block; }
  .card { padding:12px; border:1px solid #ddd; margin:8px; border-radius:6px; }
  .dlg { position:fixed; top:120px; left:300px; width:560px; background:#fff; border:1px solid #ccc;
         border-radius:8px; box-shadow:0 8px 30px rgba(0,0,0,.2); z-index:10; }
  .dlg-head { padding:10px 14px; border-bottom:1px solid #eee; cursor:move; user-select:none; }
  .dlg-body { padding:14px; max-height:420px; overflow:auto; }
  .row { display:flex; gap:10px; padding:6px 0; }
  .row span { flex:1 }
  .btn { padding:4px 12px; border:1px solid #ccc; border-radius:4px; background:#f7f7f7; }
  .btn:hover { background:#eee; }
</style></head><body>
<div style="display:flex">
  <aside class="menu" id="aside" style="width:220px;border-right:1px solid #eee"></aside>
  <main id="main" style="flex:1"></main>
</div>
<div class="dlg" id="dlg" style="display:none">
  <div class="dlg-head" id="head">弹窗标题 · 拖我</div>
  <div class="dlg-body" id="dlgb"></div>
</div>
<script>
  const aside = document.getElementById('aside');
  for (let i = 0; i < 12; i++) {
    const li = document.createElement('li');
    li.innerHTML = '<i>&#9656;</i> 菜单项 ' + i;
    aside.appendChild(li);
    for (let j = 0; j < 5; j++) {
      const sub = document.createElement('div');
      sub.style.paddingLeft = '16px';
      sub.innerHTML = '<i>&#9679;</i> 子项 ' + i + '-' + j + ' <span style="transition:color .3s">状态</span>';
      aside.appendChild(sub);
    }
  }
  const main = document.getElementById('main');
  for (let c = 0; c < 24; c++) {
    const card = document.createElement('div');
    card.className = 'card';
    let h = '<b>卡片 ' + c + '</b>';
    for (let r = 0; r < 8; r++) h += '<div class="row"><span>字段 ' + r + '</span><button class="btn">操作</button></div>';
    card.innerHTML = h;
    main.appendChild(card);
  }
  const dlgb = document.getElementById('dlgb');
  let dh = '';
  for (let r = 0; r < 20; r++) dh += '<div class="row"><span>表单项 ' + r + '</span><input class="btn" style="flex:1"></div>';
  dlgb.innerHTML = dh;
  window.__nodes = document.querySelectorAll('*').length;
</script></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const htmlFile = path.join(OUT, "perf-baseline.html");
  fs.writeFileSync(htmlFile, HTML, "utf8");

  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);

  await page.goto("file:///" + htmlFile.replace(/\\/g, "/"));
  await sec(1500);
  console.log("页面节点数:", await page.evaluate(() => window.__nodes));

  async function round(label, fn) {
    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(600);
    await fn();
    await sec(400);
    const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
    await cdp.send("Tracing.end");
    await done;
    await sec(300);

    const xs = events.filter((e) => e.ph === "X" && typeof e.dur === "number");
    const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
    const mm = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
    const layout = xs.filter((e) => e.name === "Layout");
    const paint = xs.filter((e) => e.name === "Paint");
    const durs = ult.map((e) => e.dur / 1000);
    const total = durs.reduce((a, b) => a + b, 0);
    const r = {
      label,
      moves: mm.length,
      ult: ult.length,
      ultMs: +total.toFixed(1),
      perMove: mm.length ? +(total / mm.length).toFixed(3) : 0,
      layout: layout.length,
      paint: paint.length,
    };
    console.log(
      `【${label.padEnd(22)}】mousemove=${String(r.moves).padStart(3)}  样式重算=${String(r.ult).padStart(3)}次/${String(r.ultMs + "ms").padStart(8)}  每次移动=${r.perMove}ms  Layout=${r.layout}  Paint=${r.paint}`
    );
    return r;
  }

  async function sweep(x0, y0, hold, n = 150) {
    await page.mouse.move(x0, y0);
    await sec(100);
    if (hold) {
      await page.mouse.down();
      await sec(60);
    }
    const t = Date.now();
    for (let i = 1; i <= n; i++) {
      await page.mouse.move(x0 + i * 1.8, y0 + Math.sin(i * 0.15) * 9);
      const w = t + i * 8 - Date.now();
      if (w > 0) await sec(w);
    }
    if (hold) await page.mouse.up();
  }

  const res = [];
  res.push(await round("A 空移", () => sweep(400, 700, false)));

  // B 拖动 fixed 弹窗
  await page.evaluate(() => {
    const dlg = document.getElementById("dlg");
    dlg.style.display = "block";
  });
  await sec(600);
  const hdr = await page.locator("#head").boundingBox();
  res.push(await round("B 拖动弹窗(transform)", () => sweep(hdr.x + 80, hdr.y + hdr.height / 2, true)));

  // C 弹窗开着空移
  res.push(await round("C 弹窗开着 · 空移", () => sweep(120, 700, false)));

  // D 不动
  res.push(await round("D 完全不动", () => sec(150 * 8)));

  console.log("\n==================== 汇总（纯浏览器静态页） ====================");
  console.log("分支                    moves   重算次数   重算耗时   每次移动");
  res.forEach((r) =>
    console.log(`${r.label.padEnd(22)} ${String(r.moves).padStart(6)} ${String(r.ult).padStart(9)} ${String(r.ultMs + "ms").padStart(9)} ${String(r.perMove + "ms").padStart(10)}`)
  );

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
