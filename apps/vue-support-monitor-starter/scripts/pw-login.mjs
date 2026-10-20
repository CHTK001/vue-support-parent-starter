/**
 * 登录脚本：Playwright 直接操作用户名/密码输入框，登录成功后保存 auth state
 */
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:8851";
const STATE_FILE = "tests/e2e/.auth/user-monitor.json";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: BASE });
  const page = await context.newPage();

  console.log("Navigating to login page...");
  await page.goto(`${BASE}/index.html#/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000); // 等 Vue 渲染

  console.log("Filling credentials...");
  await page.getByPlaceholder("请输入用户名").click({ timeout: 10000 });
  await page.keyboard.type("admin", { delay: 50 });
  await page.getByPlaceholder("请输入密码").click({ timeout: 10000 });
  await page.keyboard.type("admin123", { delay: 50 });

  // 检查输入框有值
  const userVal = await page.getByPlaceholder("请输入用户名").inputValue();
  const pwdVal = await page.getByPlaceholder("请输入密码").inputValue();
  console.log("user:", userVal, "pwd:", pwdVal ? "***" : "EMPTY");

  console.log("Clicking login...");
  await page.getByRole("button", { name: "登录" }).click({ timeout: 5000 });

  // 等路由变化（最多 20s）
  console.log("Waiting for navigation...");
  try {
    await page.waitForFunction(
      () => !window.location.hash.includes("login"),
      { timeout: 20000 }
    );
    console.log("Login successful, hash:", await page.evaluate(() => window.location.hash));
  } catch (e) {
    console.error("Login failed:", e.message);
    const url = page.url();
    console.error("Current URL:", url);
    // 截图调试
    await page.screenshot({ path: "login-fail.png" });
    await browser.close();
    process.exit(1);
  }

  await page.waitForTimeout(2000);

  // 读 localStorage 验证 token
  const ls = await page.evaluate(() => {
    return {
      accessToken: localStorage.getItem("system:accessToken")?.substring(0, 60),
      userInfo: localStorage.getItem("system:userInfo")?.substring(0, 60),
      koiUser: localStorage.getItem("system:koi-user")?.substring(0, 60),
    };
  });
  console.log("localStorage:", ls);

  // 保存状态
  await context.storageState({ path: STATE_FILE });
  console.log("State saved to", STATE_FILE);

  await browser.close();
  console.log("Done");
}

main().catch(e => { console.error(e); process.exit(1); });
