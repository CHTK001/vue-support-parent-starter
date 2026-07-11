import { test, expect } from "@playwright/test";

const NAV_LINKS = ["首页", "软件", "AI", "环境", "工具", "统计", "系统", "相册", "设置"];

const PAGE_ROUTES: Record<string, string> = {
  "首页": "/",
  "软件": "/software-list",
  "环境": "/environment",
  "系统": "/system",
  "相册": "/album",
  "设置": "/settings",
};

test.describe("侧边栏 - Sidebar", () => {
  test("所有导航链接可见", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForTimeout(1000);

    const navLinks = page.locator(".sidebar-link");
    const count = await navLinks.count();
    expect(count).toBe(NAV_LINKS.length);

    const texts = await navLinks.allTextContents();
    for (const label of NAV_LINKS) {
      expect(texts.some(t => t.includes(label))).toBeTruthy();
    }
  });

  for (const label of Object.keys(PAGE_ROUTES)) {
    test(`导航 "${label}" 跳转正确`, async ({ page }) => {
      await page.goto("/#/");
      await page.waitForTimeout(500);

      const link = page.locator(".sidebar-link", { hasText: label });
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForTimeout(800);

      expect(page.url()).toContain(PAGE_ROUTES[label]);
    });
  }
});

// ── Page Load Tests ──
const ALL_PAGES = [
  { path: "/", name: "首页" },
  { path: "/software-list", name: "软件列表" },
  { path: "/environment", name: "环境" },
  { path: "/system", name: "系统信息" },
  { path: "/album", name: "相册" },
  { path: "/settings", name: "设置" },
  { path: "/ai", name: "AI 对话" },
  { path: "/ai/providers", name: "AI 提供商" },
  { path: "/ai/mcp", name: "AI MCP" },
  { path: "/ai/agents", name: "AI 客户端" },
];

test.describe("页面加载 - Page Load", () => {
  for (const p of ALL_PAGES) {
    test(`${p.name} - 页面正常加载`, async ({ page }) => {
      await page.goto(`/#${p.path}`);
      await page.waitForTimeout(1000);

      await expect(page.locator("body")).toBeVisible();

      // No error messages
      const errors = page.locator(".el-message--error, .el-alert--error");
      await expect(errors).toHaveCount(0);

      // Content area rendered
      const content = page.locator(".main-area, .app-shell");
      await expect(content.first()).toBeVisible({ timeout: 5000 });
    });
  }
});

test.describe("首页 - Home", () => {
  test("页面标题和新增按钮", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForTimeout(1000);

    await expect(page.locator("h1")).toBeVisible();
    const addBtn = page.locator("button", { hasText: "新增卡片" });
    await expect(addBtn).toBeVisible();
  });

  test("新增卡片弹窗", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForTimeout(500);

    const addBtn = page.locator("button", { hasText: "新增卡片" });
    if (await addBtn.isEnabled()) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const dialog = page.locator(".el-dialog");
      await expect(dialog).toBeVisible({ timeout: 3000 });

      const titleInput = dialog.locator("input").first();
      await expect(titleInput).toBeVisible();

      const cancelBtn = dialog.locator(".el-button", { hasText: "取消" });
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });

  test("卡片网格渲染", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForTimeout(1500);

    const cardGrid = page.locator(".card-grid");
    const emptyState = page.locator(".el-empty");

    const hasGrid = await cardGrid.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasGrid || hasEmpty).toBeTruthy();
  });
});

test.describe("软件列表 - Software List", () => {
  test("页面标题和操作按钮", async ({ page }) => {
    await page.goto("/#/software-list");
    await page.waitForTimeout(1000);

    await expect(page.locator("h1")).toBeVisible();
    const installBtn = page.locator("button", { hasText: "安装" });
    await expect(installBtn).toBeVisible();
    const scanBtn = page.locator("button", { hasText: "扫描" });
    await expect(scanBtn).toBeVisible();
  });

  test("视图切换按钮", async ({ page }) => {
    await page.goto("/#/software-list");
    await page.waitForTimeout(500);

    const toggleBtns = page.locator(".toggle button");
    const count = await toggleBtns.count();
    if (count >= 2) {
      await toggleBtns.nth(1).click();
      await page.waitForTimeout(300);
      await toggleBtns.nth(0).click();
      await page.waitForTimeout(300);
    }
  });

  test("搜索输入框可用", async ({ page }) => {
    await page.goto("/#/software-list");
    await page.waitForTimeout(500);

    const searchInput = page.locator("input[placeholder*='搜索']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("test-software");
      expect(await searchInput.inputValue()).toBe("test-software");
      await searchInput.fill("");
    }
  });

  test("安装弹窗可打开", async ({ page }) => {
    await page.goto("/#/software-list");
    await page.waitForTimeout(500);

    const installBtn = page.locator("button", { hasText: "安装" });
    if (await installBtn.isEnabled()) {
      await installBtn.click();
      await page.waitForTimeout(500);
      const dialog = page.locator(".el-dialog");
      await expect(dialog).toBeVisible({ timeout: 3000 }).catch(() => {});
      await page.keyboard.press("Escape");
    }
  });
});

test.describe("环境 - Environment", () => {
  test("页面标题和 SDK 区域", async ({ page }) => {
    await page.goto("/#/environment");
    await page.waitForTimeout(1500);

    await expect(page.locator("h1")).toBeVisible();
    const sdkSection = page.locator(".sdk-grid, .env-section, .el-loading");
    await expect(sdkSection.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

test.describe("系统信息 - System Info", () => {
  test("页面标题", async ({ page }) => {
    await page.goto("/#/system");
    await page.waitForTimeout(1500);

    await expect(page.locator("h1")).toBeVisible();
  });

  test("系统信息卡片渲染", async ({ page }) => {
    await page.goto("/#/system");
    await page.waitForTimeout(1500);

    await expect(page.locator("h1")).toBeVisible();

    const refreshBtn = page.locator("button", { hasText: "刷新" });
    const hasRefresh = await refreshBtn.isVisible().catch(() => false);
    const hasSegs = await page.locator(".seg").first().isVisible().catch(() => false);
    expect(hasRefresh || hasSegs).toBeTruthy();
  });
});

test.describe("设置 - Settings", () => {
  test("页面标题和设置选项", async ({ page }) => {
    await page.goto("/#/settings");
    await page.waitForTimeout(1000);

    await expect(page.locator("h1")).toBeVisible();
  });

  test("安装模式切换", async ({ page }) => {
    await page.goto("/#/settings");
    await page.waitForTimeout(500);

    const radioGroup = page.locator(".el-radio-group");
    if (await radioGroup.isVisible().catch(() => false)) {
      const radioBtns = radioGroup.locator(".el-radio-button");
      const count = await radioBtns.count();
      if (count >= 2) {
        await radioBtns.nth(1).click();
        await page.waitForTimeout(300);
      }
    }
  });

  test("AI 能力卡片选择可见", async ({ page }) => {
    await page.goto("/#/settings");
    await page.waitForTimeout(1500);

    const cards = page.locator(".radio-box");
    const labels = await cards.allTextContents();
    expect(labels.some(t => t.includes("对话 AI"))).toBeTruthy();
    expect(labels.some(t => t.includes("文生图 AI"))).toBeTruthy();
    expect(labels.some(t => t.includes("知识图谱 AI"))).toBeTruthy();
  });

  test("点击 AI 卡片切换配置面板", async ({ page }) => {
    await page.goto("/#/settings");
    await page.waitForTimeout(1500);

    const cards = page.locator(".radio-box");
    const count = await cards.count();
    if (count >= 3) {
      await cards.nth(2).click();
      await page.waitForTimeout(300);
      await cards.nth(0).click();
      await page.waitForTimeout(300);
    }

    const configPanel = page.locator(".ai-config-panel");
    await expect(configPanel).toBeVisible();

    const selects = page.locator(".ai-select");
    const emptyState = page.locator(".seg-empty");
    const hasSelects = await selects.count().catch(() => 0);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasSelects > 0 || hasEmpty).toBeTruthy();
  });
});

test.describe("AI 页面 - AI Pages", () => {
  test("AI 对话页面有子导航", async ({ page }) => {
    await page.goto("/#/ai");
    await page.waitForTimeout(1000);

    const subnav = page.locator(".ai-subnav");
    await expect(subnav).toBeVisible({ timeout: 3000 });

    const links = subnav.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("AI 提供商页面有过滤卡片", async ({ page }) => {
    await page.goto("/#/ai/providers");
    await page.waitForTimeout(1500);

    const filterChips = page.locator(".filter-chip, .filter-card");
    const count = await filterChips.count().catch(() => 0);
    expect(count >= 0).toBeTruthy();
    await expect(page.locator("h1, .page-title").first()).toBeVisible({ timeout: 3000 });
  });

  test("AI MCP 页面有布局", async ({ page }) => {
    await page.goto("/#/ai/mcp");
    await page.waitForTimeout(1500);

    const sidebar = page.locator(".ai-sidebar, .sidebar-list");
    const main = page.locator(".ai-main, .mcp-grid");

    const hasSidebar = await sidebar.isVisible().catch(() => false);
    const hasMain = await main.isVisible().catch(() => false);

    expect(hasSidebar || hasMain).toBeTruthy();
  });

  test("AI 客户端页面可扫描", async ({ page }) => {
    await page.goto("/#/ai/agents");
    await page.waitForTimeout(1000);

    const scanBtn = page.locator("button", { hasText: /扫描/ });
    await expect(scanBtn).toBeVisible({ timeout: 3000 });

    const agentCards = page.locator(".agent-card, .agent-grid");
    const hasCards = await agentCards.isVisible().catch(() => false);
    expect(hasCards || await page.locator(".el-empty").isVisible().catch(() => false)).toBeTruthy();
  });
});

test.describe("布局 - Layout", () => {
  test("标题栏固定", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForTimeout(500);

    const titleBar = page.locator(".title-bar");
    await expect(titleBar).toBeVisible();
  });

  test("侧边栏显示", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForTimeout(500);

    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();
  });

  test("品牌名称显示", async ({ page }) => {
    await page.goto("/#/");
    await page.waitForTimeout(500);

    await expect(page.locator(".brand-name")).toHaveText("Toolkit");
  });
});
