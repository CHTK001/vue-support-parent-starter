const { chromium } = require("playwright");
const BROWSER = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:5173/#/skills", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("[data-testid=btn-import-agent-skills]", { timeout: 20000 });
  await page.locator("[data-testid=btn-import-agent-skills]").click();
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const wrappers = Array.from(document.querySelectorAll(".arco-drawer-wrapper"));
    return wrappers.map((w) => ({
      testid: w.getAttribute("data-testid"),
      visible: w.offsetParent !== null,
      hasClose: !!w.querySelector(".arco-drawer-close"),
      closeText: w.querySelector(".arco-drawer-close")?.textContent || "",
      footerBtns: Array.from(w.querySelectorAll("footer button, .arco-drawer-footer button")).map((b) => b.textContent),
    }));
  });
  console.log(JSON.stringify(info, null, 1));
  // 试点关闭
  await page.evaluate(() => {
    const w = document.querySelector('[data-testid="agent-skill-import-drawer"]');
    const b = w && w.querySelector(".arco-drawer-close");
    if (b) b.click();
  });
  await page.waitForTimeout(1500);
  const still = await page.evaluate(() => !!document.querySelector('[data-testid="agent-skill-import-drawer"]'));
  console.log("drawer still present after close click: " + still);
  await browser.close();
})().catch((e) => { console.error("ERR " + e.message); process.exit(1); });
