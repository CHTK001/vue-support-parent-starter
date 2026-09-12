/**
 * AI 控制台全面验收脚本
 * 遍历所有路由，截图并检查每个页面的按钮/交互元素
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:19094';
const OUTPUT_DIR = path.join(__dirname, 'acceptance-screenshots');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 所有需要验收的路由
const ROUTES = [
  { path: '/bots/users', name: '01-bot-management', desc: 'Bot 管理' },
  { path: '/bots/im', name: '02-bot-im', desc: 'Bot 会话' },
  { path: '/models', name: '03-model-management', desc: '模型管理' },
  { path: '/agents', name: '04-agent-management', desc: 'Agent 管理' },
  { path: '/services', name: '05-service-management', desc: '服务管理' },
  { path: '/capabilities/text-to-image', name: '06-cap-text-to-image', desc: '文生图管线' },
  { path: '/capabilities/text-to-video', name: '07-cap-text-to-video', desc: '文生视频管线' },
  { path: '/capabilities/ocr', name: '08-cap-ocr', desc: 'OCR 管线' },
  { path: '/capabilities/layout', name: '09-cap-layout', desc: '布局管线' },
  { path: '/capabilities/face', name: '10-cap-face', desc: '人脸识别管线' },
  { path: '/capabilities/image', name: '11-cap-image', desc: '图片识别管线' },
  { path: '/usage', name: '12-usage-management', desc: '用量管理' },
  { path: '/usage/sync-logs', name: '13-usage-sync-logs', desc: '用量同步日志' },
  { path: '/settings', name: '14-system-settings', desc: '系统设置' },
  { path: '/settings/global-beans', name: '15-global-beans', desc: '全局 Bean 配置' },
  { path: '/settings/usage-config', name: '16-usage-config', desc: '用量配置' },
  { path: '/settings/skills-config', name: '17-skills-config', desc: 'Skills 配置' },
  { path: '/skills', name: '18-skills-management', desc: 'Skills 管理' },
  { path: '/roles', name: '19-roles-management', desc: '角色管理' },
  { path: '/mcp', name: '20-mcp-management', desc: 'MCP 管理' },
  { path: '/plugins', name: '21-plugins-management', desc: '插件管理' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
  });
  const page = await context.newPage();

  // 收集控制台错误
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`PAGE_ERROR: ${err.message}`);
  });

  const results = [];

  for (const route of ROUTES) {
    const url = `${BASE_URL}/#${route.path}`;
    console.log(`\n=== 验收: ${route.desc} (${route.path}) ===`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000); // 等待动态渲染（后端不可达时请求会超时，不影响UI渲染）

      // 检查侧边栏是否渲染
      const sidebarExists = await page.locator('.ai-sidebar').count();
      const mainContentExists = await page.locator('.ai-console-main').count();

      // 统计按钮
      const buttons = await page.locator('button, .arco-btn, [role="button"]').all();
      const buttonTexts = [];
      for (const btn of buttons.slice(0, 30)) {
        try {
          const text = (await btn.innerText()).trim();
          if (text) buttonTexts.push(text);
        } catch {}
      }

      // 统计输入框
      const inputs = await page.locator('input, textarea, .arco-input').count();

      // 统计下拉框
      const selects = await page.locator('.arco-select').count();

      // 统计表格
      const tables = await page.locator('table, .arco-table').count();

      // 统计卡片
      const cards = await page.locator('.ai-card, .arco-card').count();

      // 截图
      const screenshotPath = path.join(OUTPUT_DIR, `${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // 检查是否有明显的错误提示
      const errorTexts = await page.locator('.arco-message-error, .error, [class*="error"]').allInnerTexts();

      const result = {
        route: route.path,
        name: route.desc,
        sidebar: sidebarExists > 0,
        mainContent: mainContentExists > 0,
        buttons: buttons.length,
        buttonTexts: buttonTexts.slice(0, 20),
        inputs,
        selects,
        tables,
        cards,
        errors: errorTexts.slice(0, 5),
        screenshot: screenshotPath,
        status: 'PASS',
      };

      if (!sidebarExists || !mainContentExists) {
        result.status = 'FAIL';
        result.failReason = '布局未渲染';
      }

      results.push(result);
      console.log(`  状态: ${result.status}`);
      console.log(`  按钮: ${buttons.length}, 输入框: ${inputs}, 下拉: ${selects}, 表格: ${tables}, 卡片: ${cards}`);
      console.log(`  按钮文本: ${buttonTexts.slice(0, 10).join(' | ')}`);
    } catch (err) {
      results.push({
        route: route.path,
        name: route.desc,
        status: 'ERROR',
        error: err.message,
      });
      console.log(`  错误: ${err.message}`);
    }
  }

  // 输出验收报告
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed: results.filter((r) => r.status === 'PASS').length,
    failed: results.filter((r) => r.status === 'FAIL').length,
    errors: results.filter((r) => r.status === 'ERROR').length,
    consoleErrors: consoleErrors.slice(0, 20),
    results,
  };

  const reportPath = path.join(OUTPUT_DIR, 'acceptance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n\n========== 验收总结 ==========');
  console.log(`总页面: ${report.total}`);
  console.log(`通过: ${report.passed}`);
  console.log(`失败: ${report.failed}`);
  console.log(`错误: ${report.errors}`);
  console.log(`控制台错误: ${consoleErrors.length}`);
  console.log(`报告: ${reportPath}`);
  console.log(`截图: ${OUTPUT_DIR}`);

  if (consoleErrors.length > 0) {
    console.log('\n控制台错误样例:');
    consoleErrors.slice(0, 10).forEach((e) => console.log(`  - ${e}`));
  }

  await browser.close();
}

main().catch(console.error);
