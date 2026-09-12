import { chromium } from "playwright-core";

const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const BASE = "http://127.0.0.1:8848";
const json = (d) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 0, data: d, msg: "ok" }) });
const HOSTS = [{ id: 1, serverHostName: "web-01", serverHostAddress: "10.0.0.1", serverHostPort: 22, serverHostOsType: "LINUX", serverHostOnline: 1 }];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1.5 });
await page.route(/\/ms\//, (r) => r.fulfill(json(null)));
await page.route(/\/ms\/server\/host/, (r) => r.fulfill(json(HOSTS)));
await page.goto(BASE + "#/assets", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(10000);
const title = await page.title();
const url = page.url();
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200));
console.log("title:", title, "url:", url);
console.log("body:", bodyText.replace(/\n/g, " | "));

const selects = await page.$$(".el-select");
console.log("select count:", selects.length);

if (selects[1]) {
  await selects[1].click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/dropdown-debug.png" });
  const dd = await page.evaluate(() => {
    const d = document.querySelector(".el-select-dropdown");
    if (!d) return null;
    const cs = getComputedStyle(d);
    return { bg: cs.backgroundColor, border: cs.borderColor, class: d.className.slice(0, 80) };
  });
  console.log("dropdown:", JSON.stringify(dd));
  const items = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".el-select-dropdown__item")).slice(0, 4).map((i) => ({
      text: i.textContent.trim().slice(0, 16),
      bg: getComputedStyle(i).backgroundColor,
      color: getComputedStyle(i).color,
    }))
  );
  console.log("items:", JSON.stringify(items));
}

// 检查输入框 focus 状态
const input = await page.$(".el-input");
if (input) {
  await input.click();
  await page.waitForTimeout(800);
  const inputInfo = await page.evaluate(() => {
    const w = document.querySelector(".el-input__wrapper");
    if (!w) return null;
    const cs = getComputedStyle(w);
    return { bg: cs.backgroundColor, boxShadow: cs.boxShadow.slice(0, 80), border: cs.borderColor };
  });
  console.log("input focus:", JSON.stringify(inputInfo));
}

await browser.close();
