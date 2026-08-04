"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 验证 ReTable 操作列修复
const playwright_1 = require("playwright");
const node_fs_1 = require("node:fs");
const url = 'http://localhost:19092/spider/flow-list';
const shotPath = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots\\fix2-actions.png';
const reportPath = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots\\fix2-report.json';
const report = { ok: false, step: 'init' };
const browser = await playwright_1.chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
    headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(2500);
    // 抓表格 HTML
    const tableHTML = await page.locator('table').innerHTML();
    // 抓所有操作列单元格
    const cells = await page.locator('table tbody tr td:last-child').allInnerTexts();
    // 抓所有按钮文本
    const buttons = await page.locator('table tbody tr td:last-child button').allInnerTexts();
    // 文档 bodyText
    const bodyText = (await page.locator('body').innerText()).slice(0, 1500);
    report.tableHTMLLen = tableHTML.length;
    report.tableHTMLHead = tableHTML.slice(0, 500);
    report.cellTexts = cells;
    report.buttonTexts = buttons;
    report.bodyText = bodyText;
    report.screenshot = shotPath;
    await page.screenshot({ path: shotPath, fullPage: true });
    // 校验
    const hasMine = ['编排', '调试', '历史', '删除'].filter(t => buttons.some(b => b.includes(t)));
    report.foundButtons = hasMine;
    report.buttonCount = buttons.length;
    if (hasMine.length >= 3) {
        report.ok = true;
        report.step = 'PASS';
    }
    else {
        report.step = 'FAIL: buttons not rendered';
    }
    // 真实点击调试测试
    try {
        const debugBtn = page.getByRole('button', { name: '调试' }).first();
        if (await debugBtn.count() > 0) {
            await debugBtn.click();
            await page.waitForTimeout(6000);
            const dialogText = await page.locator('body').innerText();
            report.clickDebug = {
                clicked: true,
                hasExecutionLogsDialog: dialogText.includes('调试执行日志') || dialogText.includes('SUCCESS'),
                snippet: dialogText.slice(0, 800),
            };
            await page.screenshot({ path: 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots\\fix2-debug-clicked.png', fullPage: true });
        }
    }
    catch (e) {
        report.clickDebugError = String(e);
    }
}
catch (e) {
    report.error = String(e);
}
finally {
    (0, node_fs_1.writeFileSync)(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    await browser.close();
    console.log(`[fix2] ${report.step}, ok=${report.ok}, buttons=${report.buttonCount}`);
}
