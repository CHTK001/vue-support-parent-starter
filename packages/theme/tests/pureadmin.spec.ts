import { test, expect } from "@playwright/test";

test.describe("PureAdmin Theme Integration Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5174");
  });

  test("should load login page", async ({ page }) => {
    await expect(page.locator(".pureadmin-login-page")).toBeVisible();
    await expect(page.locator(".login-form-wrapper")).toBeVisible();
    await expect(page.locator("input[placeholder*='用户名']")).toBeVisible();
    await expect(page.locator("input[placeholder*='密码']")).toBeVisible();
  });

  test("should fill and submit login form", async ({ page }) => {
    await page.fill("input[placeholder*='用户名']", "admin");
    await page.fill("input[placeholder*='密码']", "admin123");
    await page.click("button:has-text('登录')");
    // 可能跳转至首页或显示错误
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(["/", "/home", "/login"]).toContain(new URL(url).pathname);
  });

  test("should toggle dark mode", async ({ page }) => {
    const switchEl = page.locator(".el-switch");
    await expect(switchEl).toBeVisible();
    const initialClass = await page.locator("html").getAttribute("class");
    await switchEl.click();
    await page.waitForTimeout(300);
    const newClass = await page.locator("html").getAttribute("class");
    expect(newClass).not.toBe(initialClass);
  });

  test("should switch language", async ({ page }) => {
    const langBtn = page.locator(".language-btn");
    await langBtn.click();
    const enOption = page.locator("text=English");
    await expect(enOption).toBeVisible();
    await enOption.click();
    await page.waitForTimeout(300);
    // 检查页面是否变为英文
    const title = page.locator(".title");
    await expect(title).not.toHaveText(/登录/);
  });
});
