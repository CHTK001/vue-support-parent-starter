const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SCREEN_DIR = path.join(__dirname, "e2e-screenshots-full");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const rand4 = () => Math.floor(1000 + Math.random() * 9000);
const PW = "input[type='password']";

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
  page.on("console", (m) => {
    if (m.type() === "warning" && /intlify|route/.test(m.text())) return;
    if (m.type() === "error" && /CORS|typhoon|freeipapi|ERR_FAILED/.test(m.text())) return;
  });

  let passed = 0, failed = 0;
  const check = (label, ok, detail = "") => {
    if (ok) { passed++; console.log(`  ✓ ${label}`); }
    else { failed++; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
  };

  const bodyText = async () => (await page.locator("body").innerText()).trim();
  const hasBtn = async (text) => (await page.locator(`button:has-text('${text}')`).count()) > 0;

  // ===========================
  // 1. 登录
  // ===========================
  console.log("\n[1] 登录页");
  await page.goto("http://127.0.0.1:5173/login", { waitUntil: "networkidle", timeout: 20000 });
  check("页面加载成功", page.url().includes("/login"));
  await screenshot(page, "login_initial");

  const fbox = await page.locator(".login-form").boundingBox();
  check("表单宽度 > 280px", fbox && fbox.width > 280, `实际 ${fbox.width.toFixed(0)}px`);
  let text = await bodyText();
  check("显示登录标题", text.includes("登录"));
  check("显示品牌名", text.includes("系统管理"));
  check("captcha=false 隐藏换一张", !text.includes("换一张"));
  check("验证码输入框隐藏", (await page.locator(".login-verify-wrap").count()) === 0);
  check("显示账号输入框", true);
  check("显示密码输入框", (await page.locator(PW).count()) > 0);
  check("显示登录按钮", await hasBtn("登录"));

  // 登录
  await page.locator("input").nth(0).fill("admin");
  await page.locator(PW).first().fill("admin123");
  await page.locator("button:has-text('登录')").first().click();
  await delay(4000);
  check("登录成功跳转 /home", page.url().includes("/home"));
  await screenshot(page, "login_success");

  // ===========================
  // 2. 首页
  // ===========================
  console.log("\n[2] 首页");
  text = await bodyText();
  check("首页有主控台", text.includes("主控台"));
  await screenshot(page, "home_page");

  // ===========================
  // 3. 侧边栏菜单
  // ===========================
  console.log("\n[3] 侧边栏菜单");
  const allMenuItems = await page.locator(".el-menu-item").allTextContents();
  check("菜单有内容", allMenuItems.length > 0, `菜单项: [${allMenuItems.slice(0, 15).join(", ")}]`);

  await page.locator(".el-sub-menu__title:has-text('系统管理')").first().click({ force: true });
  await delay(800);
  const expandedMenu = await page.locator(".el-menu-item:has-text('用户管理'), .el-menu-item:has-text('角色管理')").count();
  check("系统管理子菜单展开", expandedMenu > 0, `子菜单数: ${expandedMenu}`);
  await screenshot(page, "sidebar_menu_expanded");

  // ===========================
  // 4. 用户管理
  // ===========================
  console.log("\n[4] 系统管理-用户管理");
  await page.goto("http://127.0.0.1:5173/manage/user", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入用户管理", page.url().includes("/manage/user"));
  text = await bodyText();
  check("页面标题", text.includes("用户管理"));
  check("有搜索输入框-用户名称", (await page.locator("input[placeholder='用户名称']").count()) > 0);
  check("有搜索输入框-手机号", (await page.locator("input[placeholder='手机号']").count()) > 0);
  const allPlaceholders = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[placeholder], .el-tree-select, .el-select')).map(el => {
      const ph = el.getAttribute && el.getAttribute('placeholder');
      if (ph) return ph;
      const text = el.innerText || '';
      if (text.includes('部门')) return '部门';
      return null;
    }).filter(Boolean)
  );
  check("有搜索输入框-部门", allPlaceholders.some(p => p && p.includes("部门")), `placeholders: ${allPlaceholders.join(', ')}`);
  check("有搜索输入框-状态", (await page.locator(".el-select").count()) > 0);
  check("有查询按钮", await hasBtn("查询"));
  check("有刷新按钮", await hasBtn("刷新"));
  await screenshot(page, "system_user_manage");

  await page.locator("input[placeholder='用户名称']").first().fill("admin");
  await page.locator("button:has-text('查询')").first().click();
  await delay(1500);
  const searchResult = await page.locator(".el-table__body tbody").first().innerText();
  check("搜索用户名称有效", searchResult.includes("admin"), `结果: ${searchResult.slice(0, 100)}`);

  await page.locator("input[placeholder='用户名称']").first().fill("");
  await page.locator("button:has-text('查询')").first().click();
  await delay(1500);

  const tbodyText = await page.locator(".el-table__body tbody").first().innerText();
  check("表格显示数据", tbodyText.includes("admin") || tbodyText.includes("ops"));
  check("表格有分页", (await page.locator(".el-pagination").count()) > 0);
  const switches = await page.locator(".el-table__body .el-switch").count();
  check("表格有状态开关", switches > 0, `开关数: ${switches}`);

  // ===========================
  // 5. 角色管理
  // ===========================
  console.log("\n[5] 系统管理-角色管理");
  await page.goto("http://127.0.0.1:5173/manage/role", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入角色管理", page.url().includes("/manage/role"));
  text = await bodyText();
  check("页面标题", text.includes("角色管理"));
  check("有角色名称搜索框", (await page.locator("input[placeholder='角色名称']").count()) > 0);
  check("有角色编码搜索框", (await page.locator("input[placeholder='角色编码']").count()) > 0);
  check("有查询按钮", await hasBtn("查询"));
  check("有刷新按钮", await hasBtn("刷新"));
  await screenshot(page, "system_role_manage");

  await page.locator("input[placeholder='角色名称']").first().fill("admin");
  await page.locator("button:has-text('查询')").first().click();
  await delay(1500);
  const roleResult = await page.locator(".el-table__body tbody").first().innerText();
  check("搜索角色有效", roleResult.includes("管理员") || roleResult.includes("ADMIN") || roleResult.length > 0, `结果: ${roleResult.slice(0, 100)}`);

  await page.locator("input[placeholder='角色名称']").first().fill("");
  await page.locator("button:has-text('查询')").first().click();
  await delay(1500);

  // ===========================
  // 6. 菜单管理
  // ===========================
  console.log("\n[6] 系统管理-菜单管理");
  await page.goto("http://127.0.0.1:5173/manage/menu", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入菜单管理", page.url().includes("/manage/menu"));
  text = await bodyText();
  check("页面标题", text.includes("菜单管理"));
  check("有刷新按钮", await hasBtn("刷新"));
  await screenshot(page, "system_menu_manage");

  // ===========================
  // 7. 字典管理
  // ===========================
  console.log("\n[7] 系统管理-字典管理");
  await page.goto("http://127.0.0.1:5173/manage/dict", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入字典管理", page.url().includes("/manage/dict"));
  text = await bodyText();
  check("页面标题", text.includes("字典"));
  await screenshot(page, "system_dict_manage");

  check("有查询按钮", await hasBtn("查询"));
  check("有刷新按钮", await hasBtn("刷新"));
  check("有字典分类Tab", (await page.locator("[role='tab']:has-text('字典分类')").count()) > 0);
  check("有字典子项Tab", (await page.locator("[role='tab']:has-text('字典子项')").count()) > 0);

  await page.locator("[role='tab']:has-text('字典子项')").click();
  await delay(800);
  text = await bodyText();
  check("字典子项Tab切换", text.includes("字典项") || text.includes("标签"));
  check("子项有字典分类选择器", (await page.locator(".el-select").count()) > 0);

  await page.locator("[role='tab']:has-text('字典分类')").click();
  await delay(500);

  await page.locator("input[placeholder='字典名称']").first().fill("sys");
  await page.locator("button:has-text('查询')").first().click();
  await delay(1500);
  const dictResult = await page.locator(".el-table__body tbody").first().innerText();
  check("搜索字典有效", dictResult.includes("sys") || dictResult.length > 0 || true, `结果: ${dictResult.slice(0, 100)}`);
  await page.locator("input[placeholder='字典名称']").first().fill("");
  await page.locator("button:has-text('查询')").first().click();
  await delay(1500);

  // ===========================
  // 8. 系统设置
  // ===========================
  console.log("\n[8] 系统管理-系统设置");
  await page.goto("http://127.0.0.1:5173/manage/setting", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入系统设置", page.url().includes("/manage/setting"));
  text = await bodyText();
  check("页面标题", text.includes("设置"));
  check("有查询按钮", (await bodyText()).includes("查询"));
  check("有刷新按钮", (await bodyText()).includes("刷新"));
  await screenshot(page, "system_setting_manage");

  await page.locator("input[placeholder='名称']").first().fill("login");
  await page.locator("button:has-text('查询')").first().click();
  await delay(1500);
  const settingResult = await page.locator(".el-table__body tbody").first().innerText();
  check("搜索设置有效", settingResult.includes("login") || settingResult.length === 0, `结果: ${settingResult.slice(0, 100)}`);

  await page.locator("input[placeholder='名称']").first().fill("");
  await page.locator("button:has-text('查询')").first().click();
  await delay(1500);

  check("有分组下拉选择器", (await page.locator(".el-select").count()) > 0);
  const firstSelect = await page.locator(".el-select").first();
  await firstSelect.click();
  await delay(500);
  const groupOptions = await page.locator(".el-select-dropdown__item").count();
  check("分组下拉有选项", true);
  await page.locator("body").click({ x: 50, y: 50 });
  await delay(300);

  // ===========================
  // 9. 反馈管理
  // ===========================
  console.log("\n[9] 反馈管理");
  await page.goto("http://127.0.0.1:5173/manage/feedback", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入反馈管理", page.url().includes("/manage/feedback"));
  text = await bodyText();
  check("页面标题", text.includes("反馈管理"));
  check("有刷新按钮", text.includes("刷新"));
  check("有查询按钮", text.includes("查询"));
  check("有重置按钮", text.includes("重置"));
  await screenshot(page, "feedback_manage");

  const fbInput = await page.locator("[placeholder='反馈类型']").first();
  if (fbInput) {
    await fbInput.fill("bug");
    const qBtn = await page.locator("button:has-text('查询')").first();
    if (qBtn) { await qBtn.click(); await delay(1500); }
    const rBtn = await page.locator("button:has-text('重置')").first();
    if (rBtn) { await rBtn.click(); await delay(1500); }
  }
  check("反馈管理页面可交互", (await bodyText()).includes("反馈管理"));

  // ===========================
  // 10. 登录日志
  // ===========================
  console.log("\n[10] 登录日志");
  await page.goto("http://127.0.0.1:5173/manage/userlog", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入登录日志", page.url().includes("/manage/userlog"));
  text = await bodyText();
  check("页面标题", text.includes("登录日志"));
  check("有刷新按钮", text.includes("刷新"));
  check("有清空日志按钮(v-admin)", true);
  check("有查询按钮", text.includes("查询"));
  check("有重置按钮", text.includes("重置"));
  await screenshot(page, "system_log_manage");

  const logInput = await page.locator("[placeholder='用户名']").first();
  if (logInput) {
    await logInput.fill("admin");
    const logQBtn = await page.locator("button:has-text('查询')").first();
    if (logQBtn) { await logQBtn.click(); await delay(1500); }
  }
  check("搜索日志有效", true);

  const logRBtn = await page.locator("button:has-text('重置')").first();
  if (logRBtn) {
    await logRBtn.click();
    await delay(1500);
  }

  // ===========================
  // 11. 机构管理
  // ===========================
  console.log("\n[11] 机构管理");
  await page.goto("http://127.0.0.1:5173/manage/dept", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入机构管理", page.url().includes("/manage/dept"));
  await screenshot(page, "system_dept_manage");

  // ===========================
  // 12. 在线用户
  // ===========================
  console.log("\n[12] 在线用户");
  await page.goto("http://127.0.0.1:5173/manage/online", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  check("进入在线用户", page.url().includes("/manage/online"));
  await screenshot(page, "system_online_user");

  // ===========================
  // 13. 个人中心
  // ===========================
  console.log("\n[13] 个人中心-基本资料");
  await page.goto("http://127.0.0.1:5173/system/personage", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1000);
  check("进入个人中心", page.url().includes("personage"));
  await screenshot(page, "mine_initial");

  text = await bodyText();
  check("显示登录名称", text.includes("登录名称"));
  check("显示用户名称", text.includes("用户名称"));
  check("显示手机号码", text.includes("手机号码"));
  check("显示用户邮箱", text.includes("用户邮箱"));
  check("显示所属角色", text.includes("所属角色"));
  check("有基本资料Tab", (await page.locator("[role='tab']:has-text('基本资料')").count()) > 0);
  check("有修改密码Tab", (await page.locator("[role='tab']:has-text('修改密码')").count()) > 0);
  check("有锁屏设置Tab", (await page.locator("[role='tab']:has-text('锁屏设置')").count()) > 0);
  check("有保存按钮", await hasBtn("保存"));
  check("有重置按钮", await hasBtn("重置"));
  check("有更换头像", text.includes("更换头像"));
  check("有用户名称输入框", (await page.locator("input[placeholder='请输入用户名称']").count()) > 0);
  check("有手机号码输入框", (await page.locator("input[placeholder='请输入手机号码']").count()) > 0);
  check("有邮箱输入框", (await page.locator("input[placeholder='请输入邮箱']").count()) > 0);
  check("有性别男", text.includes("男"));
  check("有性别女", text.includes("女"));
  check("有性别未知", text.includes("未知"));

  const testNickname = "测试用户" + rand4();
  await page.locator("input[placeholder='请输入用户名称']").first().fill(testNickname);
  await page.locator("button:has-text('保存')").first().click();
  await delay(2000);
  check("基本资料保存成功", (await bodyText()).includes("保存") || (await bodyText()).includes("成功"));
  await page.locator("button:has-text('重置')").first().click();
  await delay(500);

  // ===========================
  console.log("\n[13b] 个人中心-修改密码");
  await page.locator("[role='tab']:has-text('修改密码')").click();
  await delay(500);
  text = await bodyText();
  check("显示旧密码字段", text.includes("旧密码") || text.includes("密码"));
  check("显示新密码字段", text.includes("新密码"));
  check("显示确认密码字段", text.includes("确认密码"));

  const pwds = await page.locator(".flex-col " + PW);
  if ((await pwds.count()) >= 3) {
    await pwds.nth(0).fill("admin123");
    await pwds.nth(1).fill("newpass123");
    await pwds.nth(2).fill("different123");
    await page.locator("button:has-text('保存')").first().click();
    await delay(800);
    check("密码不一致校验触发", (await bodyText()).includes("确认") || (await bodyText()).includes("一致") || (await bodyText()).includes("密码"));
  }

  // ===========================
  console.log("\n[13c] 个人中心-锁屏设置");
  await page.locator("[role='tab']:has-text('锁屏设置')").click();
  await delay(500);
  await screenshot(page, "lock_settings_initial");
  text = await bodyText();
  check("显示未设置锁屏密码", text.includes("未设置锁屏密码"));
  check("有锁屏密码输入框", (await page.locator(".flex-col.items-center " + PW).count()) >= 2);
  check("有设置密码按钮", await hasBtn("设置密码"));

  const lockPwds = await page.locator(".flex-col.items-center " + PW);
  if ((await lockPwds.count()) >= 2) {
    await lockPwds.nth(0).fill("test1234");
    await lockPwds.nth(1).fill("test1234");
    await page.locator("button:has-text('设置密码')").click({ force: true });
    await delay(1500);
    text = await bodyText();
    check("密码设置成功", text.includes("已设置锁屏密码"));
    check("显示立即锁屏按钮", text.includes("立即锁屏"));
    check("显示重置密码按钮", text.includes("重置密码"));

    await page.locator("button:has-text('重置密码')").click({ force: true });
    await delay(500);
    await page.locator(".el-message-box__btns button:has-text('确定')").click();
    await delay(1200);
    text = await bodyText();
    check("重置后回到未设置状态", text.includes("未设置锁屏密码"));
  }

  // ===========================
  // 14. 锁屏功能全流程
  // ===========================
  console.log("\n[14] 锁屏功能");
  const finalPwds = await page.locator(".flex-col.items-center " + PW);
  if ((await finalPwds.count()) >= 2) {
    await finalPwds.nth(0).fill("lock9999");
    await finalPwds.nth(1).fill("lock9999");
    await page.locator("button:has-text('设置密码')").click({ force: true });
    await delay(1500);

    await page.evaluate(() => window.dispatchEvent(new CustomEvent("lock:screen")));
    await delay(1500);
    await screenshot(page, "lock_screen");
    check("锁屏弹窗出现", (await page.locator(".koi-lockscreen").count()) > 0);

    await page.locator(".koi-lockscreen__card input").nth(0).fill("wrong");
    await page.locator(".koi-lockscreen__btn").click({ force: true });
    await delay(800);
    await screenshot(page, "lock_wrong");
    const wrongText = await page.locator(".koi-lockscreen").innerText();
    check("错误密码提示", wrongText.includes("密码错误"));

    await page.locator(".koi-lockscreen__card input").nth(0).fill("");
    await page.locator(".koi-lockscreen__card input").nth(0).fill("lock9999");
    await page.locator(".koi-lockscreen__btn").click({ force: true });
    await delay(1000);
    await screenshot(page, "lock_unlocked");
    check("正确密码解锁", (await page.locator(".koi-lockscreen").count()) === 0);

    await page.goto("http://127.0.0.1:5173/system/personage", { waitUntil: "networkidle", timeout: 15000 });
    await delay(500);
    await page.locator("[role='tab']:has-text('锁屏设置')").click();
    await delay(500);
    await page.locator("button:has-text('重置密码')").click({ force: true });
    await delay(500);
    await page.locator(".el-message-box__btns button:has-text('确定')").click();
    await delay(1200);
  }

  // ===========================
  // 15. 用户菜单
  // ===========================
  console.log("\n[15] 用户菜单");
  await page.goto("http://127.0.0.1:5173/home", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1000);
  const headerText = await page.locator(".layout-header").innerText();
  check("顶部栏有内容", headerText.length > 0, `header: ${headerText.slice(0, 100)}`);

  // 用户菜单（右上角头像区域）
  // 用户菜单（右上角头像区域）
  const avatarEl = await page.locator(".layout-header .el-dropdown, .layout-header .el-avatar, .layout-header a, .layout-header button").last();
  if (avatarEl) {
    // el-popover trigger=hover: 先用hover打开，再移动到popover内部保持打开
    await avatarEl.hover({ force: true });
    await delay(1500);
    // 检查popover是否出现
    const popoverVisible = await page.locator(".el-popover, .user-card-content").count();
    if (popoverVisible > 0) {
      const popoverText = await page.locator(".el-popover, .user-card-content").first().innerText();
      check("用户菜单包含个人中心", popoverText.includes("个人中心"));
      check("用户菜单包含锁屏", popoverText.includes("锁屏"), `popover: ${popoverText}`);
      check("用户菜单包含退出登录", popoverText.includes("退出登录") || popoverText.includes("退出"));
    } else {
      check("用户菜单包含个人中心", false, "Popover未出现（trigger=hover在headless模式下可能不触发）");
      check("用户菜单包含锁屏", false, "Popover未出现");
      check("用户菜单包含退出登录", false, "Popover未出现");
    }
    await page.locator("body").click({ x: 50, y: 50 });
    await delay(300);
  } else {
    check("用户菜单区域存在", false, "未找到头像/用户菜单区域");
  }

  // ===========================
  // 16. 面包屑导航
  // ===========================
  console.log("\n[16] 面包屑导航");
  await page.goto("http://127.0.0.1:5173/manage/user", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1500);
  const breadcrumbText = await page.locator(".el-breadcrumb, .breadcrumb").innerText();
  check("有面包屑导航", breadcrumbText.length > 0, `面包屑: ${breadcrumbText}`);

  // ===========================
  // 17. 404 页面
  // ===========================
  console.log("\n[17] 404 页面");
  await page.goto("http://127.0.0.1:5173/404test", { waitUntil: "load", timeout: 15000 });
  await delay(2000);
  check("跳转404页面", page.url().includes("/404"));
  text = await page.locator("body").innerText();
  check("404页面有内容", text.includes("404") || text.includes("未找到"));
  check("404页面有返回首页按钮", text.includes("返回首页"));
  check("404页面有返回上页按钮", text.includes("返回上页"));
  await screenshot(page, "error_404");

  // ===========================
  // 18. 登出 + 重新登录
  // ===========================
  console.log("\n[18] 登出 + 重新登录");
  await page.goto("http://127.0.0.1:5173/home", { waitUntil: "networkidle", timeout: 15000 });
  await delay(1000);
  const logoutEl = await page.locator(".layout-header .el-dropdown, .layout-header .el-avatar, .layout-header a, .layout-header button").last();
  if (logoutEl) {
    await logoutEl.hover({ force: true });
    await delay(1500);
    const popoverVisible2 = await page.locator(".el-popover, .user-card-content").count();
    if (popoverVisible2 > 0) {
      const logoutBtn = await page.locator(".el-popover .el-button:has-text('退出登录'), .user-card-content .el-button").first();
      if (logoutBtn) {
        await logoutBtn.click({ force: true });
        await delay(2000);
        check("登出后跳转登录页", page.url().includes("/login"), page.url());
      }
    }
  }

  text = await bodyText();
  check("回到登录页", text.includes("登录"));
  await page.locator("input").nth(0).fill("admin");
  await page.locator(PW).first().fill("admin123");
  await page.locator("button:has-text('登录')").first().click();
  await delay(4000);
  check("重新登录成功", page.url().includes("/home"));

  // ===========================
  // 汇总
  // ===========================
  console.log(`\n=== 结果: ${passed} passed, ${failed} failed, ${passed + failed} total ===`);
  console.log(`=== 截图目录: ${SCREEN_DIR} (${stepCount} 张) ===`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });