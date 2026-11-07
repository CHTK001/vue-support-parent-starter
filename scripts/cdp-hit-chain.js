/**
 * 命中测试（hit-test）链排查。
 *
 * 观察：只留主内容区时，每次重算恒定为 2 个元素；
 *       鼠标扫过的点下面就是 li.el-menu-item，但它的 transition 已经是 0s。
 *
 * 说明真正被改成 :hover 的是**鼠标下面那个元素及其祖先链**。
 * 本脚本：用 document.elementsFromPoint 把指针链打印出来，
 * 再看链上每一级的 computed transition / transition-property / 是否有 :hover 规则。
 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

const WIDGETS = [
  { id: "seed-alarm", type: "alarm", title: "闹钟" },
  { id: "seed-bookmark", type: "bookmark", title: "书签" },
  { id: "seed-quick", type: "quick-access", title: "快捷入口" },
];
const GRID = WIDGETS.map((w, i) => ({ i: w.id, type: w.type, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8 }));

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
  await page.waitForSelector(".login-form", { timeout: 45000 });
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
  await page.waitForSelector(".home-card", { timeout: 70000 });
  await sec(6000);
  await page.evaluate(async ([widgets, grid]) => {
    const u = await import("/@fs/D:/ch/project/vue-support-parent-starter/packages/utils/src/index.ts");
    u.writeLayoutCache({ widgets, grid });
  }, [WIDGETS, GRID]);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-card", { timeout: 70000 });
  await sec(7000);
  console.log("首页就绪");

  const report = await page.evaluate(() => {
    const desc = (el) => {
      const cs = getComputedStyle(el);
      const cls = (el.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 4).join(".");
      return {
        node: `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`,
        transition: cs.transitionProperty + " / " + cs.transitionDuration,
        bg: cs.backgroundColor,
        hasTransition: cs.transitionDuration.split(",").some((d) => parseFloat(d) > 0),
      };
    };
    const out = [];
    for (const [x, y] of [
      [30, 200],
      [60, 320],
      [300, 300],
      [600, 400],
      [900, 500],
    ]) {
      const chain = document.elementsFromPoint(x, y).slice(0, 8);
      out.push({ pt: `${x},${y}`, chain: chain.map(desc) });
    }
    return out;
  });

  for (const p of report) {
    console.log(`\n--- 点 (${p.pt}) 的指针链 ---`);
    p.chain.forEach((c, i) => {
      const flag = c.hasTransition ? "  <<< 有过渡" : "";
      console.log(`  ${String(i).padStart(2)} ${c.node.padEnd(46)} ${c.transition}${flag}`);
    });
  }

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
