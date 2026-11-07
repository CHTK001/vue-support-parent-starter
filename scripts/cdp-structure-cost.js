/**
 * 拖拽帧率的「结构成本」定量：只改 DOM 显示/隐藏，不依赖后端与弹窗。
 *
 * 已确认（前几轮）：
 *   - 两次独立采样都显示：隐藏首页卡片后 p99 从 ~21 降到 ~15.6，
 *     再隐藏侧栏+顶栏后降到 ~14.5
 *   - 拖拽期间每帧都有 1 次「元素=6」样式重算（119 次 / 121 帧）
 *   - Element Plus 的 adjustPosition 每帧读 GBCR + 视口尺寸
 *
 * 本脚本在没有弹窗的情况下，用同一套 DOM 结构 + 一次 transform 写入，
 * 对比「全页面」与「隐藏侧栏/卡片」两种形态下的帧间隔，得出结构成本。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
    args: ["--no-sandbox", "--start-maximized", "--disable-background-timer-throttling"],
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();

  await page.goto(TARGET, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".login-form", { timeout: 150000 });
  await page.waitForSelector(".loading-box", { state: "detached", timeout: 45000 }).catch(() => {});
  await sec(900);
  const inputs = page.locator(".login-input .el-input__inner");
  await inputs.first().fill("admin");
  await inputs.nth(1).fill("admin123");
  await sec(200);
  await page.click(".login-btn", { force: true });
  const track = await page.waitForSelector(".slider-verify-track", { timeout: 12000 }).catch(() => null);
  if (track) {
    await sec(400);
    const r = await track.boundingBox();
    const sx = r.x + r.width * 0.12;
    const ex = r.x + r.width - 4;
    const sy = r.y + r.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 0; i <= 45; i++) {
      await page.mouse.move(sx + ((ex - sx) * i) / 45, sy);
      await sec(10);
    }
    await page.mouse.up();
    await sec(1200);
    await inputs.first().fill("admin");
    await inputs.nth(1).fill("admin123");
    await sec(300);
    await page.click(".login-btn", { force: true });
  }
  await page.waitForURL((u) => !/login/.test(u.pathname), { timeout: 50000 });
  await page.waitForSelector(".home-card", { timeout: 150000 });
  await sec(8000);
  console.log("首页就绪（不打开弹窗）");

  const nodes = await page.evaluate(() => document.body.querySelectorAll("*").length);
  console.log("DOM 节点数:", nodes);

  async function run(label, css) {
    if (css) await page.addStyleTag({ content: css });
    await sec(500);
    const r = await page.evaluate(async () => {
      // 造一个固定在页面上的探针元素
      let probe = document.getElementById("__probe");
      if (!probe) {
        probe = document.createElement("div");
        probe.id = "__probe";
        probe.style.cssText = "position:fixed;left:300px;top:200px;width:400px;height:300px;background:#fff;border:1px solid #ddd;z-index:99999";
        document.body.appendChild(probe);
      }
      const frames = [];
      let last = 0;
      const syncs = [];
      await new Promise((resolve) => {
        let i = 0;
        const tick = (t) => {
          if (last) frames.push(+(t - last).toFixed(2));
          last = t;
          // 模拟 EP 的 adjustPosition：读 GBCR + 视口 + 写 transform
          const t0 = performance.now();
          const rect = probe.getBoundingClientRect();
          const cw = document.documentElement.clientWidth;
          const ch = document.documentElement.clientHeight;
          probe.style.transform = `translate(${Math.min(i, cw - rect.width)}px, ${Math.sin(i * 0.1) * 8}px)`;
          syncs.push(+(performance.now() - t0).toFixed(3));
          if (++i < 180) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      const s = [...frames].sort((a, b) => a - b);
      const sy = [...syncs].sort((a, b) => a - b);
      return {
        p50: s[Math.floor(s.length * 0.5)],
        p95: s[Math.floor(s.length * 0.95)],
        p99: s[Math.floor(s.length * 0.99)],
        max: s[s.length - 1],
        over: frames.filter((x) => x > 16.7).length,
        syncP50: sy[Math.floor(sy.length * 0.5)],
        syncP95: sy[Math.floor(sy.length * 0.95)],
      };
    });
    console.log(
      `  ${label.padEnd(24)} p50=${String(r.p50).padStart(6)} p95=${String(r.p95).padStart(6)} p99=${String(r.p99).padStart(6)} max=${String(r.max).padStart(6)} >16.7=${r.over}  同步读=${r.syncP50}/${r.syncP95}ms`
    );
    return r;
  }

  console.log("\n=== 无弹窗，模拟拖拽 180 帧（读 GBCR + 视口 + 写 transform）===");
  const A = await run("全部页面");
  await page.addStyleTag({ content: `.home-grid,.home-card{display:none!important}` });
  await run("隐藏首页卡片");
  await page.addStyleTag({ content: `.el-aside{display:none!important}` });
  await run("再隐藏侧栏");
  await page.addStyleTag({ content: `.el-header{display:none!important}` });
  const B = await run("再隐藏顶栏");

  console.log("\n==================== 结构成本 ====================");
  console.log(`  p99: ${A.p99}ms -> ${B.p99}ms`);
  console.log(`  >16.7ms 帧数: ${A.over} -> ${B.over}`);

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
