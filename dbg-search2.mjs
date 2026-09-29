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
  const sel = document.querySelector("input[type=text], .el-input__inner");
  // 找到包含「搜索」按钮的那块容器
  const searchBtn = [...document.querySelectorAll("button")].find(x=>x.textContent.trim()==="搜索");
  const box = searchBtn?.closest("form, .el-form, [class*=search], [class*=Search]");
  const area = box?.parentElement || box;
  return {
    boxClass: box?.className,
    html: (area?.outerHTML || "").replace(/\s+/g," ").slice(0, 2200),
  };
});
console.log("  boxClass: " + info.boxClass);
console.log("  ---");
console.log("  " + info.html);
await b.close();
