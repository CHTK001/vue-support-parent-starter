import { chromium } from "playwright-core";

const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const BASE = "http://127.0.0.1:8848";
const json = (d) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 0, data: d, msg: "ok" }) });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1.5 });
await page.route(/\/ms\//, (r) => r.fulfill(json(null)));
await page.goto(BASE + "#/assets", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(10000);

// 检查 .tel-page 内的输入框（排除顶栏 gsearch）
const pageInputs = await page.evaluate(() => {
  const tel = document.querySelector(".tel-page");
  if (!tel) return { error: "no .tel-page" };
  const wrappers = tel.querySelectorAll(".el-input__wrapper");
  return Array.from(wrappers).slice(0, 3).map((w) => {
    const cs = getComputedStyle(w);
    const inp = w.closest(".el-input");
    return {
      class: inp?.className.slice(0, 50),
      bg: cs.backgroundColor,
      border: cs.borderColor,
      rmBg: getComputedStyle(document.documentElement).getPropertyValue("--rm-bg").trim(),
      rmBorder: getComputedStyle(document.documentElement).getPropertyValue("--rm-border").trim(),
    };
  });
});
console.log("page inputs:", JSON.stringify(pageInputs, null, 2));

// 检查 .tel-page 上的 --rm-* 变量
const telVars = await page.evaluate(() => {
  const tel = document.querySelector(".tel-page");
  if (!tel) return null;
  const cs = getComputedStyle(tel);
  return {
    "--rm-bg": cs.getPropertyValue("--rm-bg").trim(),
    "--rm-border": cs.getPropertyValue("--rm-border").trim(),
    "--rm-text": cs.getPropertyValue("--rm-text").trim(),
    "--bg-elevated": cs.getPropertyValue("--bg-elevated").trim(),
  };
});
console.log("tel vars:", JSON.stringify(telVars, null, 2));

// focus 页面内的第一个输入框
const firstPageInput = await page.evaluateHandle(() => {
  const tel = document.querySelector(".tel-page");
  return tel?.querySelector(".el-input") || null;
});
if (firstPageInput) {
  await firstPageInput.asElement().click();
  await page.waitForTimeout(1000);
  const focusBg = await page.evaluate(() => {
    const tel = document.querySelector(".tel-page");
    const w = tel?.querySelector(".el-input.is-focus .el-input__wrapper");
    if (!w) return "no focus wrapper";
    return getComputedStyle(w).backgroundColor;
  });
  console.log("page input focus bg:", focusBg);
}

// 下拉面板边框
const selects = await page.$$(".tel-page .el-select");
console.log("page select count:", selects.length);
if (selects[1]) {
  await selects[1].click();
  await page.waitForTimeout(1500);
  const dd = await page.evaluate(() => {
    const d = document.querySelector(".el-select-dropdown");
    if (!d) return null;
    const cs = getComputedStyle(d);
    return { border: cs.borderColor, bg: cs.backgroundColor };
  });
  console.log("dropdown:", JSON.stringify(dd));
}

await browser.close();
