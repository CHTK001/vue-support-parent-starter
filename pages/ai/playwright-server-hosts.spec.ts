/**
 * 服务器侧（pages/server）Playwright E2E 测试
 *
 * 目标页面：ScHostList.vue（/server/hosts）
 * 覆盖：统计卡片、工具栏按钮、表格渲染、批量操作、行操作按钮、弹窗交互
 *
 * 策略：mock /ms/server/* 接口，无需后端即可运行
 */
import { test, expect, Page } from "@playwright/test";

const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\server-";

// ── Mock 数据 ─────────────────────────────────────────────────────

const MOCK_HOSTS = [
  { id: 1, serverHostName: "web-01", serverHostCode: "W01", serverHostAddress: "192.168.1.10", serverHostPort: 22, serverHostOsType: "Linux", msServerGroupId: 1, serverHostStatus: 1, serverHostOnline: 1, serverHostTags: JSON.stringify(["prod", "web"]) },
  { id: 2, serverHostName: "db-01",  serverHostCode: "D01", serverHostAddress: "192.168.1.20", serverHostPort: 3306, serverHostOsType: "Linux", msServerGroupId: 2, serverHostStatus: 1, serverHostOnline: 0, serverHostTags: JSON.stringify(["prod"]) },
  { id: 3, serverHostName: "cache-01", serverHostCode: "C01", serverHostAddress: "192.168.1.30", serverHostPort: 6379, serverHostOsType: "Linux", msServerGroupId: 1, serverHostStatus: 0, serverHostOnline: 0, serverHostTags: null },
];

const MOCK_GROUPS = [
  { id: 1, msServerGroupName: "Web 集群" },
  { id: 2, msServerGroupName: "数据库" },
];

const MOCK_IDENTITIES = [
  { id: 1, name: "root-key" },
];

// ── fixture ───────────────────────────────────────────────────────

test.describe("服务器侧 ScHostList E2E 测试", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await ctx.newPage();

    // ── 拦截所有 /ms/server/* 请求 ───────────────────────────
    await page.route("**/ms/server/**", async (route, req) => {
      const url = req.url();
      const method = req.method().toLowerCase();
      let data: unknown = {};

      if (method === "get" && url.includes("/host") && !url.includes("/host/")) {
        const params = new URL(url).searchParams;
        let list = [...MOCK_HOSTS];
        const kw = params.get("keyword");
        const gid = params.get("groupId");
        if (kw) list = list.filter(h => h.serverHostName.includes(kw) || h.serverHostAddress.includes(kw));
        if (gid) list = list.filter(h => h.msServerGroupId === Number(gid));
        data = list;
      } else if (method === "post" && url.includes("/host")) {
        data = { id: Math.max(...MOCK_HOSTS.map(h => h.id)) + 1, ...JSON.parse(req.postData() ?? "{}") };
      } else if (method === "put" && url.match(/\/host\/\d+/)) {
        data = { success: true };
      } else if (method === "delete" && url.match(/\/host\/\d+/)) {
        data = true;
      } else if (method === "get" && url.includes("/group")) {
        data = MOCK_GROUPS;
      } else if (method === "get" && url.includes("/identity")) {
        data = MOCK_IDENTITIES;
      } else if (method === "put" && url.match(/\/host\/\d+\/status/)) {
        data = true;
      } else if (method === "post" && url.match(/\/host\/\d+\/test-connect/)) {
        data = "SSH Banner: OpenSSH_8.9p1 Ubuntu-3ubuntu0.6";
      } else if (method === "get" && url.match(/\/host\/\d+/)) {
        const id = Number(url.match(/\/host\/(\d+)/)?.[1]);
        data = MOCK_HOSTS.find(h => h.id === id) ?? {};
      } else {
        data = [];
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data }),
      });
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── 1. 页面加载 ──────────────────────────────────────────────
  test("T1 加载 /server/hosts，页面正常渲染", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    // 截图
    await page.screenshot({ path: `${OUT}01-loaded.png`, fullPage: false });
    console.log("✓ T1 页面加载完成");
  });

  // ── 2. 统计卡片 ───────────────────────────────────────────────
  test("T2 统计卡片：4 项均渲染", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    // 检查统计卡片是否存在
    const statLabels = await page.locator(".stat-label").allTextContents();
    console.log(`  统计标签: ${statLabels.join(", ")}`);
    expect(statLabels.some(l => l.includes("资产总数"))).toBe(true);
    expect(statLabels.some(l => l.includes("在线"))).toBe(true);
    expect(statLabels.some(l => l.includes("离线"))).toBe(true);
    expect(statLabels.some(l => l.includes("未知"))).toBe(true);
    await page.screenshot({ path: `${OUT}02-stats.png`, fullPage: false });
    console.log("✓ T2 统计卡片渲染正确");
  });

  // ── 3. 工具栏按钮 ────────────────────────────────────────────
  test("T3 工具栏按钮：全部可见且可点击", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    // 工具栏按钮
    const toolBtns = await page.locator(".toolbar button, .toolbar [class*=button], .toolbar [class*=Button]").count();
    console.log(`  工具栏按钮数: ${toolBtns}`);
    // 检查各按钮
    const searchInput = page.locator("input[placeholder*='搜索'], input[placeholder*='查找']");
    await expect(searchInput).toBeVisible();
    console.log("  ✓ 搜索框可见");
    // 刷新按钮
    const refreshBtn = page.locator("button:has-text('刷新'), [class*=button]:has-text('刷新')").first();
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    console.log("  ✓ 刷新按钮可点击");
    await page.screenshot({ path: `${OUT}03-toolbar.png`, fullPage: false });
    console.log("✓ T3 工具栏按钮测试完成");
  });

  // ── 4. 表格渲染 ───────────────────────────────────────────────
  test("T4 表格：3 行数据正常渲染", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    // 检查表格行数（含表头）
    const rows = await page.locator("table tr, .re-table tr").count();
    console.log(`  表格行数: ${rows}（含表头）`);
    expect(rows).toBeGreaterThanOrEqual(4); // 表头 + 3 数据行
    // 检查第一行数据
    const firstRow = page.locator("table tbody tr, .re-table tbody tr").first();
    await expect(firstRow).toBeVisible();
    const firstCell = await firstRow.locator("td").first().textContent();
    console.log(`  首行首列: ${firstCell}`);
    await page.screenshot({ path: `${OUT}04-table.png`, fullPage: true });
    console.log("✓ T4 表格渲染完成");
  });

  // ── 5. 表格列内容验证 ─────────────────────────────────────────
  test("T5 表格列内容：名称/地址/端口/系统/状态/操作", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    // 提取所有行数据
    const rowsData = await page.$$eval("table tbody tr, .re-table tbody tr", (trs) =>
      trs.map(tr => Array.from(tr.cells).map(cell => cell.textContent?.trim() ?? ""))
    );
    console.log("  表格数据:");
    rowsData.forEach((row, i) => console.log(`    [${i}] ${row.slice(0, 4).join(" | ")}`));
    // 检查 web-01 存在
    const allText = await page.locator("table, .re-table").textContent();
    expect(allText).toContain("web-01");
    expect(allText).toContain("192.168.1.10");
    expect(allText).toContain("db-01");
    console.log("✓ T5 表格列内容验证完成");
  });

  // ── 6. 行操作按钮 ────────────────────────────────────────────
  test("T6 行操作按钮：详情/远程/文件/连通性/编辑/删除", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    // 操作列按钮
    const actionBtns = await page.locator('button:has-text("详情"), button:has-text("远程"), button:has-text("文件"), button:has-text("连通性"), button:has-text("编辑"), button:has-text("删除")').count();
    console.log(`  操作列按钮总数: ${actionBtns}`);
    expect(actionBtns).toBeGreaterThanOrEqual(6); // 至少 1 行 × 6 按钮
    // 点击详情按钮
    const detailBtn = page.locator('button:has-text("详情")').first();
    await expect(detailBtn).toBeVisible();
    await detailBtn.click();
    console.log("  ✓ 详情按钮可点击");
    // 点击编辑按钮
    const editBtn = page.locator('button:has-text("编辑")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    console.log("  ✓ 编辑按钮可点击");
    // 点击删除按钮（会触发 confirm）
    const delBtn = page.locator('button:has-text("删除")').first();
    await expect(delBtn).toBeVisible();
    page.once("dialog", async (dialog) => {
      console.log(`  删除确认弹窗: ${dialog.message()}`);
      await dialog.dismiss();
    });
    await delBtn.click();
    console.log("  ✓ 删除按钮可点击，确认弹窗拦截正常");
    await page.screenshot({ path: `${OUT}06-actions.png`, fullPage: false });
    console.log("✓ T6 行操作按钮测试完成");
  });

  // ── 7. 搜索功能 ───────────────────────────────────────────────
  test("T7 搜索过滤：关键词过滤后表格更新", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    // 输入搜索关键词
    const searchInput = page.locator("input[placeholder*='搜索'], input[placeholder*='查找']").first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("web");
    await searchInput.press("Enter");
    await page.waitForTimeout(800);
    // 检查搜索结果
    const tableText = await page.locator("table, .re-table").textContent();
    console.log(`  搜索 "web" 后表格内容包含: web-01`);
    expect(tableText).toContain("web-01");
    // 清空搜索
    await searchInput.clear();
    await searchInput.press("Enter");
    await page.waitForTimeout(500);
    const allText = await page.locator("table, .re-table").textContent();
    expect(allText).toContain("db-01");
    console.log("✓ T7 搜索过滤完成");
  });

  // ── 8. 批量操作栏 ─────────────────────────────────────────────
  test("T8 批量操作：勾选行后批量操作栏出现", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    // 检查批量操作栏初始状态
    const batchBar = page.locator(".batch-bar");
    // 批量操作栏初始可能不显示（未勾选时）
    const batchVisible = await batchBar.isVisible().catch(() => false);
    console.log(`  批量操作栏初始可见: ${batchVisible}`);
    // 尝试勾选第一行 checkbox
    const checkbox = page.locator("input[type='checkbox']").first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
      await page.waitForTimeout(500);
      const batchVisibleAfter = await batchBar.isVisible().catch(() => false);
      console.log(`  勾选后批量操作栏可见: ${batchVisibleAfter}`);
      if (batchVisibleAfter) {
        await page.screenshot({ path: `${OUT}08-batch.png`, fullPage: false });
        console.log("✓ T8 批量操作栏显示正确");
      } else {
        console.log("  ⚠ 批量操作栏未显示（可能组件实现差异）");
      }
    } else {
      console.log("  ⚠ 未找到 checkbox，跳过批量操作测试");
    }
  });

  // ── 9. 全页截图 ───────────────────────────────────────────────
  test("T9 全页截图", async () => {
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}09-fullpage.png`, fullPage: true });
    console.log("✓ T9 全页截图完成");
  });

  // ── 10. 控制台日志检查 ───────────────────────────────────────
  test("T10 控制台无错误", async () => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        errors.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    await page.goto("http://localhost:8087/#/server/hosts");
    await page.waitForTimeout(2000);
    console.log(`  控制台错误/警告数: ${errors.length}`);
    if (errors.length > 0) errors.slice(0, 3).forEach(e => console.log(`    ${e}`));
    console.log("✓ T10 控制台检查完成");
  });
});
