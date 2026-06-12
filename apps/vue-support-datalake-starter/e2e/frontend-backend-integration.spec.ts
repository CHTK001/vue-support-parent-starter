import { test, expect } from "@playwright/test";

const CONSOLE_URL = "http://127.0.0.1:58081";
const BACKEND_URL = "http://127.0.0.1:58081";

test.describe("Frontend-Backend 联调", () => {
  test("完整业务流程: 加载 → Token → Status → Collect → Subscribe → Poll → Ack", async ({ page }) => {
    // 1) 打开 Console
    await page.goto(CONSOLE_URL, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("Datalake Protocol Console");
    await page.screenshot({ path: "e2e/screenshots/01-load.png" });

    // 2) 获取 Token
    await page.locator("#tokenBtn").click();
    await page.waitForTimeout(500);
    const stampToken = await page.locator("#stamp").textContent();
    expect(stampToken).not.toBe("BOOTING");
    await page.screenshot({ path: "e2e/screenshots/02-token.png" });

    // 3) 加载 Status
    await page.locator("#statusBtn").click();
    await page.waitForTimeout(500);
    await expect(page.locator("#collectors")).not.toBeEmpty();
    await expect(page.locator("#activeCollectors")).not.toBeEmpty();
    await expect(page.locator("#subscribers")).not.toBeEmpty();
    await page.screenshot({ path: "e2e/screenshots/03-status.png" });

    // 4) 查看 SPIs
    await page.locator("#spisBtn").click();
    await page.waitForTimeout(500);
    const logAfterSpis = await page.locator("#log").textContent();
    expect(logAfterSpis).toContain("spis");
    await page.screenshot({ path: "e2e/screenshots/04-spis.png" });

    // 5) Collect 采集样本数据
    await page.locator("#collectBtn").click();
    await page.waitForTimeout(500);
    const logAfterCollect = await page.locator("#log").textContent();
    expect(logAfterCollect).toContain("collect");
    await page.screenshot({ path: "e2e/screenshots/05-collect.png" });

    // 6) Subscribe 订阅
    await page.locator("#subscribeBtn").click();
    await page.waitForTimeout(500);
    const logAfterSubscribe = await page.locator("#log").textContent();
    expect(logAfterSubscribe).toContain("subscribe");
    await page.screenshot({ path: "e2e/screenshots/06-subscribe.png" });

    // 7) Poll 拉取
    await page.locator("#pollBtn").click();
    await page.waitForTimeout(500);
    const logAfterPoll = await page.locator("#log").textContent();
    expect(logAfterPoll).toContain("poll");
    await page.screenshot({ path: "e2e/screenshots/07-poll.png" });

    // 8) Ack 确认
    await page.locator("#ackBtn").click();
    await page.waitForTimeout(500);
    const logAfterAck = await page.locator("#log").textContent();
    expect(logAfterAck).toContain("ack");
    await page.screenshot({ path: "e2e/screenshots/08-ack.png" });

    // 9) Map Topic 映射
    await page.locator("#mappingBtn").click();
    await page.waitForTimeout(500);
    const logAfterMapping = await page.locator("#log").textContent();
    expect(logAfterMapping).toContain("mapping");
    await page.screenshot({ path: "e2e/screenshots/09-mapping.png" });
  });

  test("直接调用后端 API 验证 HTTP 采集", async ({ page }) => {
    // 1) 获取 token
    const tokenRes = await page.request.post(`${BACKEND_URL}/auth/token`, {
      headers: { "Content-Type": "application/json" },
      data: { description: "e2e-test", expiresAt: Date.now() + 3600000 },
    });
    expect(tokenRes.status()).toBe(200);
    const tokenBody = await tokenRes.json();
    const token = tokenBody.token || tokenBody.data?.token || "";
    expect(token).toBeTruthy();

    // 2) 调用采集
    const resp = await page.request.post(`${BACKEND_URL}/collect`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      data: { topic: "e2e-test", pipelineId: "e2e-test-pipeline", protocol: "HTTP", payload: { value: 42 } },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty("status");
  });
});
