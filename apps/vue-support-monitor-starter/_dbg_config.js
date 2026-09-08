const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://127.0.0.1:8848/#/config", { waitUntil: "load" });
  await page.waitForTimeout(4000);
  const btns = await page.locator(".main button").all();
  console.log("button count:", btns.length);
  for (const b of btns) {
    const txt = (await b.innerText().catch(() => "")) || "(icon)";
    const title = await b.getAttribute("title").catch(() => null);
    const visible = await b.isVisible().catch(() => false);
    const disabled = await b.isDisabled().catch(() => false);
    console.log(`  [${visible ? "v" : "h"}${disabled ? " D" : " "}] ${txt.trim().slice(0, 20)} ${title ? `title=${title}` : ""}`);
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
