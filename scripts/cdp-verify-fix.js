/**
 * 在「不依赖后端」的前提下，验证 CSS 修复效果。
 *
 * 思路：把 8848 dev server 上真实的 koi 样式表整体抓下来，
 * 装到本地静态页里，DOM 按真实侧栏结构生成。
 * 这样测的就是仓库里**当前**的 SCSS（含刚改的修复），而不是手写副本。
 *
 * 对比两个版本：
 *   A 修复前：追加规则把菜单项恢复成 0.3s 过渡（模拟修复前）
 *   B 修复后：直接用仓库当前样式
 */
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const sec = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "D:\\ch\\.trace";
const CATS = ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink.user_timing", "blink", "toplevel", "benchmark"].join(",");

const DOM = (() => {
  const menu = Array.from({ length: 14 }, (_, i) => {
    const subs = Array.from(
      { length: 5 },
      (_, j) => `<li class="el-menu-item" style="padding-left:36px"><i class="el-icon"><svg width="12" height="12"><circle cx="6" cy="6" r="4"/></svg></i> 子 ${i}-${j}</li>`
    ).join("");
    return `<li class="el-menu-item"><i class="el-icon">&#9656;</i> 菜单 ${i}</li>${subs}`;
  }).join("");
  const rows = Array.from({ length: 8 }, (_, r) => `<div style="display:flex;gap:8px;padding:10px 12px">条目 ${r} <a href="#">链接</a></div>`).join("");
  const cards = Array.from({ length: 6 }, () => `<div style="border:1px solid #eee;border-radius:8px;margin:8px">${rows}</div>`).join("");
  return `<div class="layout" style="display:flex;height:100vh">
    <aside class="el-aside layout-group-aside" style="width:220px;border-right:1px solid #eee"><ul class="el-menu">${menu}</ul></aside>
    <main class="el-main main-content" style="flex:1;overflow:auto">${cards}</main>
  </div>`;
})();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });

  async function run(label, extraCss) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);

    // 从 dev server 抓真实样式表
    await page.goto("http://localhost:8848", { waitUntil: "domcontentloaded" });
    await sec(5000);
    const styles = await page.evaluate(async () => {
      // 加载主题入口，拿到编译后的 CSS
      const out = [];
      for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
        try {
          const r = await fetch(link.href);
          out.push(await r.text());
        } catch {}
      }
      for (const st of document.querySelectorAll("style")) out.push(st.textContent || "");
      return out.join("\n");
    });
    console.log(`[${label}] 抓到样式表 ${Math.round(styles.length / 1024)} KB`);

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${styles}</style>${
      extraCss ? `<style>${extraCss}</style>` : ""
    }</head><body>${DOM}</body></html>`;
    const file = path.join(OUT, `verify-${label.replace(/[^\w]/g, "_")}.html`);
    fs.writeFileSync(file, html, "utf8");

    await page.goto("file:///" + file.replace(/\\/g, "/"));
    await sec(800);

    const computed = await page.evaluate(() => {
      const li = document.querySelector(".el-menu-item");
      const a = document.querySelector("a");
      return { menuItem: getComputedStyle(li).transition, link: a ? getComputedStyle(a).transition : "n/a" };
    });
    console.log(`[${label}] .el-menu-item transition = ${computed.menuItem}`);

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
    const ms = +(ult.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1);
    const r = { label, moves: mm.length, ult: ult.length, ms, menuItem: computed.menuItem };
    console.log(`[${label}] moves=${mm.length} 样式重算=${ult.length}次/${ms}ms`);
    await ctx.close();
    return r;
  }

  // A：模拟修复前（把菜单项和 a 的过渡恢复回去）
  const A = await run(
    "A-修复前",
    `.el-menu-item,.el-menu-item.is-active{transition:background-color .3s ease-in,border-color .3s ease-in!important}
     a{transition:color .2s ease!important}`
  );

  // B：仓库当前样式
  const B = await run("B-修复后", "");

  console.log("\n==================== 结果 ====================");
  console.log(`A 修复前：${A.ult} 次 / ${A.ms}ms`);
  console.log(`B 修复后：${B.ult} 次 / ${B.ms}ms`);
  const drop = A.ult ? Math.round(((B.ult - A.ult) / A.ult) * 100) : 0;
  console.log(`变化：${B.ult - A.ult} 次（${drop}%），耗时 ${A.ms} -> ${B.ms}ms`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
