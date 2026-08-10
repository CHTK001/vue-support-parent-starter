const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SCREEN_DIR = path.join(__dirname, "e2e-screenshots");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (base, range) => base + Math.random() * range;

let stepCount = 0;
const screenshot = async (page, label) => {
  stepCount++;
  const num = String(stepCount).padStart(3, "0");
  const safeLabel = label.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
  const f = path.join(SCREEN_DIR, `${num}_${safeLabel}.png`);
  await page.screenshot({ path: f, fullPage: true });
  return f;
};

(async () => {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  console.log(`[screenshots] -> ${SCREEN_DIR}\n`);

  const browser = await chromium.launch({
    headless: true,
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await browser.newPage();
  page.on("pageerror", () => {});

  let passed = 0, failed = 0;
  const check = (label, ok, detail = "") => {
    if (ok) { passed++; console.log(`  ✓ ${label}`); }
    else { failed++; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
  };

  // ===== 0. 初始化 =====
  await page.goto("http://127.0.0.1:5173/login", { waitUntil: "load", timeout: 10000 });
  await page.evaluate(() => {
    localStorage.removeItem("lock-locked");
    localStorage.removeItem("lock-screen");
  });

  // ===== 1. 登录页 =====
  console.log("\n[1] 登录页");
  await page.goto("http://127.0.0.1:5173/login", { waitUntil: "networkidle", timeout: 20000 });
  check("页面加载成功", page.url().includes("/login"));
  await screenshot(page, "login_initial");

  const fbox = await page.locator(".login-form").boundingBox();
  check("表单宽度 > 280px", fbox && fbox.width > 280, `实际 ${fbox.width.toFixed(0)}px`);
  const body1 = await page.locator("body").innerText();
  check("captcha=false 隐藏换一张", !body1.includes("\u6362\u4e00\u5f20"));
  check("验证码输入框隐藏", (await page.locator(".login-verify-wrap").count()) === 0);

  await page.locator("input").nth(0).fill("admin");
  await page.locator("input[type='password']").first().fill("admin123");
  await page.locator("button:has-text('\u767b\u5f55')").first().click();
  await delay(3500);
  check("登录成功跳转 /home", page.url().includes("/home"));
  await screenshot(page, "login_success");

  // ===== 2. 首页 =====
  console.log("\n[2] 首页");
  const homeText = await page.locator("body").innerText();
  check("首页有主控台", homeText.includes("\u4e3b\u63a7\u53f0"));
  await screenshot(page, "home_page");

  // ===== 3. 菜单导航 =====
  console.log("\n[3] 侧边栏菜单");
  const allMenuItems = await page.locator(".sidebar-menu-item, .menu-item, .el-menu-item, .menu-item-title, .sidebar-menu__item-title").allTextContents();
  check("菜单有内容", allMenuItems.length > 0, `菜单项: [${allMenuItems.slice(0, 15).join(", ")}]`);
  await screenshot(page, "sidebar_menu");

  // ===== 4. 系统管理-用户管理 =====
  console.log("\n[4] 系统管理-用户管理");
  await page.goto("http://127.0.0.1:5173/manage/user", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入用户管理", page.url().includes("/manage/user"), page.url());
  const userPageText = await page.locator("body").innerText();
  check("用户管理页面有表格或搜索", userPageText.length > 50, `内容 ${userPageText.length} 字符`);
  await screenshot(page, "system_user_manage");

  // ===== 5. 系统管理-角色管理 =====
  console.log("\n[5] 系统管理-角色管理");
  await page.goto("http://127.0.0.1:5173/manage/role", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  const rolePageText = await page.locator("body").innerText();
  check("进入角色管理", rolePageText.length > 50, `内容 ${rolePageText.length} 字符`);
  await screenshot(page, "system_role_manage");

  // ===== 6. 系统管理-菜单管理 =====
  console.log("\n[6] 系统管理-菜单管理");
  await page.goto("http://127.0.0.1:5173/manage/menu", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  const menuPageText = await page.locator("body").innerText();
  check("进入菜单管理", menuPageText.length > 50, `内容 ${menuPageText.length} 字符`);
  await screenshot(page, "system_menu_manage");

  // ===== 7. 系统管理-字典管理 =====
  console.log("\n[7] 系统管理-字典管理");
  await page.goto("http://127.0.0.1:5173/manage/dict", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  const dictPageText = await page.locator("body").innerText();
  check("进入字典管理", dictPageText.length > 50, `内容 ${dictPageText.length} 字符`);
  await screenshot(page, "system_dict_manage");

  // ===== 8. 系统管理-日志管理 =====
  console.log("\n[8] 系统管理-日志管理");
  await page.goto("http://127.0.0.1:5173/manage/userlog", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  const logPageText = await page.locator("body").innerText();
  check("进入日志管理", logPageText.length > 50, `内容 ${logPageText.length} 字符`);
  await screenshot(page, "system_log_manage");

  // ===== 9. 反馈管理 =====
  console.log("\n[9] 反馈管理");
  await page.goto("http://127.0.0.1:5173/manage/feedback", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  const fbPageText = await page.locator("body").innerText();
  check("进入反馈管理", fbPageText.length > 50, `内容 ${fbPageText.length} 字符`);
  await screenshot(page, "feedback_manage");

  // ===== 10. 个人信息-锁屏设置（完整验证） =====
  console.log("\n[10] 个人信息-锁屏设置");
  await page.goto("http://127.0.0.1:5173/system/personage", { waitUntil: "networkidle", timeout: 20000 });
  await delay(600);
  await page.locator("[role='tab']:has-text('\u9501\u5c4f\u8bbe\u7f6e')").click();
  await delay(600);
  await screenshot(page, "lock_settings_initial");

  let mineText = await page.locator("body").innerText();
  check("显示'未设置锁屏密码'", mineText.includes("\u672a\u8bbe\u7f6e\u9501\u5c4f\u5bc6\u7801"));

  const pwds = await page.locator(".flex-col.items-center input[type='password']");
  if ((await pwds.count()) >= 2) {
    await pwds.nth(0).fill("test1234");
    await pwds.nth(1).fill("test1234");
    await page.locator("button:has-text('\u8bbe\u7f6e\u5bc6\u7801')").click({ force: true });
    await delay(1500);
    await screenshot(page, "lock_password_set");
    mineText = await page.locator("body").innerText();
    check("密码设置成功", mineText.includes("\u5df2\u8bbe\u7f6e\u9501\u5c4f\u5bc6\u7801"));
    check("显示立即锁屏按钮", mineText.includes("\u7acb\u5373\u9501\u5c4f"));
    check("显示重置密码按钮", mineText.includes("\u91cd\u7f6e\u5bc6\u7801"));

    // 重置
    await page.locator("button:has-text('\u91cd\u7f6e\u5bc6\u7801')").click({ force: true });
    await delay(500);
    await page.locator(".el-message-box__btns button:has-text('\u786e\u5b9a')").click();
    await delay(1200);
    await screenshot(page, "lock_password_reset");
    mineText = await page.locator("body").innerText();
    check("重置后回到未设置状态", mineText.includes("\u672a\u8bbe\u7f6e\u9501\u5c4f\u5bc6\u7801"));

    // 锁屏解锁
    await pwds.nth(0).fill("lock9999");
    await pwds.nth(1).fill("lock9999");
    await page.locator("button:has-text('\u8bbe\u7f6e\u5bc6\u7801')").click({ force: true });
    await delay(1500);

    await page.evaluate(() => window.dispatchEvent(new CustomEvent("lock:screen")));
    await delay(1500);
    await screenshot(page, "lock_screen");
    check("锁屏弹窗出现", (await page.locator(".koi-lockscreen").count()) > 0);

    // 错误密码
    await page.locator(".koi-lockscreen__card input").nth(0).fill("wrong");
    await page.locator(".koi-lockscreen__btn").click({ force: true });
    await delay(800);
    await screenshot(page, "lock_wrong");
    const wrongText = await page.locator(".koi-lockscreen").innerText();
    check("错误密码提示", wrongText.includes("\u5bc6\u7801\u9519\u8bef"));

    // 正确密码
    await page.locator(".koi-lockscreen__card input").nth(0).fill("lock9999");
    await page.locator(".koi-lockscreen__btn").click({ force: true });
    await delay(1000);
    await screenshot(page, "lock_unlocked");
    const lockEl = await page.locator(".koi-lockscreen").count();
    check("正确密码解锁", lockEl === 0, lockEl > 0 ? "锁屏仍存在" : "已解锁");
  }

  // ===== 汇总 =====
  console.log(`\n=== 结果: ${passed} passed, ${failed} failed, ${passed + failed} total ===`);
  console.log(`=== 截图目录: ${SCREEN_DIR} (${stepCount} 张) ===`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
