const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.goto("http://localhost:8848", { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 3000));
  const cd = await ctx.newCDPSession(page);
  await cd.send("Page.enable");
  await cd.send("Performance.enable");
  const evs = [];
  const names = ["Page.frameWillBeSent","Page.frameLoaded","Page.frameComposited","Performance.frameWillBeSent"];
  for (const n of names) cd.on(n, (d) => evs.push([n, d.timestamp]));
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    console.log("sock:", evs.length, evs.slice(-3));
  }
  process.exit(0);
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
