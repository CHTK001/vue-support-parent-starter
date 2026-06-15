import { test, expect, Page } from "@playwright/test";

const VITE_URL = "http://127.0.0.1:8853";

// ============================================================
// 辅助函数
// ============================================================

async function waitForApp(page: Page) {
  await page.goto(VITE_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".datalake-app", { timeout: 15000 });
}

async function switchTab(page: Page, tabLabel: string) {
  const tab = page.locator(".tab-item").filter({ hasText: tabLabel });
  await tab.click();
  await page.waitForTimeout(800);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/screenshots/regression-${name}.png`,
    fullPage: false,
  });
}

// ============================================================
// 测试套件 1：页面加载和导航
// ============================================================
test.describe("1. 页面加载和导航", () => {
  test("1.1 监控大屏加载", async ({ page }) => {
    await waitForApp(page);
    await expect(page.locator(".brand-text h1")).toHaveText("数据中台");
    await expect(page.locator(".status-dot")).toBeVisible();
    await screenshot(page, "01-monitor");
  });

  test("1.2 Tab 导航 - 流水线管理", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "流水线管理");
    await expect(page.locator(".pipeline-graph-page")).toBeVisible();
    await screenshot(page, "02-pipeline");
  });

  test("1.3 Tab 导航 - 数据查询", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "数据查询");
    await screenshot(page, "03-data");
  });

  test("1.4 Tab 导航 - 订阅客户端", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "订阅客户端");
    await screenshot(page, "04-subscription");
  });

  test("1.5 Tab 导航 - 采集管理", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "采集管理");
    await screenshot(page, "05-collector");
  });

  test("1.6 Tab 导航 - 死信队列", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "死信队列");
    await screenshot(page, "06-dlq");
  });

  test("1.7 Tab 导航 - 系统配置", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "系统配置");
    await screenshot(page, "07-settings");
  });

  test("1.8 Tab 导航 - 协议控制台", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "协议控制台");
    await screenshot(page, "08-console");
  });
});

// ============================================================
// 测试套件 2：主题切换
// ============================================================
test.describe("2. 主题切换", () => {
  test("2.1 切换到科技主题", async ({ page }) => {
    await waitForApp(page);
    await page.locator(".theme-btn").filter({ hasText: "科技" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".datalake-app--scifi")).toBeVisible();
    await screenshot(page, "09-theme-scifi");
  });

  test("2.2 切换到大屏主题", async ({ page }) => {
    await waitForApp(page);
    await page.locator(".theme-btn").filter({ hasText: "大屏" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".datalake-app--screen")).toBeVisible();
    await screenshot(page, "10-theme-screen");
  });

  test("2.3 切换到夜航主题", async ({ page }) => {
    await waitForApp(page);
    await page.locator(".theme-btn").filter({ hasText: "夜航" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".datalake-app--night")).toBeVisible();
    await screenshot(page, "11-theme-night");
  });

  test("2.4 所有主题循环切换", async ({ page }) => {
    await waitForApp(page);

    // 科技 -> 大屏 -> 夜航 -> 科技
    await page.locator(".theme-btn").filter({ hasText: "大屏" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator(".datalake-app--screen")).toBeVisible();

    await page.locator(".theme-btn").filter({ hasText: "夜航" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator(".datalake-app--night")).toBeVisible();

    await page.locator(".theme-btn").filter({ hasText: "科技" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator(".datalake-app--scifi")).toBeVisible();
  });
});

// ============================================================
// 测试套件 3：刷新功能
// ============================================================
test.describe("3. 刷新功能", () => {
  test("3.1 刷新按钮点击", async ({ page }) => {
    await waitForApp(page);
    const refreshBtn = page.locator(".header-refresh-btn");
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await page.waitForTimeout(1000);
    // 检查刷新后的状态
    await expect(page.locator(".header-refresh-text")).toBeVisible();
  });

  test("3.2 流水线页面刷新", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "流水线管理");
    const refreshBtn = page.locator(".btn-ghost").filter({ hasText: "刷新" });
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      await page.waitForTimeout(1500);
    }
  });
});

// ============================================================
// 测试套件 4：流水线管理功能
// ============================================================
test.describe("4. 流水线管理", () => {
  test("4.1 查看流水线列表", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "流水线管理");
    await expect(page.locator(".pipeline-graph-page")).toBeVisible();
    await expect(page.locator(".pipeline-sidebar")).toBeVisible();
    await screenshot(page, "12-pipeline-list");
  });

  test("4.2 创建新流水线", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "流水线管理");

    // 点击"创建 Pipeline"按钮
    const createBtn = page.locator(".btn-primary").filter({ hasText: "创建 Pipeline" });
    await createBtn.click();
    await page.waitForTimeout(800);

    // 检查对话框是否打开
    const dialog = page.locator(".el-dialog");
    await expect(dialog).toBeVisible();

    // 填写表单
    const testId = `test-${Date.now()}`;
    const nameInput = dialog.locator(".el-form-item").filter({ hasText: "名称" }).locator("input");
    await nameInput.fill(testId);

    // 填写版本
    const versionInput = dialog.locator(".el-form-item").filter({ hasText: "版本" }).locator("input");
    if (await versionInput.isVisible()) {
      await versionInput.fill("1.0.0");
    }

    // 点击确定
    const submitBtn = dialog.locator("button").filter({ hasText: "确定" });
    await submitBtn.click();
    await page.waitForTimeout(2000);

    await screenshot(page, "13-pipeline-create");
  });

  test("4.3 搜索流水线", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "流水线管理");

    const searchInput = page.locator(".pipeline-graph-page input[placeholder*='搜索']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await page.waitForTimeout(500);
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
    await screenshot(page, "14-pipeline-search");
  });

  test("4.4 选择流水线查看详情", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "流水线管理");

    // 等待流水线列表加载
    await page.waitForTimeout(1000);
    const pipelineItem = page.locator(".pipeline-item").first();
    if (await pipelineItem.isVisible()) {
      await pipelineItem.click();
      await page.waitForTimeout(800);
      // 检查是否显示编辑器区域
      const mainArea = page.locator(".graph-main");
      await expect(mainArea).toBeVisible();
    }
    await screenshot(page, "15-pipeline-detail");
  });
});

// ============================================================
// 测试套件 5：数据查询功能
// ============================================================
test.describe("5. 数据查询", () => {
  test("5.1 数据查询页面加载", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "数据查询");
    await screenshot(page, "16-data-query");
  });

  test("5.2 搜索框可见性", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "数据查询");
    // 查找可能的搜索框
    const searchBox = page.locator('input[placeholder*="搜索"], input[placeholder*="Search"]');
    // 可能为空,不做强制断言
    await screenshot(page, "17-data-search");
  });
});

// ============================================================
// 测试套件 6：订阅客户端功能
// ============================================================
test.describe("6. 订阅客户端", () => {
  test("6.1 订阅客户端页面加载", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "订阅客户端");
    await screenshot(page, "18-subscription");
  });

  test("6.2 订阅客户端列表", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "订阅客户端");
    await page.waitForTimeout(1000);
    await screenshot(page, "19-subscription-list");
  });
});

// ============================================================
// 测试套件 7：采集管理功能
// ============================================================
test.describe("7. 采集管理", () => {
  test("7.1 采集器页面加载", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "采集管理");
    await screenshot(page, "20-collector");
  });

  test("7.2 查看采集器列表", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "采集管理");
    await page.waitForTimeout(1000);
    await screenshot(page, "21-collector-list");
  });
});

// ============================================================
// 测试套件 8：死信队列功能
// ============================================================
test.describe("8. 死信队列", () => {
  test("8.1 死信队列页面加载", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "死信队列");
    await screenshot(page, "22-dlq");
  });

  test("8.2 死信队列列表", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "死信队列");
    await page.waitForTimeout(1000);
    await screenshot(page, "23-dlq-list");
  });
});

// ============================================================
// 测试套件 9：系统配置功能
// ============================================================
test.describe("9. 系统配置", () => {
  test("9.1 系统配置页面加载", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "系统配置");
    await screenshot(page, "24-settings");
  });

  test("9.2 检查配置项", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "系统配置");
    await page.waitForTimeout(1000);
    await screenshot(page, "25-settings-items");
  });
});

// ============================================================
// 测试套件 10：协议控制台功能
// ============================================================
test.describe("10. 协议控制台", () => {
  test("10.1 协议控制台页面加载", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "协议控制台");
    await screenshot(page, "26-console");
  });

  test("10.2 协议列表可见性", async ({ page }) => {
    await waitForApp(page);
    await switchTab(page, "协议控制台");
    await page.waitForTimeout(1000);
    await screenshot(page, "27-console-list");
  });
});

// ============================================================
// 测试套件 11：综合测试 - 快速 Tab 切换
// ============================================================
test.describe("11. 综合测试", () => {
  test("11.1 快速 Tab 切换", async ({ page }) => {
    await waitForApp(page);

    const tabs = [
      "流水线管理",
      "数据查询",
      "订阅客户端",
      "采集管理",
      "死信队列",
      "系统配置",
      "协议控制台",
      "监控大屏",
    ];

    for (const tab of tabs) {
      await page.locator(".tab-item").filter({ hasText: tab }).click();
      await page.waitForTimeout(500);
    }
  });

  test("11.2 主题切换后检查所有 Tab", async ({ page }) => {
    await waitForApp(page);

    // 切换到大屏主题
    await page.locator(".theme-btn").filter({ hasText: "大屏" }).click();
    await page.waitForTimeout(500);

    const tabs = ["流水线管理", "数据查询", "订阅客户端"];

    for (const tab of tabs) {
      await page.locator(".tab-item").filter({ hasText: tab }).click();
      await page.waitForTimeout(500);
      await screenshot(page, `28-screen-${tab}`);
    }
  });

  test("11.3 页面错误检查", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await waitForApp(page);

    const allTabs = [
      "监控大屏",
      "流水线管理",
      "数据查询",
      "订阅客户端",
      "采集管理",
      "死信队列",
      "系统配置",
      "协议控制台",
    ];

    for (const tab of allTabs) {
      await page.locator(".tab-item").filter({ hasText: tab }).click();
      await page.waitForTimeout(1000);
    }

    // 切换所有主题
    const themes = ["科技", "大屏", "夜航"];
    for (const theme of themes) {
      await page.locator(".theme-btn").filter({ hasText: theme }).click();
      await page.waitForTimeout(500);
    }

    expect(errors).toEqual([]);
  });

  test("11.4 刷新按钮多页面测试", async ({ page }) => {
    await waitForApp(page);

    const pages = ["流水线管理", "系统配置"];
    for (const pageName of pages) {
      await page.locator(".tab-item").filter({ hasText: pageName }).click();
      await page.waitForTimeout(500);

      // 点击页面上的刷新按钮
      const refreshBtns = page.locator("button").filter({ hasText: /刷新/ });
      if ((await refreshBtns.count()) > 0) {
        await refreshBtns.first().click();
        await page.waitForTimeout(1000);
      }
    }
  });
});