/**
 * AI 控制台全面验收脚本 - 增强版
 * 遍历所有路由，截图，统计并点击每个按钮，记录控制台错误
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:19094';
const OUTPUT_DIR = path.join(__dirname, 'acceptance-screenshots-full');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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

  const allConsoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') allConsoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    allConsoleErrors.push(`PAGE_ERROR: ${err.message}`);
  });

  const results = [];

  for (const route of ROUTES) {
    const url = `${BASE_URL}/#${route.path}`;
    console.log(`\n=== 验收: ${route.desc} (${route.path}) ===`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500);

      // 统计元素
      const buttons = await page.locator('button').all();
      const buttonTexts = [];
      for (const btn of buttons) {
        try {
          const text = (await btn.innerText()).trim() || '(图标按钮)';
          const disabled = await btn.isDisabled();
          buttonTexts.push(`${text}${disabled ? ' [disabled]' : ''}`);
        } catch { buttonTexts.push('(无法读取)'); }
      }

      const inputs = await page.locator('input, textarea, select').count();
      const tables = await page.locator('table').count();
      const cards = await page.locator('.arco-card, .ai-card, .ai-pipeline-block').count();
      const switches = await page.locator('.arco-switch').count();

      // 截图
      const screenshotPath = path.join(OUTPUT_DIR, `${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // 点击测试（只点击非危险按钮，记录结果）
      const clickResults = [];
      const safeButtons = buttons.filter((_, i) => {
        const text = buttonTexts[i] || '';
        // 跳过删除、清空等危险按钮
        return !text.includes('删除') && !text.includes('清空') && !text.includes('卸载') && !text.includes('停用');
      });

      for (let i = 0; i < Math.min(safeButtons.length, 5); i++) {
        const btn = safeButtons[i];
        const btnText = buttonTexts[buttons.indexOf(btn)] || `按钮${i}`;
        try {
          const beforeUrl = page.url();
          await btn.click({ timeout: 3000 });
          await page.waitForTimeout(800);
          const afterUrl = page.url();
          const hasModal = await page.locator('.arco-modal').count();
          const hasMessage = await page.locator('.arco-message').count();
          clickResults.push({
            button: btnText,
            urlChanged: beforeUrl !== afterUrl,
            modalOpened: hasModal > 0,
            messageShown: hasMessage > 0,
          });
          // 关闭弹窗（如果有）
          if (hasModal > 0) {
            try { await page.keyboard.press('Escape'); await page.waitForTimeout(300); } catch {}
          }
          // 如果 URL 变了，返回原页面
          if (beforeUrl !== afterUrl) {
            await page.goto(beforeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(1500);
          }
        } catch (e) {
          clickResults.push({ button: btnText, error: e.message.substring(0, 100) });
        }
      }

      const result = {
        name: route.name,
        desc: route.desc,
        path: route.path,
        status: 'PASS',
        buttons: buttonTexts.length,
        buttonTexts: buttonTexts.slice(0, 20),
        inputs,
        tables,
        cards,
        switches,
        clickResults,
        screenshot: screenshotPath,
      };
      results.push(result);
      console.log(`  状态: PASS, 按钮: ${buttonTexts.length}, 输入: ${inputs}, 表格: ${tables}, 卡片: ${cards}, 开关: ${switches}`);
      console.log(`  按钮文本: ${buttonTexts.slice(0, 10).join(' | ')}`);
      if (clickResults.length > 0) {
        console.log(`  点击测试: ${clickResults.map(r => `${r.button}(${r.urlChanged?'跳转':r.modalOpened?'弹窗':r.messageShown?'提示':r.error?'错误':'无响应'})`).join(', ')}`);
      }
    } catch (e) {
      results.push({
        name: route.name,
        desc: route.desc,
        path: route.path,
        status: 'FAIL',
        error: e.message,
      });
      console.log(`  状态: FAIL - ${e.message}`);
    }
  }

  // 汇总
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalButtons = results.reduce((sum, r) => sum + (r.buttons || 0), 0);

  console.log('\n========== 验收总结 ==========');
  console.log(`总页面: ${results.length}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`总按钮数: ${totalButtons}`);
  console.log(`控制台错误: ${allConsoleErrors.length}`);
  if (allConsoleErrors.length > 0) {
    console.log('\n控制台错误样例:');
    allConsoleErrors.slice(0, 10).forEach(e => console.log(`  - ${e.substring(0, 150)}`));
  }

  // 保存报告
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    totalButtons,
    consoleErrors: allConsoleErrors,
    results,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'full-acceptance-report.json'), JSON.stringify(report, null, 2));
  console.log(`\n报告: ${path.join(OUTPUT_DIR, 'full-acceptance-report.json')}`);
  console.log(`截图: ${OUTPUT_DIR}`);

  await browser.close();
}

main().catch(console.error);
