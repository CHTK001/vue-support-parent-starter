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
console.log("  localStorage keys: " + JSON.stringify(await p.evaluate(()=>Object.keys(localStorage))));
console.log("  sessionStorage keys: " + JSON.stringify(await p.evaluate(()=>Object.keys(sessionStorage))));
await p.goto("http://localhost:19093/eduai/paper-compose", { waitUntil: "domcontentloaded" });
await new Promise(r=>setTimeout(r,4500));
const info = await p.evaluate(() => {
  const heads = [...document.querySelectorAll(".panel-head")].map(h => ({
    cls: h.parentElement.className.slice(0,70),
    title: h.querySelector(".panel-head__title")?.textContent?.trim(),
    btns: [...h.querySelectorAll("button")].map(b => b.getAttribute("aria-label") || b.textContent.trim() || "(无标签)"),
  }));
  return { heads, pageCls: document.querySelector(".compose-page")?.className };
});
console.log("  pageClass: " + info.pageCls);
console.log("  panel-head 数量: " + info.heads.length);
info.heads.forEach((h,i)=>console.log(`    [${i}] parent="${h.cls}" title="${h.title}" btns=${JSON.stringify(h.btns)}`));
const tips = await p.evaluate(()=>[...document.querySelectorAll(".panel-head__actions button")].map(b=>({al:b.getAttribute("aria-label"),t:b.getAttribute("title"),dis:b.disabled})));
console.log("  左栏按钮明细: " + JSON.stringify(tips, null, 0));
await b.close();
