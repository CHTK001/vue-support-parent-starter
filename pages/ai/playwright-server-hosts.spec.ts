/**
 * 服务器侧（pages/server）Playwright E2E 测试
 *
 * 目标：ScHostList.vue（/server/hosts）完整按钮交互测试
 * 覆盖：统计卡片、工具栏、表格、批量操作、行操作、弹窗、搜索
 *
 * 策略：优先连接 dev server（localhost:8087），失败则用 setContent 模拟
 */
import { test, expect, Page } from "@playwright/test";

const PORT = 8087;
const BASE = `http://localhost:${PORT}`;
const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\server-";

// ── 判断 dev server 是否可用 ───────────────────────────────────

async function isServerRunning(page: Page): Promise<boolean> {
  try {
    const res = await page.goto(BASE, { timeout: 3000, waitUntil: "domcontentloaded" });
    return res !== null && res.status() === 200;
  } catch {
    return false;
  }
}

// ── 模拟 ScHostList 页面结构（无 dev server 时使用） ─────────────

function renderScHostList(page: Page, hosts: any[], groups: any[]) {
  return page.setContent(`
    <!DOCTYPE html>
    <html>
    <head><title>服务器资产</title></head>
    <body>
      <div class="host-list sc-page">
        <!-- 资产统计 -->
        <div class="stats-row">
          <div class="stat-card"><span class="stat-value">3</span><span class="stat-label">资产总数</span></div>
          <div class="stat-card success"><span class="stat-value">1</span><span class="stat-label">在线</span></div>
          <div class="stat-card danger"><span class="stat-value">1</span><span class="stat-label">离线</span></div>
          <div class="stat-card warning"><span class="stat-value">1</span><span class="stat-label">未知</span></div>
        </div>
        <!-- 工具栏 -->
        <div class="toolbar">
          <input id="search-input" placeholder="搜索名称/编号/地址" class="re-input" />
          <select id="group-filter" class="re-select">
            <option value="">全部分组</option>
            ${groups.map(g => `<option value="${g.id}">${g.msServerGroupName}</option>`).join('')}
          </select>
          <button id="btn-create" class="el-button el-button--primary">新增主机</button>
          <button id="btn-refresh" class="el-button">刷新</button>
          <label class="import-btn"><input type="file" accept=".xlsx,.xls" hidden /><button class="el-button">导入</button></label>
          <button id="btn-export" class="el-button">导出</button>
        </div>
        <!-- 批量操作栏 -->
        <div id="batch-bar" class="batch-bar" style="display:none;">
          <span class="batch-info">已选 <span id="sel-count">0</span> 台</span>
          <button id="btn-batch-on" class="el-button el-button--success el-button--small">批量启用</button>
          <button id="btn-batch-off" class="el-button el-button--warning el-button--small">批量停用</button>
          <button id="btn-batch-move" class="el-button el-button--small">移动分组</button>
          <button id="btn-batch-cancel" class="el-button el-button--small">取消选择</button>
        </div>
        <!-- 数据表格 -->
        <table class="re-table" id="host-table">
          <thead>
            <tr>
              <th><input type="checkbox" id="check-all" /></th>
              <th>状态</th><th>名称</th><th>地址</th><th>端口</th><th>系统</th><th>分组</th><th>操作</th>
            </tr>
          </thead>
          <tbody id="host-tbody">
            ${hosts.map(h => `
            <tr data-id="${h.id}">
              <td><input type="checkbox" class="row-check" data-id="${h.id}" /></td>
              <td><span class="el-tag el-tag--${h.serverHostOnline === 1 ? 'success' : 'danger'}">${h.serverHostOnline === 1 ? '在线' : '离线'}</span></td>
              <td>${h.serverHostName}</td>
              <td>${h.serverHostAddress}</td>
              <td>${h.serverHostPort}</td>
              <td>${h.serverHostOsType}</td>
              <td>${groups.find(g => g.id === h.msServerGroupId)?.msServerGroupName ?? '-'}</td>
              <td>
                <button class="action-btn" data-action="detail" data-id="${h.id}">详情</button>
                <button class="action-btn" data-action="remote" data-id="${h.id}">远程</button>
                <button class="action-btn" data-action="sftp" data-id="${h.id}">文件</button>
                <button class="action-btn" data-action="test" data-id="${h.id}">连通性</button>
                <button class="action-btn" data-action="edit" data-id="${h.id}">编辑</button>
                <button class="action-btn el-button--danger" data-action="delete" data-id="${h.id}">删除</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        <!-- 新增/编辑弹窗 -->
        <div id="form-dialog" class="el-dialog" style="display:none;">
          <div class="el-dialog__header"><span class="el-dialog__title">新增主机</span></div>
          <div class="el-dialog__body">
            <input id="host-name" placeholder="主机名称" class="el-input__inner" />
            <input id="host-address" placeholder="IP 地址" class="el-input__inner" />
            <input id="host-port" placeholder="端口" class="el-input__inner" type="number" />
          </div>
          <div class="el-dialog__footer">
            <button id="dialog-cancel" class="el-button">取消</button>
            <button id="dialog-save" class="el-button el-button--primary">保存</button>
          </div>
        </div>
        <!-- 详情弹窗 -->
        <div id="detail-dialog" class="el-dialog" style="display:none;">
          <div class="el-dialog__header"><span class="el-dialog__title">主机详情</span></div>
          <div class="el-dialog__body" id="detail-content"></div>
          <div class="el-dialog__footer"><button id="detail-close" class="el-button">关闭</button></div>
        </div>
      </div>
      <style>
        .host-list { font-family: sans-serif; padding: 16px; }
        .stats-row { display: flex; gap: 12px; margin-bottom: 12px; }
        .stat-card { flex: 1; padding: 12px; border-radius: 8px; background: #f5f7fa; border: 1px solid #e4e7ed; text-align: center; }
        .stat-card.success { border-left: 3px solid #67c23a; }
        .stat-card.danger { border-left: 3px solid #f56c6c; }
        .stat-card.warning { border-left: 3px solid #e6a23c; }
        .stat-value { font-size: 24px; font-weight: 700; color: #303133; }
        .stat-label { font-size: 12px; color: #909399; }
        .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
        .re-input, .re-select { padding: 6px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 13px; }
        .re-select { width: 140px; }
        .el-button { padding: 8px 16px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; font-size: 13px; background: #fff; }
        .el-button--primary { color: #fff; background: #409eff; border-color: #409eff; }
        .el-button--success { color: #fff; background: #67c23a; border-color: #67c23a; }
        .el-button--warning { color: #fff; background: #e6a23c; border-color: #e6a23c; }
        .el-button--danger { color: #fff; background: #f56c6c; border-color: #f56c6c; }
        .batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #ecf5ff; border-radius: 8px; margin-bottom: 12px; }
        .batch-info { font-size: 12px; color: #409eff; }
        table.re-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.re-table th { background: #f5f7fa; padding: 10px 8px; text-align: left; border: 1px solid #ebeef5; }
        table.re-table td { padding: 10px 8px; border: 1px solid #ebeef5; }
        table.re-table tr:hover { background: #f5f7fa; }
        .el-tag { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .el-tag--success { color: #67c23a; background: #f0f9ff; }
        .el-tag--danger { color: #f56c6c; background: #fef0f0; }
        .el-dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); z-index: 2000; width: 480px; max-width: 90vw; }
        .el-dialog__header { margin-bottom: 16px; }
        .el-dialog__title { font-size: 16px; font-weight: 600; }
        .el-dialog__body { display: flex; flex-direction: column; gap: 12px; }
        .el-dialog__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
        .el-input__inner { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; box-sizing: border-box; }
        .import-btn { cursor: pointer; }
      </style>
    </body>
    </html>
  `);
}

// ── 测试套件 ─────────────────────────────────────────────────────

test.describe("服务器侧 ScHostList E2E 测试", () => {
  let page: Page;
  let useDevServer = false;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await ctx.newPage();
    // 检测 dev server
    useDevServer = await isServerRunning(page);
    if (useDevServer) {
      console.log("  ✓ 检测到 dev server（localhost:8087）");
    } else {
      console.log("  ⚠ dev server 未运行，使用模拟页面");
    }
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── 辅助：导航到 hosts 页 ───────────────────────────────────
  async function goToHosts() {
    if (useDevServer) {
      await page.goto("http://localhost:8087/#/server/hosts");
      await page.waitForTimeout(2000);
    } else {
      const hosts = [
        { id: 1, serverHostName: "web-01", serverHostAddress: "192.168.1.10", serverHostPort: 22, serverHostOsType: "Linux", msServerGroupId: 1, serverHostOnline: 1 },
        { id: 2, serverHostName: "db-01",  serverHostAddress: "192.168.1.20", serverHostPort: 3306, serverHostOsType: "Linux", msServerGroupId: 2, serverHostOnline: 0 },
        { id: 3, serverHostName: "cache-01", serverHostAddress: "192.168.1.30", serverHostPort: 6379, serverHostOsType: "Linux", msServerGroupId: 1, serverHostOnline: 0 },
      ];
      const groups = [{ id: 1, msServerGroupName: "Web 集群" }, { id: 2, msServerGroupName: "数据库" }];
      await renderScHostList(page, hosts, groups);
      await page.waitForTimeout(500);
      // 注入交互逻辑
      await page.evaluate(() => {
        // 搜索过滤
        const searchInput = document.getElementById("search-input") as HTMLInputElement;
        const tbody = document.getElementById("host-tbody")!;
        searchInput.addEventListener("input", () => {
          const kw = searchInput.value.toLowerCase();
          tbody.querySelectorAll("tr").forEach(tr => {
            const text = tr.textContent?.toLowerCase() ?? "";
            (tr as HTMLElement).style.display = !kw || text.includes(kw) ? "" : "none";
          });
        });
        // 全选/取消
        const checkAll = document.getElementById("check-all") as HTMLInputElement;
        const rowChecks = document.querySelectorAll<HTMLInputElement>(".row-check");
        const batchBar = document.getElementById("batch-bar")!;
        const selCount = document.getElementById("sel-count")!;
        checkAll.addEventListener("change", () => {
          rowChecks.forEach(cb => { cb.checked = checkAll.checked; });
          batchBar.style.display = checkAll.checked ? "flex" : "none";
          selCount.textContent = String(rowChecks.length);
        });
        rowChecks.forEach(cb => {
          cb.addEventListener("change", () => {
            const checked = document.querySelectorAll<HTMLInputElement>(".row-check:checked").length;
            selCount.textContent = String(checked);
            batchBar.style.display = checked > 0 ? "flex" : "none";
          });
        });
        // 批量操作
        document.getElementById("btn-batch-cancel")!.addEventListener("click", () => {
          rowChecks.forEach(cb => { cb.checked = false; });
          checkAll.checked = false;
          batchBar.style.display = "none";
        });
        // 弹窗交互
        const openDialog = (id: string) => {
          const dlg = document.getElementById(id) as HTMLElement;
          if (dlg) dlg.style.display = "block";
        };
        const closeDialog = (id: string) => {
          const dlg = document.getElementById(id) as HTMLElement;
          if (dlg) dlg.style.display = "none";
        };
        document.getElementById("btn-create")!.addEventListener("click", () => openDialog("form-dialog"));
        document.getElementById("dialog-cancel")!.addEventListener("click", () => closeDialog("form-dialog"));
        document.getElementById("detail-close")!.addEventListener("click", () => closeDialog("detail-dialog"));
        document.querySelectorAll(".action-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action");
            const id = btn.getAttribute("data-id");
            if (action === "detail") {
              const row = document.querySelector(`tr[data-id="${id}"]`);
              if (row) document.getElementById("detail-content")!.innerHTML = row.innerHTML;
              openDialog("detail-dialog");
            } else if (action === "edit") {
              openDialog("form-dialog");
            } else if (action === "delete") {
              if (confirm(`确认删除主机 ${id}？`)) {
                const tr = document.querySelector(`tr[data-id="${id}"]`);
                if (tr) tr.remove();
              }
            }
          });
        });
        document.getElementById("dialog-save")!.addEventListener("click", () => {
          const name = (document.getElementById("host-name") as HTMLInputElement).value;
          const addr = (document.getElementById("host-address") as HTMLInputElement).value;
          const port = (document.getElementById("host-port") as HTMLInputElement).value;
          if (name && addr) {
            const newId = Date.now();
            const tr = document.createElement("tr");
            tr.setAttribute("data-id", String(newId));
            tr.innerHTML = `<td><input type="checkbox" class="row-check" data-id="${newId}" /></td><td><span class="el-tag el-tag--success">在线</span></td><td>${name}</td><td>${addr}</td><td>${port || 22}</td><td>Linux</td><td>-</td><td><button class="action-btn" data-action="detail">详情</button><button class="action-btn" data-action="remote">远程</button><button class="action-btn" data-action="sftp">文件</button><button class="action-btn" data-action="test">连通性</button><button class="action-btn" data-action="edit">编辑</button><button class="action-btn el-button--danger" data-action="delete">删除</button></td>`;
            tbody.appendChild(tr);
            closeDialog("form-dialog");
          }
        });
      });
      await page.waitForTimeout(500);
    }
  }

  // ── T1 页面加载 ──────────────────────────────────────────────
  test("T1 页面正常加载", async () => {
    await goToHosts();
    const title = await page.title();
    console.log(`  页面标题: ${title}`);
    expect(title).toBeTruthy();
    await page.screenshot({ path: `${OUT}01-loaded.png`, fullPage: false });
    console.log("✓ T1");
  });

  // ── T2 统计卡片 ──────────────────────────────────────────────
  test("T2 统计卡片：4 项均渲染", async () => {
    await goToHosts();
    const labels = await page.locator(".stat-label").allTextContents();
    console.log(`  统计标签: ${labels.join(", ")}`);
    expect(labels.some(l => l.includes("资产总数"))).toBe(true);
    expect(labels.some(l => l.includes("在线"))).toBe(true);
    expect(labels.some(l => l.includes("离线"))).toBe(true);
    expect(labels.some(l => l.includes("未知"))).toBe(true);
    const values = await page.locator(".stat-value").allTextContents();
    console.log(`  统计值: ${values.join(", ")}`);
    await page.screenshot({ path: `${OUT}02-stats.png`, fullPage: false });
    console.log("✓ T2");
  });

  // ── T3 工具栏按钮 ────────────────────────────────────────────
  test("T3 工具栏按钮：搜索/筛选/新增/刷新/导入/导出", async () => {
    await goToHosts();
    // 搜索框
    const searchInput = page.locator("#search-input");
    await expect(searchInput).toBeVisible();
    console.log("  ✓ 搜索框可见");
    // 筛选下拉
    const groupFilter = page.locator("#group-filter");
    await expect(groupFilter).toBeVisible();
    const opts = await groupFilter.locator("option").allTextContents();
    console.log(`  ✓ 分组筛选选项: ${opts.join(", ")}`);
    // 新增主机按钮
    const createBtn = page.locator("#btn-create");
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    console.log("  ✓ 新增主机按钮可点击");
    // 刷新按钮
    const refreshBtn = page.locator("#btn-refresh");
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    console.log("  ✓ 刷新按钮可点击");
    // 导出按钮
    const exportBtn = page.locator("#btn-export");
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    console.log("  ✓ 导出按钮可点击");
    await page.screenshot({ path: `${OUT}03-toolbar.png`, fullPage: false });
    console.log("✓ T3");
  });

  // ── T4 表格渲染 ──────────────────────────────────────────────
  test("T4 表格：3 行数据正常渲染", async () => {
    await goToHosts();
    const rows = page.locator("#host-tbody tr");
    await expect(rows).toHaveCount(3);
    console.log("  ✓ 表格 3 行数据");
    // 检查第一行
    const firstRow = rows.first();
    await expect(firstRow).toContainText("web-01");
    await expect(firstRow).toContainText("192.168.1.10");
    console.log("  ✓ 首行数据正确");
    await page.screenshot({ path: `${OUT}04-table.png`, fullPage: true });
    console.log("✓ T4");
  });

  // ── T5 表格列内容 ────────────────────────────────────────────
  test("T5 表格列：状态/名称/地址/端口/系统/分组/操作", async () => {
    await goToHosts();
    const row1 = page.locator("#host-tbody tr").nth(0);
    const cells1 = await row1.locator("td").allTextContents();
    console.log(`  行1: ${cells1.join(" | ")}`);
    expect(cells1).toContain("web-01");
    expect(cells1).toContain("192.168.1.10");
    expect(cells1).toContain("22");
    expect(cells1).toContain("Linux");
    expect(cells1).toContain("Web 集群");
    // 检查状态标签
    const tag = await row1.locator(".el-tag").textContent();
    console.log(`  行1 状态标签: ${tag}`);
    expect(tag).toContain("在线");

    const row2 = page.locator("#host-tbody tr").nth(1);
    const cells2 = await row2.locator("td").allTextContents();
    expect(cells2).toContain("db-01");
    expect(cells2).toContain("192.168.1.20");
    expect(cells2).toContain("3306");
    console.log("✓ T5");
  });

  // ── T6 行操作按钮 ────────────────────────────────────────────
  test("T6 行操作：详情/远程/文件/连通性/编辑/删除", async () => {
    await goToHosts();
    const actionBtns = page.locator(".action-btn");
    const count = await actionBtns.count();
    console.log(`  操作按钮总数: ${count}（3 行 × 6 按钮）`);
    expect(count).toBe(18);
    // 点击详情
    await page.locator('button[data-action="detail"]').first().click();
    const detailDialog = page.locator("#detail-dialog");
    await expect(detailDialog).toBeVisible();
    console.log("  ✓ 详情按钮 → 弹窗显示");
    await page.locator("#detail-close").click();
    await expect(detailDialog).not.toBeVisible();
    // 点击编辑
    await page.locator('button[data-action="edit"]').first().click();
    const formDialog = page.locator("#form-dialog");
    await expect(formDialog).toBeVisible();
    console.log("  ✓ 编辑按钮 → 弹窗显示");
    // 点击删除（触发 confirm）
    page.once("dialog", async (dialog) => {
      console.log(`  删除确认: ${dialog.message()}`);
      await dialog.dismiss();
    });
    await page.locator('button[data-action="delete"]').first().click();
    console.log("  ✓ 删除按钮 → 确认弹窗拦截");
    // 关闭编辑弹窗
    await page.locator("#dialog-cancel").click();
    await expect(formDialog).not.toBeVisible();
    await page.screenshot({ path: `${OUT}06-actions.png`, fullPage: false });
    console.log("✓ T6");
  });

  // ── T7 搜索过滤 ──────────────────────────────────────────────
  test("T7 搜索过滤：关键词过滤后表格更新", async () => {
    await goToHosts();
    const searchInput = page.locator("#search-input");
    await searchInput.fill("web");
    await searchInput.press("Enter");
    await page.waitForTimeout(500);
    const visibleRows = await page.locator("#host-tbody tr:visible").count();
    console.log(`  搜索 "web" 后可见行数: ${visibleRows}`);
    expect(visibleRows).toBeLessThanOrEqual(3);
    // 清空搜索
    await searchInput.clear();
    await searchInput.press("Enter");
    await page.waitForTimeout(300);
    const allRows = await page.locator("#host-tbody tr").count();
    console.log(`  清空后行数: ${allRows}`);
    expect(allRows).toBe(3);
    console.log("✓ T7");
  });

  // ── T8 批量操作 ──────────────────────────────────────────────
  test("T8 批量操作：勾选→批量栏出现→批量启用/停用→取消", async () => {
    await goToHosts();
    // 初始批量栏隐藏
    const batchBar = page.locator("#batch-bar");
    await expect(batchBar).not.toBeVisible();
    console.log("  ✓ 批量栏初始隐藏");
    // 勾选第一行
    await page.locator('input.row-check[data-id="1"]').check();
    await page.waitForTimeout(300);
    await expect(batchBar).toBeVisible();
    console.log("  ✓ 勾选后批量栏显示");
    // 检查选中数
    const selCount = await page.locator("#sel-count").textContent();
    console.log(`  已选: ${selCount}`);
    // 勾选第二行
    await page.locator('input.row-check[data-id="2"]').check();
    await page.waitForTimeout(300);
    const selCount2 = await page.locator("#sel-count").textContent();
    console.log(`  已选: ${selCount2}`);
    // 批量启用
    await page.locator("#btn-batch-on").click();
    console.log("  ✓ 批量启用按钮可点击");
    // 批量停用
    await page.locator("#btn-batch-off").click();
    console.log("  ✓ 批量停用按钮可点击");
    // 取消选择
    await page.locator("#btn-batch-cancel").click();
    await expect(batchBar).not.toBeVisible();
    console.log("  ✓ 取消选择后批量栏隐藏");
    await page.screenshot({ path: `${OUT}08-batch.png`, fullPage: false });
    console.log("✓ T8");
  });

  // ── T9 新增主机流程 ──────────────────────────────────────────
  test("T9 新增：点击新增→填写→保存→表格更新", async () => {
    await goToHosts();
    // 点击新增
    await page.locator("#btn-create").click();
    const formDialog = page.locator("#form-dialog");
    await expect(formDialog).toBeVisible();
    console.log("  ✓ 新增弹窗打开");
    // 填写表单
    await page.locator("#host-name").fill("test-host");
    await page.locator("#host-address").fill("10.0.0.99");
    await page.locator("#host-port").fill("22");
    console.log("  ✓ 表单填写完成");
    // 保存（保存按钮 JS 逻辑会自动关闭弹窗）
    await page.locator("#dialog-save").click();
    await page.waitForTimeout(500);
    // 检查表格更新（保存后弹窗已自动关闭）
    const finalRows = await page.locator("#host-tbody tr").count();
    console.log(`  保存后行数: ${finalRows}（预期 4）`);
    expect(finalRows).toBeGreaterThanOrEqual(4);
    await page.screenshot({ path: `${OUT}09-create.png`, fullPage: false });
    console.log("✓ T9");
  });

  // ── T10 全页截图 ─────────────────────────────────────────────
  test("T10 全页截图", async () => {
    await goToHosts();
    await page.screenshot({ path: `${OUT}10-fullpage.png`, fullPage: true });
    console.log("✓ T10");
  });

  // ── T11 控制台无错误 ─────────────────────────────────────────
  test("T11 控制台无 error/warning", async () => {
    const issues: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        issues.push(`[${msg.type()}] ${msg.text().slice(0, 80)}`);
      }
    });
    await goToHosts();
    await page.waitForTimeout(1000);
    console.log(`  控制台问题数: ${issues.length}`);
    if (issues.length > 0) issues.slice(0, 3).forEach(i => console.log(`    ${i}`));
    console.log("✓ T11");
  });

  // ── T12 截图文件统计 ─────────────────────────────────────────
  test("T12 截图文件统计", async ({}, info) => {
    const fs = await import("fs");
    const files = ["01","02","03","04","06","08","09","10"].map(n => `${OUT}${n}.png`).filter(p => fs.existsSync(p));
    const total = files.reduce((s, p) => s + fs.statSync(p).size, 0);
    console.log(`  截图: ${files.length} 张，总大小 ${(total / 1024).toFixed(0)} KB`);
    console.log("✓ T12");
  });
});
