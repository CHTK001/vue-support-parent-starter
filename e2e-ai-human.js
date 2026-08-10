const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SCREEN_DIR = path.join(__dirname, "e2e-ai-screenshots");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (min, max) => min + Math.random() * (max - min);

const BASE = "http://localhost:8088";

let stepCount = 0;
const screenshot = async (page, label) => {
  stepCount++;
  const num = String(stepCount).padStart(3, "0");
  const safeLabel = label.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, "_");
  const f = path.join(SCREEN_DIR, `${num}_${safeLabel}.png`);
  await page.screenshot({ path: f, fullPage: false });
  console.log(`  [shot] ${num}_${safeLabel}.png`);
  return f;
};

(async () => {
  fs.mkdirSync(SCREEN_DIR, { recursive: true });
  console.log(`[screenshots] -> ${SCREEN_DIR}\n`);

  const browser = await chromium.launch({
    headless: false,          // 真人模式：显示浏览器
    slowMo: 100,              // 放慢操作模拟真人
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/(intlify|route|CORS|typhoon|freeipapi|ERR_FAILED)/.test(m.text())) {
      consoleErrors.push(m.text());
    }
  });
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  let passed = 0, failed = 0;
  const check = (label, ok, detail = "") => {
    if (ok) { passed++; console.log(`  ✓ ${label}`); }
    else { failed++; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
  };

  // ============================================================
  // 0. 首页加载（直接访问 /chat）
  // ============================================================
  console.log("\n[0] 首页加载");
  await page.goto(`${BASE}/#/chat`, { waitUntil: "networkidle", timeout: 30000 });
  await delay(jitter(2000, 3000));
  check("首页加载成功", page.url().includes("/chat"));
  await screenshot(page, "ai_home_initial");

  // ============================================================
  // 1. AI 对话 - Chat
  // ============================================================
  console.log("\n[1] AI 对话");
  // 已处于 /chat
  const chatText = await page.locator("body").innerText();
  check("Chat 页面渲染完成", chatText.length > 30, `内容 ${chatText.length} 字符`);
  await screenshot(page, "ai_chat");

  // 真人输入
  const chatInput = page.locator("textarea, input[type='text']:not([readonly]), [contenteditable='true']");
  if ((await chatInput.count()) > 0) {
    await chatInput.first().click({ delay: jitter(100, 300) });
    await delay(jitter(400, 800));
    await chatInput.first().fill("你好，请介绍一下你自己");
    await delay(jitter(600, 1000));
    await screenshot(page, "ai_chat_input");

    const sendBtn = page.locator("button:has-text('发送'), button[aria-label*='send' i], button:has-text('Send')");
    if ((await sendBtn.count()) > 0) {
      await sendBtn.first().click();
      await delay(jitter(4000, 6000));
      await screenshot(page, "ai_chat_response");
    } else {
      await chatInput.first().press("Enter");
      await delay(jitter(4000, 6000));
      await screenshot(page, "ai_chat_response");
    }
  } else {
    check("Chat 输入框存在", false, "ReChat 组件可能未正确加载");
  }

  // ============================================================
  // 2. 侧边栏 -> 图像生成
  // ============================================================
  console.log("\n[2] 侧边栏 -> 图像生成");
  const imgMenu = page.locator(".app-sidebar__item:has-text('图像生成')");
  const imgCount = await imgMenu.count();
  check("侧边栏有'图像生成'菜单", imgCount > 0, `数量: ${imgCount}`);
  if (imgCount > 0) {
    await imgMenu.first().click({ delay: jitter(100, 300) });
    await delay(jitter(1500, 2500));
    check("导航到图像生成", page.url().includes("/image-gen"), page.url());
    await screenshot(page, "ai_image_gen");

    const imgInput = page.locator("textarea, input[type='text']:not([readonly])");
    if ((await imgInput.count()) > 0) {
      await imgInput.first().fill("一只在月球上跳舞的猫，数字艺术风格");
      await delay(jitter(400, 800));
      await screenshot(page, "ai_image_gen_prompt");
      const genBtn = page.locator("button:has-text('生成'), button:has-text('Generate')");
      if ((await genBtn.count()) > 0) {
        await genBtn.first().click();
        await delay(jitter(3000, 5000));
        await screenshot(page, "ai_image_gen_result");
      }
    } else {
      check("图像生成输入框存在", false, "ReImageGen 组件可能未正确加载");
    }
  }

  // ============================================================
  // 3. 侧边栏 -> 视频生成
  // ============================================================
  console.log("\n[3] 侧边栏 -> 视频生成");
  const videoMenu = page.locator(".app-sidebar__item:has-text('视频生成')");
  const videoCount = await videoMenu.count();
  check("侧边栏有'视频生成'菜单", videoCount > 0, `数量: ${videoCount}`);
  if (videoCount > 0) {
    await videoMenu.first().click({ delay: jitter(100, 300) });
    await delay(jitter(1500, 2500));
    check("导航到视频生成", page.url().includes("/video-gen"), page.url());
    await screenshot(page, "ai_video_gen");
  }

  // ============================================================
  // 4. 管理-提供商
  // ============================================================
  console.log("\n[4] 管理-提供商");
  const providerMenu = page.locator(".app-sidebar__item:has-text('提供商')");
  if ((await providerMenu.count()) > 0) {
    await providerMenu.first().click({ delay: jitter(100, 300) });
  } else {
    await page.goto(`${BASE}/#/model/providers`, { waitUntil: "networkidle", timeout: 15000 });
  }
  await delay(jitter(1500, 2500));
  check("进入提供商管理", page.url().includes("/model/providers"));
  await screenshot(page, "ai_manage_providers");

  const addBtn = page.locator("button:has-text('新建'), button:has-text('添加'), button:has-text('新增')");
  if ((await addBtn.count()) > 0) {
    await addBtn.first().click({ delay: jitter(100, 300) });
    await delay(jitter(1000, 1500));
    await screenshot(page, "ai_manage_providers_add");
    const cancelBtn = page.locator("button:has-text('取消'), button:has-text('Cancel')");
    if ((await cancelBtn.count()) > 0) await cancelBtn.first().click();
    await delay(jitter(500, 800));
  }

  // ============================================================
  // 5. 管理-模型
  // ============================================================
  console.log("\n[5] 管理-模型");
  const exactModelMenu = page.locator(".app-sidebar__item").filter({ hasText: /^模型$/ });
  if ((await exactModelMenu.count()) > 0) {
    await exactModelMenu.first().click({ delay: jitter(100, 300) });
  } else {
    await page.goto(`${BASE}/#/model/models`, { waitUntil: "networkidle", timeout: 15000 });
  }
  await delay(jitter(1500, 2500));
  check("进入模型管理", page.url().includes("/model/models"));
  await screenshot(page, "ai_manage_models");

  // ============================================================
  // 6. 管理-分组
  // ============================================================
  console.log("\n[6] 管理-分组");
  const groupMenu = page.locator(".app-sidebar__item:has-text('分组')");
  if ((await groupMenu.count()) > 0) {
    await groupMenu.first().click({ delay: jitter(100, 300) });
  } else {
    await page.goto(`${BASE}/#/model/groups`, { waitUntil: "networkidle", timeout: 15000 });
  }
  await delay(jitter(1500, 2500));
  check("进入分组管理", page.url().includes("/model/groups"));
  await screenshot(page, "ai_manage_groups");

  // ============================================================
  // 7. 管理-AppKey
  // ============================================================
  console.log("\n[7] 管理-AppKey");
  const appKeyMenu = page.locator(".app-sidebar__item:has-text('AppKey')");
  if ((await appKeyMenu.count()) > 0) {
    await appKeyMenu.first().click({ delay: jitter(100, 300) });
  } else {
    await page.goto(`${BASE}/#/model/app-keys`, { waitUntil: "networkidle", timeout: 15000 });
  }
  await delay(jitter(1500, 2500));
  check("进入 AppKey 管理", page.url().includes("/model/app-keys"));
  await screenshot(page, "ai_manage_appkeys");

  // ============================================================
  // 8. 管理-用量统计
  // ============================================================
  console.log("\n[8] 管理-用量统计");
  const usageMenu = page.locator(".app-sidebar__item:has-text('用量统计')");
  if ((await usageMenu.count()) > 0) {
    await usageMenu.first().click({ delay: jitter(100, 300) });
  } else {
    await page.goto(`${BASE}/#/model/usage`, { waitUntil: "networkidle", timeout: 15000 });
  }
  await delay(jitter(1500, 2500));
  check("进入用量统计", page.url().includes("/model/usage"));
  await screenshot(page, "ai_manage_usage");

  // ============================================================
  // 9. 管理-告警
  // ============================================================
  console.log("\n[9] 管理-告警");
  const alertMenu = page.locator(".app-sidebar__item:has-text('告警')");
  if ((await alertMenu.count()) > 0) {
    await alertMenu.first().click({ delay: jitter(100, 300) });
  } else {
    await page.goto(`${BASE}/#/model/alerts`, { waitUntil: "networkidle", timeout: 15000 });
  }
  await delay(jitter(1500, 2500));
  check("进入告警管理", page.url().includes("/model/alerts"));
  await screenshot(page, "ai_manage_alerts");

  // ============================================================
  // 10. 管理-服务
  // ============================================================
  console.log("\n[10] 管理-服务");
  const serviceMenu = page.locator(".app-sidebar__item:has-text('服务')");
  if ((await serviceMenu.count()) > 0) {
    await serviceMenu.first().click({ delay: jitter(100, 300) });
  } else {
    await page.goto(`${BASE}/#/model/services`, { waitUntil: "networkidle", timeout: 15000 });
  }
  await delay(jitter(1500, 2500));
  check("进入服务管理", page.url().includes("/model/services"));
  await screenshot(page, "ai_manage_services");

  // ============================================================
  // 11. 管理-全局配置
  // ============================================================
  console.log("\n[11] 管理-全局配置");
  const globalMenu = page.locator(".app-sidebar__item:has-text('全局配置')");
  if ((await globalMenu.count()) > 0) {
    await globalMenu.first().click({ delay: jitter(100, 300) });
  } else {
    await page.goto(`${BASE}/#/model/global`, { waitUntil: "networkidle", timeout: 15000 });
  }
  await delay(jitter(1500, 2500));
  check("进入全局配置", page.url().includes("/model/global"));
  await screenshot(page, "ai_manage_global");

  // ============================================================
  // 12. 回到 Chat
  // ============================================================
  console.log("\n[12] 返回对话");
  const chatMenu = page.locator(".app-sidebar__item:has-text('对话')");
  if ((await chatMenu.count()) > 0) {
    await chatMenu.first().click({ delay: jitter(100, 300) });
    await delay(jitter(1000, 1500));
    check("回到 AI 对话", page.url().includes("/chat"), page.url());
    await screenshot(page, "ai_back_to_chat");
  }

  // ============================================================
  // 控制台错误
  // ============================================================
  console.log("\n=== 控制台错误 ===");
  const uniqueErrors = [...new Set(consoleErrors)];
  if (uniqueErrors.length === 0) {
    console.log("  无错误");
  } else {
    uniqueErrors.slice(0, 15).forEach((e) => console.log(`  ⚠ ${e.slice(0, 120)}`));
    console.log(`  共 ${uniqueErrors.length} 条唯一错误`);
  }

  console.log(`\n=== 结果: ${passed} passed, ${failed} failed, ${passed + failed} total ===`);
  console.log(`=== 截图目录: ${SCREEN_DIR} (${stepCount} 张) ===`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });