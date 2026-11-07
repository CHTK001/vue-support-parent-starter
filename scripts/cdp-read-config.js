/** 读页面里的配置：确认 layout.source 是 local 还是 remote，以及 url.layout。 */
const { chromium } = require("playwright-core");
const TARGET = process.env.TARGET_URL || "http://localhost:8848";
const sec = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
    env: { ...process.env, TEMP: "D:\\ch\\.pw-profile\\tmp", TMP: "D:\\ch\\.pw-profile\\tmp" },
  });
  const page = await browser.newPage();
  await page.goto(TARGET, { waitUntil: "domcontentloaded" });
  await sec(6000);

  const m = await page.evaluate(async () => {
    const out = {};
    try {
      const mods = await import("/@fs/D:/ch/project/vue-support-parent-starter/packages/config/src/index.ts");
      const c = mods.getConfig();
      out.layout = c.layout;
      out.layoutConfig2 = c.layoutConfig;
      out.urlLayout = c.url && c.url.layout;
      out.storage = c.storage;
      out.systemCode = c.app && c.app.systemCode;
      out.keys = Object.keys(c).filter((k) => /lay|store/i.test(k));
    } catch (e) {
      out.err = String(e).slice(0, 200);
    }
    return out;
  });
  console.log(JSON.stringify(m, null, 1));
  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
