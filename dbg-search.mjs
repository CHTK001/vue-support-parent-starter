import { chromium } from "playwright";
const b = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
const p = await (await b.newContext({ viewport: { width: 1680, height: 1000 } })).newPage();
await p.goto("http://localhost:19093/login", { waitUntil: "domcontentloaded" });
await p.waitForSelector('input[type="password"]', { timeout: 40000 }).catch(()=>{});
await new Promise(r=>setTimeout(r,900));
await p.locator('input[type="text"]').first().fill("admin");
await p.locator('input[type="password"]').first().fill("admin123");
await p.locator('button:has-text("登录")').first().click();
await new Promise(r=>setTimeout(r,4000));
await p.goto("http://localhost:19093/edu/paper", { waitUntil: "domcontentloaded" });
await new Promise(r=>setTimeout(r,3500));
const info = await p.evaluate(() => {
  const items = [...document.querySelectorAll(".el-form-item")].map(e => ({
    label: e.querySelector(".el-form-item__label")?.textContent?.trim() || "(无label)",
    cls: e.className.slice(0,60),
    visible: !!(e.offsetWidth || e.offsetHeight),
  }));
  const btns = [...document.querySelectorAll("button")].map(b=>b.textContent.trim()).filter(Boolean);
  return { items, btns: [...new Set(btns)].slice(0,25) };
});
console.log("  form items: " + JSON.stringify(info.items, null, 0).slice(0, 900));
console.log("  buttons: " + JSON.stringify(info.btns));
await b.close();
