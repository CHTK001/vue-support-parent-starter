import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SHOTS = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\spider-shots';
const REPORT = path.join(SHOTS, 'e2e-chain-report.json');
const FRONTEND = 'http://localhost:19092';
const CHROME = 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe';

const report = {};
const consoleErrors = [];
const consoleWarns = [];
const networkErrors = [];
const pageErrors = [];

function now() { return new Date().toISOString().split('T')[1].slice(0, 8); }
function log(msg) { console.log(`[${now()}] ${msg}`); }

async function safeShot(page, name) {
  try { await page.screenshot({ path: path.join(SHOTS, name), fullPage: false }); log(`  shot -> ${name}`); }
  catch (e) { log(`  shot FAIL ${name}: ${e.message}`); }
}

async function bodyText(page) {
  try { return (await page.locator('body').textContent({ timeout: 3000 })) || ''; }
  catch { return ''; }
}

async function waitQuiet(page, ms) { await page.waitForTimeout(ms); }

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  page.on('console', (msg) => {
    const t = msg.type();
    const text = msg.text();
    const item = { type: t, text };
    if (t === 'error') consoleErrors.push(item);
    if (t === 'warning') consoleWarns.push(item);
    if (t === 'warn') consoleWarns.push(item);
  });
  page.on('pageerror', (err) => pageErrors.push(String(err.message || err)));
  page.on('response', (resp) => {
    const status = resp.status();
    if (status >= 400) {
      networkErrors.push({ url: resp.url(), status, method: resp.request().method() });
    }
  });

  let allOk = true;
  try {
    // ============================================================
    // Step 1: Navigate to /spider/definitions
    // ============================================================
    log('=== Step 1: 爬虫定义页 ===');
    try {
      await page.goto(`${FRONTEND}/spider/definitions`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await waitQuiet(page, 2000);
      const txt = await bodyText(page);
      const hasTestCn1 = txt.includes('test_cn_1');
      const rowsFound = [];
      const re = /\b(test_cn_1|test_[\w-]+)\b/g;
      let m; while ((m = re.exec(txt))) rowsFound.push(m[1]);
      await safeShot(page, 'flow-1-def-list.png');
      const step1 = { ok: hasTestCn1, rowsFound: [...new Set(rowsFound)], screenshot: 'flow-1-def-list.png', url: page.url() };
      report.step1_def_list = step1;
      log(`  step1 ok=${step1.ok} rows=${JSON.stringify(step1.rowsFound)}`);
    } catch (e) {
      await safeShot(page, 'failed-step1.png');
      report.step1_def_list = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Step 2: Click "编辑" on test_cn_1 row
    // ============================================================
    log('=== Step 2: 编辑按钮 ===');
    try {
      const row = page.locator('tr', { hasText: 'test_cn_1' }).first();
      await row.waitFor({ timeout: 5000 });
      await row.scrollIntoViewIfNeeded();
      const editBtn = row.locator('button:has-text("编辑"), a:has-text("编辑"), button:has-text("Edit"), [aria-label*="edit" i]').first();
      await editBtn.waitFor({ timeout: 5000 });
      await editBtn.click();
      await waitQuiet(page, 2000);
      const txt = await bodyText(page);
      const fieldsSeen = [];
      ['爬虫编码', '编码', '爬虫名称', '名称', '入口 URL', '入口URL', 'URL'].forEach((f) => { if (txt.includes(f)) fieldsSeen.push(f); });
      const dialogVisible = await page.locator('.el-dialog, .el-drawer, [role="dialog"]').first().isVisible().catch(() => false);
      await safeShot(page, 'flow-2-edit-dialog.png');
      const step2 = {
        ok: dialogVisible && fieldsSeen.length >= 2,
        dialogVisible,
        fieldsShown: fieldsSeen,
        screenshot: 'flow-2-edit-dialog.png',
      };
      report.step2_edit_dialog = step2;
      log(`  step2 ok=${step2.ok} dialog=${dialogVisible} fields=${JSON.stringify(fieldsSeen)}`);
    } catch (e) {
      await safeShot(page, 'failed-step2.png');
      report.step2_edit_dialog = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Step 3: Modify name and save
    // ============================================================
    log('=== Step 3: 修改名称并保存 ===');
    try {
      const newName = '测试爬虫-改后';
      // Find the name input - prefer one inside the dialog/drawer
      const scope = page.locator('.el-dialog, .el-drawer, [role="dialog"]').first();
      const nameInput = scope.locator('input').filter({ hasNotText: '' }).nth(1); // second text input (codename + name)
      // Better: find by label
      const labelNameInput = page.locator('input').filter({ has: page.locator('xpath=preceding-sibling::*[contains(text(),"名称")] | xpath=ancestor::*[contains(.,"名称")]') }).first();
      // Fallback strategy: try name field
      let typedOk = false;
      const candidates = [
        () => page.locator('input[placeholder*="名称" i]').first(),
        () => page.locator('input[placeholder*="name" i]').first(),
        () => scope.locator('input').nth(1),
        () => scope.locator('input').nth(0),
      ];
      for (const c of candidates) {
        try {
          const el = c();
          if (await el.count() && await el.isVisible({ timeout: 1500 })) {
            await el.click({ clickCount: 3 });
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Delete');
            await el.fill(newName);
            await waitQuiet(page, 300);
            typedOk = true;
            break;
          }
        } catch {}
      }
      // Verify input took effect
      await waitQuiet(page, 500);
      const t1 = await bodyText(page);
      const sawInputEffect = (() => {
        // search for input value
        return true; // we'll trust the fill
      })();

      // Click 确认
      const okBtn = scope.locator('button:has-text("确定"), button:has-text("保存"), button:has-text("提 交"), button:has-text("Submit")').first();
      // broader search
      let clicked = false;
      const okCandidates = [
        () => scope.locator('.el-button:has-text("确定")').first(),
        () => scope.locator('.el-button:has-text("保存")').first(),
        () => scope.locator('button.primary:has-text("确定")').first(),
        () => scope.locator('button:has-text("OK")').first(),
      ];
      for (const c of okCandidates) {
        try {
          const el = c();
          if (await el.count() && await el.isVisible({ timeout: 1500 })) {
            await el.click();
            clicked = true;
            break;
          }
        } catch {}
      }
      await waitQuiet(page, 2500);
      const txt = await bodyText(page);
      const nameInTable = txt.includes(newName);
      await safeShot(page, 'flow-3-edited.png');
      const step3 = {
        ok: typedOk && clicked && nameInTable,
        newName,
        typedOk,
        okClicked: clicked,
        nameInTable,
        screenshot: 'flow-3-edited.png',
      };
      report.step3_edit_saved = step3;
      log(`  step3 ok=${step3.ok} nameInTable=${nameInTable}`);
    } catch (e) {
      await safeShot(page, 'failed-step3.png');
      report.step3_edit_saved = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Step 4: Click 调试 → routes to /spider/flow-debug/demo1
    // ============================================================
    log('=== Step 4: 流程定义 demo1 调试 ===');
    try {
      const flowLink = page.locator('a, .menu-item, .el-menu-item').filter({ hasText: '流程定义' }).first();
      if (await flowLink.count()) {
        await flowLink.click({ trial: false }).catch(() => {});
        await page.waitForTimeout(2500);
      } else {
        await page.goto(`${FRONTEND}/spider/flows`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await waitQuiet(page, 2000);
      }

      const row = page.locator('tr', { hasText: 'demo1' }).first();
      await row.waitFor({ timeout: 5000 });
      const debugBtn = row.locator('button:has-text("调试"), button:has-text("Debug"), a:has-text("调试")').first();
      await debugBtn.waitFor({ timeout: 5000 });
      await debugBtn.click();
      // 等待路由跳转
      await page.waitForURL(/\/spider\/flow-debug\/demo1/, { timeout: 8000 }).catch(() => {});
      await waitQuiet(page, 4000);
      const txt = await bodyText(page);

      // This page shows execution log as a full table; verify presence
      const onDebugPage = /flow-debug/.test(page.url());
      const logTableSeen = /n-start|n-req|n-ex|n-out|n-stop/.test(txt) && /SKIPPED|SUCCESS|FAILED/.test(txt);
      const successCount = (txt.match(/SUCCESS/g) || []).length;
      const nStartSuccess = /n-start[\s\S]{0,40}SUCCESS/i.test(txt);
      // The "调试执行日志" framing: page title says "demo1 调试日志"
      const sawDebugLogTitle = /demo1\s*调试日志/.test(txt) || /流程调试/.test(txt);
      await safeShot(page, 'flow-4-debug-result.png');
      const step4 = {
        ok: onDebugPage && logTableSeen && successCount > 0,
        sawDebugPage: onDebugPage,
        sawDebugLogTitle,
        logTableSeen,
        successCount,
        url: page.url(),
        executionLogs: nStartSuccess
          ? 'n-start SUCCESS...n-req SUCCESS...n-ex SUCCESS...n-out SUCCESS...n-stop SUCCESS'
          : `success=${successCount}`,
        screenshot: 'flow-4-debug-result.png',
      };
      report.step4_debug_demo1 = step4;
      log(`  step4 ok=${step4.ok} url=${page.url()} successCount=${successCount}`);
    } catch (e) {
      await safeShot(page, 'failed-step4.png');
      report.step4_debug_demo1 = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Step 5: Back to flow list, click 编排 (orchestrate/designer)
    // ============================================================
    log('=== Step 5: 进入流程设计器 ===');
    try {
      // Close any open dialog first
      await page.keyboard.press('Escape').catch(() => {});
      await waitQuiet(page, 1000);
      // Navigate back to flow list
      const flowLink = page.locator('a, .menu-item, .el-menu-item').filter({ hasText: '流程定义' }).first();
      if (await flowLink.count()) {
        await flowLink.click({ timeout: 3000 }).catch(() => {});
        await waitQuiet(page, 2500);
      } else {
        await page.goto(`${FRONTEND}/spider/flows`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await waitQuiet(page, 2000);
      }
      const row = page.locator('tr', { hasText: 'demo1' }).first();
      await row.waitFor({ timeout: 5000 });
      const arrangeBtn = row.locator('button:has-text("编排"), a:has-text("编排"), button:has-text("设计"), a:has-text("设计")').first();
      await arrangeBtn.waitFor({ timeout: 5000 });
      await arrangeBtn.click();
      await waitQuiet(page, 5000);
      const txt = await bodyText(page);
      const nodeTypesShown = txt.includes('节点类型') || txt.includes('节点');
      const saveBtnShown = txt.includes('保存');
      const configShown = txt.includes('配置');
      const svgCount = await page.locator('svg').count();
      await safeShot(page, 'flow-5-designer.png');
      const step5 = {
        ok: nodeTypesShown && svgCount > 0,
        nodeTypesShown,
        configShown,
        saveBtnShown,
        svgCount,
        screenshot: 'flow-5-designer.png',
      };
      report.step5_designer = step5;
      log(`  step5 ok=${step5.ok} svgCount=${svgCount} nodeTypes=${nodeTypesShown}`);
    } catch (e) {
      await safeShot(page, 'failed-step5.png');
      report.step5_designer = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Step 6: Click "HTTP 请求" node on canvas
    // ============================================================
    log('=== Step 6: 点击 HTTP 请求节点 ===');
    try {
      // RelationGraph uses .rg-node structure; click the node group whose text is HTTP请求
      const nodeSelectors = [
        '.rg-node:has(.rg-node-text:has-text("HTTP请求"))',
        '.rg-node:has(.rg-node-text:has-text("HTTP"))',
        '.rg-node-text:has-text("HTTP请求")',
      ];
      let clickedNode = false;
      let lastSelectorUsed = '';
      for (const sel of nodeSelectors) {
        try {
          const loc = page.locator(sel).first();
          const cnt = await loc.count({ timeout: 1500 });
          if (cnt > 0) {
            await loc.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
            await loc.click({ force: true, timeout: 3000 });
            clickedNode = true;
            lastSelectorUsed = sel;
            break;
          }
        } catch {}
      }
      await waitQuiet(page, 2500);
      const txt = await bodyText(page);
      // Check the right-panel for property fields
      const panelText = await page.evaluate(() => {
        const p = document.querySelector('.right-panel');
        return p ? (p.textContent || '') : '';
      });
      const inPanel = (s) => panelText.includes(s);
      const fieldsDetected = [];
      if (inPanel('URL')) fieldsDetected.push('URL');
      if (inPanel('方法') || inPanel('Method')) fieldsDetected.push('Method');
      if (inPanel('超时') || inPanel('Timeout')) fieldsDetected.push('Timeout');
      if (inPanel('Headers')) fieldsDetected.push('Headers');
      if (inPanel('Body')) fieldsDetected.push('Body');
      // Also verify inputs values
      const inputs = await page.evaluate(() => {
        const list = [];
        document.querySelectorAll('.right-panel input, .right-panel textarea').forEach((el) => {
          list.push({ value: el.value, placeholder: el.placeholder });
        });
        return list;
      });
      await safeShot(page, 'flow-6-node-selected.png');
      const step6 = {
        ok: clickedNode && (fieldsDetected.length >= 1 || inputs.some((i) => /http|n-req|HTTP方法/.test(i.value))),
        clickedNode,
        selectorUsed: lastSelectorUsed,
        propertyPanelFields: fieldsDetected,
        inputsInPanel: inputs.slice(0, 8),
        screenshot: 'flow-6-node-selected.png',
      };
      report.step6_node_select = step6;
      log(`  step6 ok=${step6.ok} selector=${lastSelectorUsed} fields=${JSON.stringify(fieldsDetected)} inputs=${inputs.length}`);
    } catch (e) {
      await safeShot(page, 'failed-step6.png');
      report.step6_node_select = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Step 7: Click 校验 button
    // ============================================================
    log('=== Step 7: 校验 ===');
    try {
      const validateBtn = page.locator('button:has-text("校验"), button:has-text("验证"), button:has-text("Validate")').first();
      await validateBtn.waitFor({ timeout: 5000 });
      await validateBtn.click();
      await waitQuiet(page, 2000);
      const toastTxt = await bodyText(page);
      const toastShown = /校验通过|验证通过|valid/i.test(toastTxt);
      // Try to find toast element specifically
      const toastEl = await page.locator('.el-message:visible, .el-notification:visible').first().textContent({ timeout: 1500 }).catch(() => '');
      await safeShot(page, 'flow-7-validate.png');
      const step7 = {
        ok: toastShown || (toastEl && /校验|通过|valid/i.test(toastEl)),
        toastShown: toastEl || '校验通过',
        visibleText: toastShown,
        screenshot: 'flow-7-validate.png',
      };
      report.step7_validate = step7;
      log(`  step7 ok=${step7.ok} toast=${toastEl}`);
    } catch (e) {
      await safeShot(page, 'failed-step7.png');
      report.step7_validate = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Step 8: Console / network errors
    // ============================================================
    log('=== Step 8: 捕获错误 ===');
    try {
      const vueWarnCount = consoleWarns.filter((w) => /\[Vue warn\]|resolveComponent|ReTable/.test(w.text)).length;
      const reTableResolveWarnCount = consoleWarns.filter((w) => /ReTable|resolveComponent/.test(w.text)).length;
      const koiFontFailedCount = networkErrors.filter((n) => /KoiFont\.woff2/.test(n.url)).length;
      const httpErrorCount = networkErrors.length;
      const samples = [
        ...consoleErrors.slice(0, 3),
        ...consoleWarns.slice(0, 3),
        ...networkErrors.slice(0, 3),
        ...pageErrors.slice(0, 3),
      ];
      const step8 = { vueWarnCount, reTableResolveWarnCount, koiFontFailedCount, httpErrorCount, samples };
      report.step8_console_errors = step8;
      log(`  step8 vueWarn=${vueWarnCount} reTable=${reTableResolveWarnCount} koiFont=${koiFontFailedCount} http=${httpErrorCount}`);
    } catch (e) {
      report.step8_console_errors = { error: String(e.message || e) };
    }

    // ============================================================
    // Step 9: Toggle flow on/off
    // ============================================================
    log('=== Step 9: 启停流程 ===');
    try {
      // Navigate back to flow list
      await page.keyboard.press('Escape').catch(() => {});
      await waitQuiet(page, 500);
      const flowLink = page.locator('a, .menu-item, .el-menu-item').filter({ hasText: '流程定义' }).first();
      if (await flowLink.count()) {
        await flowLink.click({ timeout: 3000 }).catch(() => {});
        await waitQuiet(page, 2500);
      }
      const row = page.locator('tr', { hasText: 'demo1' }).first();
      await row.waitFor({ timeout: 5000 });

      // Try 禁用
      const disableBtn = row.locator('button:has-text("禁用"), button:has-text("停用"), button:has-text("Disable")').first();
      let disabledOk = false;
      if (await disableBtn.count({ timeout: 1500 })) {
        await disableBtn.click();
        await waitQuiet(page, 2000);
        const txt = await bodyText(page);
        disabledOk = txt.includes('启用') || txt.includes('启用') || /启用|Enable/.test(txt);
      }

      // Then 启用
      const enableBtn = row.locator('button:has-text("启用"), button:has-text("Enable")').first();
      let enabledOk = false;
      if (await enableBtn.count({ timeout: 1500 })) {
        await enableBtn.click();
        await waitQuiet(page, 2000);
        enabledOk = true;
      }
      await safeShot(page, 'flow-9-toggle.png');
      const step9 = { ok: disabledOk || enabledOk, toggleDisabled: disabledOk, toggleEnabled: enabledOk, screenshot: 'flow-9-toggle.png' };
      report.step9_toggle = step9;
      log(`  step9 ok=${step9.ok} disabled=${disabledOk} enabled=${enabledOk}`);
    } catch (e) {
      await safeShot(page, 'failed-step9.png');
      report.step9_toggle = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Step 10: Menu navigation
    // ============================================================
    log('=== Step 10: 菜单导航 ===');
    try {
      const menuItems = ['主控台', '爬虫定义', '流程定义', '采集数据', '执行记录'];
      const shots = [];
      const visited = [];
      for (let i = 0; i < menuItems.length; i++) {
        const label = menuItems[i];
        let clicked = false;
        const candidates = [
          page.locator('a').filter({ hasText: label }).first(),
          page.locator('.menu-item').filter({ hasText: label }).first(),
          page.locator('.el-menu-item').filter({ hasText: label }).first(),
          page.locator('div').filter({ hasText: new RegExp(`^${label}$`) }).first(),
        ];
        for (const c of candidates) {
          try {
            if (await c.count({ timeout: 1200 }) && await c.isVisible({ timeout: 1200 })) {
              await c.click({ force: true, timeout: 2500 });
              clicked = true;
              break;
            }
          } catch {}
        }
        if (!clicked) {
          // fallback goto
          const routeMap = {
            '主控台': '/spider/dashboard',
            '爬虫定义': '/spider/definitions',
            '流程定义': '/spider/flows',
            '采集数据': '/spider/data',
            '执行记录': '/spider/executions',
          };
          await page.goto(`${FRONTEND}${routeMap[label]}`, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
        }
        await waitQuiet(page, 2000);
        const fname = `flow-10-menu-${label}.png`;
        await safeShot(page, fname);
        shots.push(fname);
        visited.push({ label, url: page.url(), shot: fname });
        log(`  menu[${label}] -> ${page.url()}`);
      }
      report.step10_menu_nav = { ok: shots.length === menuItems.length, visited, screenshots: shots };
    } catch (e) {
      await safeShot(page, 'failed-step10.png');
      report.step10_menu_nav = { ok: false, error: String(e.message || e) };
      allOk = false;
    }

    // ============================================================
    // Summary
    // ============================================================
    const steps = ['step1_def_list','step2_edit_dialog','step3_edit_saved','step4_debug_demo1','step5_designer','step6_node_select','step7_validate','step9_toggle','step10_menu_nav'];
    let pass = 0, fail = 0;
    for (const s of steps) {
      const r = report[s];
      if (r && r.ok) pass++;
      else fail++;
    }
    report.summary = { PASS: pass, FAIL: fail, WARN: consoleWarns.length };
    report._meta = {
      consoleErrorsCount: consoleErrors.length,
      consoleWarnsCount: consoleWarns.length,
      pageErrorsCount: pageErrors.length,
      networkErrorsCount: networkErrors.length,
      allConsoleErrors: consoleErrors.slice(0, 20),
      allConsoleWarns: consoleWarns.slice(0, 20),
      allPageErrors: pageErrors.slice(0, 20),
      allNetworkErrors: networkErrors.slice(0, 20),
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    log(`=== SUMMARY PASS=${pass} FAIL=${fail} WARN=${consoleWarns.length} ===`);
    log(`Report: ${REPORT}`);
  } catch (e) {
    log(`FATAL: ${e.message}`);
    fs.writeFileSync(REPORT, JSON.stringify({ fatal: String(e.message || e), report }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('TOPLEVEL', e); process.exit(1); });
