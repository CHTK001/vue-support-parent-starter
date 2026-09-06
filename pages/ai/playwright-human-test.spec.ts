import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";

const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\pw-";

// ── 人类行为辅助 ───────────────────────────────────────────────

async function think(page: Page, ms = 300): Promise<void> {
  await page.waitForTimeout(ms + Math.random() * ms);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function humanMove(page: Page, x: number, y: number): Promise<void> {
  const steps = rand(8, 15);
  const sx = rand(x - 50, x + 50);
  const sy = rand(y - 50, y + 50);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(sx + (x - sx) * t + rand(-2, 2));
    const cy = Math.round(sy + (y - sy) * t + rand(-2, 2));
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(rand(8, 20));
  }
}

async function humanClick(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector).first();
  await expect(el).toBeVisible({ timeout: 10000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`Element not found: ${selector}`);
  const cx = Math.round(box.x + box.width / 2);
  const cy = Math.round(box.y + box.height / 2);
  await humanMove(page, cx, cy);
  await think(page, 100);
  await page.mouse.click(cx, cy);
  await think(page, 400);
}

// ── 独立测试 ───────────────────────────────────────────────────

test("T1 访问 example.com 首页", async ({ page }) => {
  await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
  await think(page, 800);
  expect(await page.title()).toBe("Example Domain");
  expect(await page.locator("h1").textContent()).toContain("Example Domain");
  await page.screenshot({ path: OUT + "01-home.png", fullPage: true });
  console.log("✓ T1");
});

test("T2 鼠标悬停检测所有链接", async ({ page }) => {
  await page.goto("https://example.com");
  await think(page, 400);
  const links = await page.locator("a").all();
  console.log(`  找到 ${links.length} 个链接`);
  for (const link of links) {
    const box = await link.boundingBox();
    if (box) {
      await humanMove(page, box.x + box.width / 2, box.y + box.height / 2);
      await think(page, 150);
    }
  }
  await page.screenshot({ path: OUT + "02-links-hover.png" });
  console.log("✓ T2");
});

test("T3 quotes.toscrape.com 访问与截图", async ({ page }) => {
  await page.goto("https://quotes.toscrape.com", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await think(page, 1000);
  expect(await page.title()).toContain("Quotes to Scrape");
  await page.screenshot({ path: OUT + "03-quotes.png", fullPage: true });
  console.log("✓ T3");
});

test("T4 提取前 3 条引用", async ({ page }) => {
  await page.goto("https://quotes.toscrape.com");
  await think(page, 600);
  const quotes = await page.$$eval(".quote", (els) =>
    els.slice(0, 3).map((el) => ({
      text: el.querySelector<HTMLElement>(".text")?.innerText
        .replace(/"/g, "'")
        .slice(0, 80),
      author: el.querySelector<HTMLElement>(".author")?.innerText,
      tags: Array.from(el.querySelectorAll(".tag"))
        .map((t) => t.innerText)
        .slice(0, 3),
    }))
  );
  quotes.forEach((q, i) =>
    console.log(`    [${i + 1}] ${q.text} by ${q.author} | ${q.tags.join(",")}`)
  );
  expect(quotes.length).toBeGreaterThanOrEqual(3);
  console.log("✓ T4");
});

test("T5 控制台日志抓取", async ({ page }) => {
  const logs: string[] = [];
  page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  await page.goto("https://example.com");
  await think(page, 500);
  const errors = logs.filter((l) => l.includes("[error]") || l.includes("[warn]"));
  console.log(`  控制台日志: ${logs.length} 条, 警告/错误: ${errors.length}`);
  console.log("✓ T5");
});

test("T6 网络请求记录", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (req) => requests.push(`${req.method()} ${req.url().slice(0, 80)}`));
  await page.goto("https://quotes.toscrape.com", { waitUntil: "networkidle" });
  await think(page, 300);
  console.log(`  拦截请求数: ${requests.length}`);
  console.log("✓ T6");
});

test("T7 移动端视口截图", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("https://example.com");
  await think(page, 400);
  await page.screenshot({ path: OUT + "07-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1920, height: 1080 });
  console.log("✓ T7 (375×812 → 1920×1080)");
});

test("T8 桌面视口最终截图", async ({ page }) => {
  await page.goto("https://example.com");
  await think(page, 400);
  await page.screenshot({ path: OUT + "08-final.png", fullPage: true });
  console.log("✓ T8");
});

test("T9 截图文件统计", async () => {
  const expected = ["01","02","03","07","08"].map((n) => `${OUT}${n}.png`);
  const exists = expected.filter(fs.existsSync);
  const total = exists.reduce((s, p) => s + fs.statSync(p).size, 0);
  console.log(`  截图: ${exists.length}/${expected.length}, 总大小 ${(total / 1024).toFixed(0)} KB`);
  expect(exists.length).toBeGreaterThanOrEqual(5);
  console.log("✓ T9");
});

// ── 串行会话测试（保留浏览器上下文） ─────────────────────────

test.describe.serial("完整浏览流程", () => {
  test("S1 访问 example.com", async ({ page }) => {
    await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
    await think(page, 800);
    expect(await page.title()).toBe("Example Domain");
    console.log("✓ S1");
  });

  test("S2 滚动 IANA 页面", async ({ page }) => {
    await humanClick(page, 'a:has-text("Learn more")');
    await page.waitForLoadState("domcontentloaded");
    await think(page, 600);
    expect(page.url()).toContain("iana.org");

    await page.mouse.wheel(0, 500);
    await think(page, 300);
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeGreaterThan(0);
    await page.screenshot({ path: OUT + "s2-iana.png", fullPage: true });
    console.log(`✓ S2 scrollY=${after}`);
  });

  test("S3 后退 + 翻页", async ({ page }) => {
    // 后退到 example.com
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    await think(page, 400);
    expect(page.url()).toContain("example.com");
    console.log("✓ S3 后退成功");

    // 重新去 quotes 翻页
    await page.goto("https://quotes.toscrape.com", { waitUntil: "networkidle" });
    await think(page, 600);
    await humanClick(page, 'a:has-text("Next")');
    await page.waitForLoadState("networkidle");
    await think(page, 500);
    console.log(`  URL: ${page.url()}`);
    await page.screenshot({ path: OUT + "s3-page2.png", fullPage: true });
    console.log("✓ S3 翻页完成");
  });

  test("S4 标签过滤", async ({ page }) => {
    await humanClick(page, 'a.tag:visible').catch(() => {});
    // 备选：直接点击第一个可见的 "life" 链接
    await page.locator('a:has-text("life")').first().click();
    await page.waitForLoadState("networkidle");
    await think(page, 500);
    const filtered = await page.locator(".quote").count();
    console.log(`  "life" 筛选后: ${filtered} 条引用`);
    expect(filtered).toBeGreaterThan(0);
    await page.screenshot({ path: OUT + "s4-filtered.png", fullPage: true });
    console.log("✓ S4");
  });

  test("S5 多标签组合截图", async ({ page }) => {
    // 点其他标签
    await page.goto("https://quotes.toscrape.com/tag/humor/page/1/");
    await think(page, 600);
    await page.screenshot({ path: OUT + "s5-humor.png", fullPage: true });

    await page.goto("https://quotes.toscrape.com/tag/inspirational/page/1/");
    await think(page, 600);
    await page.screenshot({ path: OUT + "s5-inspire.png", fullPage: true });
    console.log("✓ S5");
  });

  test("S6 全页 diff 对比", async ({ page }) => {
    await page.goto("https://example.com");
    await think(page, 400);
    await page.screenshot({ path: OUT + "s6-a.png", fullPage: false });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await think(page, 300);
    await page.screenshot({ path: OUT + "s6-b.png", fullPage: false });
    console.log("✓ S6 对比截图完成");
  });
});
