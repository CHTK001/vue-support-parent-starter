import { test, expect } from "@playwright/test";

test.describe("vue-support-remote-starter 黑袍修复验证", () => {
  test("1. 页面加载成功，背景色正常（非黑屏）", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !m.text().includes("ws://127.0.0.1:8082")) {
        errors.push("CONSOLE: " + m.text());
      }
    });

    const resp = await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    expect(resp?.status()).toBe(200);

    // 等 Vue 挂载
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(1500);

    // 验证关键元素存在
    await expect(page.locator(".app-shell")).toBeVisible();
    await expect(page.locator(".app-header")).toBeVisible();

    // 验证背景色（亮色模式：#f2f3f5 = rgb(242,243,245)）
    const htmlBg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const shellBg = await page.evaluate(() => {
      const el = document.querySelector(".app-shell");
      return el ? getComputedStyle(el).backgroundColor : null;
    });

    console.log("html bg:", htmlBg);
    console.log("body bg:", bodyBg);
    console.log("app-shell bg:", shellBg);

    // 关键断言：背景不是黑色
    expect(htmlBg).not.toBe("rgb(0, 0, 0)");
    expect(bodyBg).not.toBe("rgb(0, 0, 0)");
    expect(shellBg).not.toBe("rgb(0, 0, 0)");
    // 也不应该是透明
    expect(shellBg).not.toBe("rgba(0, 0, 0, 0)");

    // 应该是 Element Plus 亮色模式的页面背景
    expect(["rgb(242, 243, 245)", "rgb(240, 242, 245)", "rgb(245, 247, 250)"]).toContain(shellBg);

    expect(errors.filter((e) => !e.includes("WebSocket"))).toEqual([]);
  });

  test("2. 头部导航 tab 可见（远程控制、SOCK 代理为默认）", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".header-tab", { timeout: 15000 });

    const tabCount = await page.locator(".header-tab").count();
    // 默认状态下，访问码未验证，仅 远程控制 / SOCK 代理 两个 tab 可见
    expect(tabCount).toBeGreaterThanOrEqual(2);

    const tabs = await page.locator(".header-tab").allTextContents();
    console.log("默认可见 tabs:", tabs);

    const text = tabs.join(" ");
    expect(text).toContain("远程控制");
    expect(text).toContain("SOCK");
  });

  test("3. 暗色模式背景为柔和深灰 (#0f172a)，非纯黑", async ({ page, context }) => {
    // 注入 html.dark 类模拟暗色模式
    await context.addInitScript(() => {
      window.localStorage.setItem(
        "layout",
        JSON.stringify({ darkMode: true }),
      );
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(2000);

    const htmlClass = await page.evaluate(() => document.documentElement.className);
    console.log("html class:", htmlClass);

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const shellBg = await page.evaluate(() => {
      const el = document.querySelector(".app-shell");
      return el ? getComputedStyle(el).backgroundColor : null;
    });

    console.log("dark body bg:", bodyBg);
    console.log("dark app-shell bg:", shellBg);

    // 关键断言：暗色模式背景是 #0f172a = rgb(15, 23, 42)，而非纯黑 #020617 = rgb(2, 6, 23)
    expect(bodyBg).toBe("rgb(15, 23, 42)");
    expect(shellBg).toBe("rgb(15, 23, 42)");
    // 确保不是 #020617 (旧的全黑色)
    expect(bodyBg).not.toBe("rgb(2, 6, 23)");
  });

  test("4. 截图保存：亮色模式", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e-black/screenshots/light.png", fullPage: false });
  });

  test("5. 截图保存：暗色模式", async ({ page, context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem("layout", JSON.stringify({ darkMode: true }));
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".app-shell", { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "e2e-black/screenshots/dark.png", fullPage: false });
  });
});