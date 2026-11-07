/**
 * 找出「每次鼠标移动都触发整页样式重算」的 CSS 元凶。
 *
 * 做法：用二分法，在静态页上逐组启用/禁用 CSS 特征，测「空移 150 次的样式重算次数」。
 * 特征清单来自真实 monitor 页面里扫描到的：
 *   :hover 规则数量 / transition 元素数 / 深层选择器 / 属性选择器
 *
 * 前提：在「弹窗开着」的状态下测（此前纯页 A 组为 0，C 组弹窗开着才有 40 次），
 * 说明需要同时存在「大量元素」与「鼠标划过」。
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "D:\\ch\\.trace";
const CATS = ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink.user_timing", "blink", "toplevel", "benchmark"].join(",");

function build({ hoverRules, transitionEls, deepSelectors, nodes }) {
  const menuItems = Array.from({ length: nodes }, (_, i) => `<li class="m${i % 7}"><i>&#9656;</i> 项 ${i}</li>`).join("");
  const hoverCss = hoverRules
    ? Array.from(
        { length: 200 },
        (_, i) => `.m${i % 7}:hover { background: rgba(0,0,0,${((i % 9) + 1) / 100}); } .m${i % 7}:hover > i { transform: rotate(${i}deg); }`
      ).join("\n")
    : "";
  const transCss = transitionEls
    ? `li { transition: background-color .3s ease-in, color .3s ease-in, border-color .3s ease-in, box-shadow .3s ease-in; } li > i { transition: transform .3s; display:inline-block; }`
    : "";
  const deepCss = deepSelectors
    ? `body > div > div > ul > li:hover > i, body > div > div > ul > li.m3:hover span { outline: 1px solid #eee; }`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing:border-box } body { margin:0; font:13px/1.5 system-ui }
  ul { margin:0; padding:0; }
  li { list-style:none; padding:6px 10px; cursor:pointer }
  ${hoverCss}
  ${transCss}
  ${deepCss}
</style></head><body>
<div><div><ul>${menuItems}</ul></div></div>
<script>window.__nodes = document.querySelectorAll('*').length;</script>
</body></html>`;
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

  async function measure(label, cfg) {
    const file = path.join(OUT, `bisect-${label.replace(/[^\w]/g, "_")}.html`);
    fs.writeFileSync(file, build(cfg), "utf8");
    await page.goto("file:///" + file.replace(/\\/g, "/"));
    await sec(700);
    const nodes = await page.evaluate(() => window.__nodes);

    const events = [];
    cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
    await cdp.send("Tracing.start", { categories: CATS, options: "sampling-frequency=10000", transferMode: "ReportEvents" });
    await sec(500);

    // 空移 150 次，横穿列表
    const t = Date.now();
    await page.mouse.move(300, 200);
    for (let i = 1; i <= 150; i++) {
      await page.mouse.move(300 + i * 2, 200 + (i % 60) * 4);
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
    console.log(
      `${label.padEnd(38)} 节点=${String(nodes).padStart(4)} moves=${String(mm.length).padStart(3)} 重算=${String(ult.length).padStart(4)}次 ${String(ms + "ms").padStart(8)}`
    );
    return { label, nodes, moves: mm.length, ult: ult.length, ms };
  }

  const R = [];
  R.push(await measure("基线:无hover无transition", { hoverRules: 0, transitionEls: 0, deepSelectors: 0, nodes: 600 }));
  R.push(await measure("+transition 元素", { hoverRules: 0, transitionEls: 1, deepSelectors: 0, nodes: 600 }));
  R.push(await measure("+hover 规则(200条)", { hoverRules: 1, transitionEls: 0, deepSelectors: 0, nodes: 600 }));
  R.push(await measure("+深层选择器", { hoverRules: 0, transitionEls: 0, deepSelectors: 1, nodes: 600 }));
  R.push(await measure("全开", { hoverRules: 1, transitionEls: 1, deepSelectors: 1, nodes: 600 }));

  console.log("\n==================== 结论 ====================");
  const base = R[0].ult;
  R.slice(1).forEach((r) => console.log(`${r.label.padEnd(28)} 相对基线 ${r.ult - base >= 0 ? "+" : ""}${r.ult - base} 次`));

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
