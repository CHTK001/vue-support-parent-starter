import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const baseUrl = process.env.SYSTEM_BASE_URL || "http://127.0.0.1:8848";
const username = process.env.SYSTEM_USERNAME || "admin";
const password = process.env.SYSTEM_PASSWORD || "admin@123!456";
const outputDir = path.resolve(process.cwd(), ".runtime", "playwright-system-smoke");
const require = createRequire(
  path.resolve(process.cwd(), "apps/vue-support-sync-starter/package.json"),
);
const { chromium } = require("@playwright/test");

const report = {
  baseUrl,
  username,
  startedAt: new Date().toISOString(),
  navigationError: "",
  title: "",
  url: "",
  bodyText: "",
  landing: {},
  login: {
    attempted: false,
    success: false,
    url: "",
    bodyText: "",
    error: "",
  },
  home: {
    reached: false,
    url: "",
    bodyText: "",
    hasMainContainer: false,
    hasWidgetsHome: false,
  },
  consoleErrors: [],
  consoleWarnings: [],
  pageErrors: [],
  requestsFailed: [],
  keyResponses: [],
};

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

const capturePageState = async (name) => {
  const bodyText = await page.locator("body").innerText().catch(() => "");

  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage: true,
  });

  return {
    title: await page.title().catch(() => ""),
    url: page.url(),
    bodyText: bodyText.slice(0, 4000),
  };
};

page.on("console", (message) => {
  const entry = {
    type: message.type(),
    text: message.text(),
    location: message.location(),
  };

  if (entry.type === "error") {
    report.consoleErrors.push(entry);
    return;
  }

  if (entry.type === "warning") {
    report.consoleWarnings.push(entry);
  }
});

page.on("pageerror", (error) => {
  report.pageErrors.push(String(error));
});

page.on("requestfailed", (request) => {
  report.requestsFailed.push({
    url: request.url(),
    method: request.method(),
    failure: request.failure()?.errorText || "unknown",
  });
});

page.on("response", async (response) => {
  const url = response.url();
  if (!/\/v2\/user\/login|\/v2\/setting\/default|\/v2\/user\/me|\/getAsyncRoutes/.test(url)) {
    return;
  }

  const entry = {
    url,
    status: response.status(),
    method: response.request().method(),
    body: "",
  };

  try {
    entry.body = (await response.text()).slice(0, 1200);
  } catch {
    entry.body = "";
  }

  report.keyResponses.push(entry);
});

try {
  try {
    await page.goto(baseUrl, { waitUntil: "commit", timeout: 30000 });
  } catch (error) {
    report.navigationError = String(error);
  }
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  report.landing = await capturePageState("landing");
  report.title = report.landing.title;
  report.url = report.landing.url;
  report.bodyText = report.landing.bodyText;

  const usernameInput = page
    .locator('input[placeholder*="账号"], input[placeholder*="用户"], input[type="text"]')
    .first();
  const passwordInput = page.locator('input[type="password"]').first();
  const loginButton = page.getByRole("button", { name: /登录/ }).first();

  if (
    (await usernameInput.count()) > 0 &&
    (await passwordInput.count()) > 0 &&
    (await loginButton.count()) > 0
  ) {
    report.login.attempted = true;

    await usernameInput.fill(username);
    await passwordInput.fill(password);
    await loginButton.click();

    const navigated = await page
      .waitForURL((url) => !url.toString().includes("/login"), {
        timeout: 10000,
      })
      .then(() => true)
      .catch(() => false);

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const loginState = await capturePageState("post-login");
    report.login.success = navigated && !loginState.url.includes("/login");
    report.login.url = loginState.url;
    report.login.bodyText = loginState.bodyText;
    report.home.reached = report.login.success;
    report.home.url = loginState.url;
    report.home.bodyText = loginState.bodyText;
    report.home.hasMainContainer =
      (await page.locator(".main-container").count().catch(() => 0)) > 0;
    report.home.hasWidgetsHome =
      (await page.locator(".widgets-home").count().catch(() => 0)) > 0;
  }
} finally {
  await writeFile(
    path.join(outputDir, "report.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
