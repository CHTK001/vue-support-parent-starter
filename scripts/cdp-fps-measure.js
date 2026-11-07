const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge", args: ["--no-sandbox"] });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  async function measure(label, duration = 5000) {
    await page.evaluate(() => window.__startFps(1000));
    await new Promise((r) => setTimeout(r, duration));
    const props = await page.evaluate(() => window.__readFps());
    console.log(`=== ${label}: ${props.count} rAF/s (drag=${props.drag}) total=${await page.evaluate(() => window.__fps.total)} ===`);
    return props.count;
  }

  await page.goto(TARGET, { waitUntil: "load" });
  console.log("已打开:", page.url());
  await new Promise((r) => setTimeout(r, 3000));
  console.log("page has __startFps before setup:", await page.evaluate(() => typeof window.__startFps));

  // 页面侧计数：window.__fps.count 在 1s 窗口内自增
  await page.evaluate(() => {
    window.__fps = { count: 0, started: false, startedAt: 0, dur: 1000, total: 0, drag: false };
    const loop = () => {
      if (!window.__fps.started) return;
      window.__fps.count++;
      window.__fps.total++;
      if (performance.now() - window.__fps.startedAt > window.__fps.dur) {
        window.__fps.started = false;
        return;
      }
      requestAnimationFrame(loop);
    };
    window.__startFps = (dur) => {
      window.__fps.count = 0;
      window.__fps.dur = dur || 1000;
      window.__fps.startedAt = performance.now();
      window.__fps.started = true;
      loop();
    };
    window.__stopFps = () => { window.__fps.started = false; };
    window.__setDrag = (v) => { window.__fps.drag = !!v; };
    window.__readFps = () => ({ count: window.__fps.count, drag: window.__fps.drag });
  });
  console.log("after setup:", await page.evaluate(() => typeof window.__startFps));
  await measure("base line (idle page)", 5000);
  await browser.close();
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
