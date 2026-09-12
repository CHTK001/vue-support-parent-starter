import { chromium } from "playwright-core";

const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const BASE = "http://127.0.0.1:8848";
const json = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 0, data, msg: "ok" }) });

const HOSTS = [
  { id: 1, serverHostName: "web-01-prod", serverHostAddress: "10.20.30.40", serverHostPort: 22, serverHostOsType: "LINUX", serverHostOnline: 1, serverHostRemoteEnabled: 1 },
  { id: 2, serverHostName: "db-01-prod", serverHostAddress: "10.20.30.41", serverHostPort: 22, serverHostOsType: "LINUX", serverHostOnline: 1, serverHostRemoteEnabled: 1 },
];
const IDENTITIES = [
  { id: 1, msServerIdentityName: "生产运维", msServerIdentityAuthType: "PUBLIC_KEY", msServerIdentityUsername: "ops", msServerIdentityKeyId: 1, msServerIdentityRemark: "生产环境 root 私钥" },
  { id: 2, msServerIdentityName: "数据库 DBA", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "dba", msServerIdentityRemark: "数据库账号" },
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

for (const route of ["/account", "/terminal"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR: " + String(e).slice(0, 400)));
  page.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE: " + m.text().slice(0, 200)); });
  await page.route(/\/ms\//, (r) => r.fulfill(json(null)));
  await page.route(/\/ms\/server\/host/, (r) => r.fulfill(json(HOSTS)));
  await page.route(/\/ms\/server\/identity/, (r) => r.fulfill(json(IDENTITIES)));
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => console.log(route, "goto:", e.message));
  await page.waitForTimeout(8000);
  const info = await page.evaluate(() => {
    const app = document.querySelector("#app");
    return {
      hash: location.hash,
      appChildren: app?.children.length ?? -1,
      appHtml: (app?.innerHTML ?? "").slice(0, 300),
      hasMain: !!document.querySelector("main"),
      bodyClass: document.body.className,
      text: (document.body.innerText || "").slice(0, 120),
    };
  });
  console.log("=== " + route + " ===");
  console.log("errors:", errs.length ? errs.slice(0, 6) : "none");
  console.log(JSON.stringify(info, null, 1));
  await page.close();
}
await browser.close();
