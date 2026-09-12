import { chromium } from "playwright-core";

const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const BASE = "http://127.0.0.1:8848";
const json = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 0, data, msg: "ok" }) });
const HOSTS = [
  { id: 1, serverHostName: "web-01-prod", serverHostAddress: "10.20.30.40", serverHostPort: 22, serverHostOsType: "LINUX", serverHostOnline: 1, serverHostRemoteEnabled: 1 },
  { id: 2, serverHostName: "db-01-prod", serverHostAddress: "10.20.30.41", serverHostPort: 22, serverHostOsType: "LINUX", serverHostOnline: 1, serverHostRemoteEnabled: 1 },
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
const errs = [];
page.on("pageerror", (e) => errs.push("PAGEERROR: " + String(e).slice(0, 500)));
page.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE: " + m.text().slice(0, 250)); });
page.on("requestfailed", (r) => errs.push("REQFAIL: " + r.url().slice(0, 120) + " " + (r.failure()?.errorText ?? "")));
await page.route(/\/ms\//, (r) => r.fulfill(json(null)));
await page.route(/\/ms\/server\/host/, (r) => r.fulfill(json(HOSTS)));

await page.goto(BASE + "#/terminal", { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => console.log("goto:", e.message));
await page.waitForTimeout(9000);

const info = await page.evaluate(() => ({
  hash: location.hash,
  hasTw: !!document.querySelector(".tw"),
  railCount: document.querySelectorAll(".rail").length,
  telRailCount: document.querySelectorAll(".tel-rail").length,
  mainText: (document.querySelector("main")?.innerText || "").slice(0, 120),
  bodyText: (document.body.innerText || "").slice(0, 80),
}));
console.log(JSON.stringify(info, null, 1));
console.log("errors:", errs.length ? errs.slice(0, 12) : "none");
await browser.close();
