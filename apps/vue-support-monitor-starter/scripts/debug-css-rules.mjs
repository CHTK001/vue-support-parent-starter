import { chromium } from "playwright-core";

const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const BASE = "http://127.0.0.1:8848";
const json = (d) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 0, data: d, msg: "ok" }) });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1.5 });
await page.route(/\/ms\//, (r) => r.fulfill(json(null)));
await page.goto(BASE + "#/assets", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(10000);

// 检查根容器是否有 tel-page
const rootClass = await page.evaluate(() => {
  const tel = document.querySelector(".tel-page");
  return tel ? tel.className.slice(0, 80) : "NO .tel-page";
});
console.log("root:", rootClass);

// 非 focus 状态下输入框背景
const inputBg = await page.evaluate(() => {
  const w = document.querySelector(".el-input__wrapper");
  if (!w) return null;
  return { bg: getComputedStyle(w).backgroundColor, parentClass: w.closest(".el-input")?.className };
});
console.log("input normal:", JSON.stringify(inputBg));

// focus 输入框
const input = await page.$(".el-input");
if (input) {
  await input.click();
  await page.waitForTimeout(1000);
  const focusInfo = await page.evaluate(() => {
    const inp = document.querySelector(".el-input");
    const w = document.querySelector(".el-input__wrapper");
    if (!w) return null;
    const cs = getComputedStyle(w);
    // 检查所有匹配的 CSS 规则
    let rules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && w.matches(rule.selectorText)) {
            if (rule.style.backgroundColor || rule.style.background) {
              rules.push({ sel: rule.selectorText.slice(0, 60), bg: rule.style.backgroundColor || rule.style.background, imp: rule.style.getPropertyPriority("background-color") });
            }
          }
        }
      } catch (e) {}
    }
    return { class: inp?.className, bg: cs.backgroundColor, rules: rules.slice(0, 8) };
  });
  console.log("input focus:", JSON.stringify(focusInfo, null, 2));
}

// 下拉面板边框检查
const selects = await page.$$(".el-select");
if (selects[1]) {
  await selects[1].click();
  await page.waitForTimeout(1500);
  const ddInfo = await page.evaluate(() => {
    const d = document.querySelector(".el-select-dropdown");
    if (!d) return null;
    const cs = getComputedStyle(d);
    let rules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && d.matches(rule.selectorText)) {
            if (rule.style.border || rule.style.borderColor) {
              rules.push({ sel: rule.selectorText.slice(0, 60), border: rule.style.border || rule.style.borderColor, imp: rule.style.getPropertyPriority("border") || rule.style.getPropertyPriority("border-color") });
            }
          }
        }
      } catch (e) {}
    }
    return { class: d.className, border: cs.borderColor, rules: rules.slice(0, 8) };
  });
  console.log("dropdown:", JSON.stringify(ddInfo, null, 2));
}

await browser.close();
