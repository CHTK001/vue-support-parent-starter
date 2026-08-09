/**
 * AI 系统真人模拟 E2E 测试
 *
 * 模拟真实用户操作流程：
 * 1. 打开浏览器 → AI 首页（对话页）
 * 2. 在对话页输入消息并发送
 * 3. 逐一点击侧边栏所有管理页面（提供商、模型、分组、AppKey、用量、告警、服务、全局配置）
 * 4. 每步截图记录
 *
 * 使用 Playwright + Chromium，headless 模式运行
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/** 截图输出目录 */
const SCREENSHOT_DIR = path.resolve('G:/work/test-shots/ai-e2e');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/** 前端地址 */
const BASE_URL = 'http://localhost:8088';

/** 截图计数器 */
let shotIndex = 0;

/** 截图并打印日志 */
async function shot(page, name) {
  shotIndex++;
  const filename = `${String(shotIndex).padStart(3, '0')}_${name}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
  console.log(`[截图] ${shotIndex}. ${name} -> ${filename}`);
}

/** 等待网络空闲 */
async function waitStable(page, ms = 2000) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

(async () => {
  console.log('='.repeat(60));
  console.log('AI 系统真人模拟 E2E 测试开始');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    // ============================================================
    // 1. 打开首页 → 应自动重定向到 /chat
    // ============================================================
    console.log('\n[步骤 1] 打开 AI 首页');
    await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await waitStable(page, 3000);
    await shot(page, '01_ai_home_initial');

    // 检查当前路由
    const currentUrl = page.url();
    console.log(`  当前 URL: ${currentUrl}`);

    // ============================================================
    // 2. 对话页 — 输入消息并发送
    // ============================================================
    console.log('\n[步骤 2] 对话测试');

    // 查找聊天输入框（ReChat 组件通常有 textarea 或 input）
    const chatInput = await page.$('textarea, [contenteditable="true"], .re-chat__input textarea');
    if (chatInput) {
      const testMessage = '你好，请用中文回复';
      await chatInput.fill(testMessage);
      console.log(`  输入消息: "${testMessage}"`);
      await shot(page, '02_ai_chat_input');

      // 查找发送按钮并点击
      const sendBtn = await page.$('button:has-text("发送"), .el-button:has-text("发送"), [aria-label="发送"]');
      if (sendBtn) {
        await sendBtn.click();
        console.log('  已点击发送按钮');
        await waitStable(page, 5000);
        await shot(page, '03_ai_chat_response');
      } else {
        // 尝试按 Enter 发送
        await chatInput.press('Enter');
        console.log('  已按 Enter 发送');
        await waitStable(page, 5000);
        await shot(page, '03_ai_chat_enter_send');
      }
    } else {
      console.log('  [跳过] 未找到聊天输入框');
      await shot(page, '02_ai_chat_no_input');
    }

    // ============================================================
    // 3. 导航到各管理页面
    // ============================================================
    const managePages = [
      { path: '/model/providers', name: '提供商管理', file: '04_manage_providers' },
      { path: '/model/models',    name: '模型管理',    file: '05_manage_models' },
      { path: '/model/groups',    name: '分组管理',    file: '06_manage_groups' },
      { path: '/model/app-keys',  name: 'AppKey 管理', file: '07_manage_appkeys' },
      { path: '/model/usage',     name: '用量统计',    file: '08_manage_usage' },
      { path: '/model/alerts',    name: '告警管理',    file: '09_manage_alerts' },
      { path: '/model/services',  name: '服务管理',    file: '10_manage_services' },
      { path: '/model/global',    name: '全局配置',    file: '11_manage_global' },
    ];

    for (const mp of managePages) {
      console.log(`\n[步骤] 导航到 ${mp.name}`);
      await page.goto(`${BASE_URL}/#${mp.path}`, { timeout: 15000, waitUntil: 'domcontentloaded' });
      await waitStable(page, 3000);
      await shot(page, mp.file);
      console.log(`  ${mp.name} 页面已截图`);
    }

    // ============================================================
    // 4. 测试侧边栏导航点击（模拟真人点击）
    // ============================================================
    console.log('\n[步骤 3] 测试侧边栏导航点击');

    // 先回到首页
    await page.goto(`${BASE_URL}/#/chat`, { timeout: 15000, waitUntil: 'domcontentloaded' });
    await waitStable(page, 2000);

    // 点击侧边栏 "提供商" 链接
    const providerLink = await page.$('a[href="#/model/providers"], .app-sidebar__item:has-text("提供商")');
    if (providerLink) {
      await providerLink.click();
      console.log('  点击了 "提供商" 导航链接');
      await waitStable(page, 3000);
      await shot(page, '12_sidebar_click_providers');
    } else {
      console.log('  [跳过] 未找到提供商导航链接');
      await shot(page, '12_sidebar_no_providers_link');
    }

    // 再点击 "全局配置" 链接
    const globalLink = await page.$('a[href="#/model/global"], .app-sidebar__item:has-text("全局配置")');
    if (globalLink) {
      await globalLink.click();
      console.log('  点击了 "全局配置" 导航链接');
      await waitStable(page, 3000);
      await shot(page, '13_sidebar_click_global');
    } else {
      console.log('  [跳过] 未找到全局配置导航链接');
    }

    // ============================================================
    // 5. 测试折叠侧边栏
    // ============================================================
    console.log('\n[步骤 4] 测试侧边栏折叠');
    const toggleBtn = await page.$('.app-sidebar__toggle');
    if (toggleBtn) {
      await toggleBtn.click();
      console.log('  点击了折叠按钮');
      await waitStable(page, 1000);
      await shot(page, '14_sidebar_collapsed');

      // 再展开
      await toggleBtn.click();
      console.log('  再次点击展开');
      await waitStable(page, 1000);
      await shot(page, '15_sidebar_expanded');
    } else {
      console.log('  [跳过] 未找到折叠按钮');
    }

    // ============================================================
    // 6. 浏览器控制台日志（检查有无前端错误）
    // ============================================================
    console.log('\n[步骤 5] 收集控制台日志');
    const consoleLogs = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // 重新加载收集所有日志
    await page.goto(`${BASE_URL}/#/chat`, { timeout: 15000, waitUntil: 'domcontentloaded' });
    await waitStable(page, 3000);

    if (consoleLogs.length > 0) {
      console.log('  发现控制台错误:');
      consoleLogs.forEach((log) => console.log(`    ${log}`));
    } else {
      console.log('  控制台无错误日志');
    }

    // ============================================================
    // 完成
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log(`测试完成，共 ${shotIndex} 张截图`);
    console.log(`截图目录: ${SCREENSHOT_DIR}`);
    console.log('='.repeat(60));

  } catch (e) {
    console.error('\n[测试失败]', e.message);
    await shot(page, '99_error_state').catch(() => {});
  } finally {
    await browser.close();
  }
})();