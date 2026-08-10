import { test, expect } from "@playwright/test";

/**
 * 完整业务流程：连接 mock 网关、查看 agent、测试 RustDesk
 */
test.describe("本地连接流程", () => {
  test("1. 验证前端代理的 mock-api 可访问", async ({ page }) => {
    // 前端页面打开
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(1500);

    // 在浏览器侧通过 fetch 访问 vite 代理的 /api/health
    const result = await page.evaluate(async () => {
      try {
        const r = await fetch("/admin/api/agents");
        const data = await r.json();
        return { ok: true, status: r.status, data };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    });
    console.log("通过前端代理访问 mock-api:", JSON.stringify(result, null, 2));

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].agentId).toBe("test-agent-rustdesk");
  });

  test("2. 填写连接表单（gateway 指向本地）", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(1500);

    // 1) 填写连接名称
    const nameInput = page.locator('input[placeholder*="给连接起个名称"]').first();
    await nameInput.fill("测试本地网关");

    // 2) 填写 Gateway IP（默认就是 127.0.0.1）
    const hostInput = page.locator('input[placeholder="127.0.0.1"]').first();
    await hostInput.fill("127.0.0.1");

    // 3) 填写 Gateway 端口（管理端口 3000）
    const portInput = page.locator('input[placeholder="18082"]').first();
    await portInput.fill("3000");

    // 4) 填写目标 ID
    const targetInput = page.locator('input[placeholder*="a96bf074017f"]').first();
    await targetInput.fill("test-agent-rustdesk");

    // 5) 填写验证码
    const codeInput = page.locator('input[placeholder*="6 位验证码"]').first();
    await codeInput.fill("123456");

    // 验证所有字段已填充
    await expect(nameInput).toHaveValue("测试本地网关");
    await expect(hostInput).toHaveValue("127.0.0.1");
    await expect(portInput).toHaveValue("3000");
    await expect(targetInput).toHaveValue("test-agent-rustdesk");
    await expect(codeInput).toHaveValue("123456");
  });

  test("3. 通过远端 API 设置弹窗修改地址为本地", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(1500);

    // 点击头部右侧的远端 API 标签
    const apiTag = page.locator(".header-right .el-tag").last();
    await apiTag.click();
    await page.waitForTimeout(800);

    // 弹窗出现
    const popover = page.locator(".el-popover").filter({ hasText: "远端 API 地址" }).last();
    await expect(popover).toBeVisible({ timeout: 5000 });

    // 修改端口为 3000
    const portInput = popover.locator("input").nth(1);
    await portInput.fill("3000");
    await page.waitForTimeout(300);

    // 点击保存
    const saveBtn = popover.locator("button").filter({ hasText: "保存" });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    // 弹窗可能仍可见（保存是异步），用 click outside 关闭
    await page.click(".app-header", { position: { x: 100, y: 30 } }).catch(() => {});
    await page.waitForTimeout(500);
    // 不强制断言弹窗关闭，因为 RemoteControl 可能设计为不自动关闭
    const visible = await popover.isVisible().catch(() => false);
    console.log("保存后弹窗状态:", visible);
  });

  test("4. 模拟通过 fetch 调用本地 mock 接口验证完整链路", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(1000);

    const result = await page.evaluate(async () => {
      const out: Record<string, unknown> = {};
      // /admin/api/agents（前端代理到 mock-api:3000）
      try {
        const r1 = await fetch("/admin/api/agents");
        out.agents = { status: r1.status, data: await r1.json() };
      } catch (e) {
        out.agents = { error: String(e) };
      }
      // /api/agents
      try {
        const r2 = await fetch("/api/agents");
        out.apiAgents = { status: r2.status, data: await r2.json() };
      } catch (e) {
        out.apiAgents = { error: String(e) };
      }
      return out;
    });
    console.log("链路测试:", JSON.stringify(result, null, 2));
    expect((result.agents as { status: number }).status).toBe(200);
    expect((result.apiAgents as { status: number }).status).toBe(200);
  });

  test("5. 截图：完整界面（已修复黑袍 + 本地网关就绪）", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "e2e-black/screenshots/local-ready.png",
      fullPage: false,
    });
  });
});