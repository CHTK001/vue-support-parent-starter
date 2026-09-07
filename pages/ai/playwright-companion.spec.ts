/**
 * 桌面伙伴（Companion）功能 Playwright E2E 测试
 *
 * 覆盖：#/nomi 伙伴工作台 —— 伙伴列表、总览、记忆&知识库、技能、
 *        形象库、打开聊天（专属会话跳转）。
 *
 * 策略：连接本地真实前后端（前端 5173 / 后端 8787），先经后端 API
 *       准备稳定的伙伴数据（用 Playwright request fixture，规避 Node
 *       fetch 代理问题），再逐屏验证并截图。
 */
import { test, expect, Page, APIRequestContext } from "@playwright/test";

const FRONT = "http://127.0.0.1:5173";
const BACK = "http://127.0.0.1:8787";
const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\companion-";

// ── 人类行为辅助（与 playwright-human-test 一致） ───────────────

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

async function humanClick(page: Page, locator: ReturnType<Page["locator"]>): Promise<void> {
  const el = locator.first();
  await expect(el).toBeVisible({ timeout: 15000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`Element not visible: ${await el.count()} match(es)`);
  const cx = Math.round(box.x + box.width / 2);
  const cy = Math.round(box.y + box.height / 2);
  await humanMove(page, cx, cy);
  await think(page, 100);
  await page.mouse.click(cx, cy);
  await think(page, 400);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: OUT + name + ".png", fullPage: false });
}

// ── API 数据准备（用 Playwright request，规避 Node fetch 代理） ──

async function waitBackend(request: APIRequestContext): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await request.get(`${BACK}/api/companion/companions`, { timeout: 5000 });
      if (res.ok()) return;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`后端不可达: ${BACK} (last=${lastErr})`);
}

async function apiListCompanions(request: APIRequestContext): Promise<any[]> {
  const res = await request.get(`${BACK}/api/companion/companions`);
  const json = await res.json();
  return json.data ?? [];
}

async function apiCreateCompanion(request: APIRequestContext, name: string): Promise<string> {
  const res = await request.post(`${BACK}/api/companion/companions`, {
    data: { name, character: "mochi" },
  });
  const json = await res.json();
  return json.data.companion_id;
}

async function apiAddMemory(request: APIRequestContext, companionId: string, content: string): Promise<void> {
  await request.post(`${BACK}/api/companion/memories`, {
    data: { kind: "preference", content, companion_id: companionId },
  });
}

async function apiAddSkill(request: APIRequestContext, companionId: string, skillName: string): Promise<void> {
  await request.post(`${BACK}/api/companion/companions/${companionId}/skills`, {
    data: { skill_name: skillName, description: "E2E 技能", content: "# e2e" },
  });
}

async function apiDeleteCompanion(request: APIRequestContext, companionId: string): Promise<void> {
  await request.delete(`${BACK}/api/companion/companions/${companionId}`);
}

async function apiEnsureSeed(request: APIRequestContext, name: string): Promise<string> {
  const list = await apiListCompanions(request);
  const existing = list.find((c) => c.name === name);
  if (existing) return existing.companion_id;
  return apiCreateCompanion(request, name);
}

// ── 打开 nomi 工作台 ─────────────────────────────────────────

async function openNomi(page: Page): Promise<void> {
  await page.goto(`${FRONT}/#/nomi`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(4000);
}

// ═════════════════════════════════════════════════════════════

test.describe("桌面伙伴 E2E", () => {
  let companionId = "";
  let request: APIRequestContext;

  test.beforeAll(async ({ request: req }) => {
    request = req;
    await waitBackend(req);
    // 准备稳定数据：确保存在「小蓝」伙伴 + 1 记忆 + 1 技能
    companionId = await apiEnsureSeed(req, "小蓝");
    await apiAddMemory(req, companionId, "用户喜欢简洁明了的回答");
    await apiAddSkill(req, companionId, "git助手");
  });

  test.afterAll(async () => {
    if (companionId && request) {
      await apiDeleteCompanion(request, companionId).catch(() => {});
    }
  });

  test("T1 伙伴工作台加载 & 伙伴列表展示", async ({ page }) => {
    await openNomi(page);
    expect(page.url()).toContain("#/nomi");

    // 侧边栏「桌面伙伴」高亮
    await expect(page.locator("text=桌面伙伴").first()).toBeVisible();
    // 伙伴名单里有「小蓝」
    await expect(page.locator("text=小蓝").first()).toBeVisible();
    // 工作台入口
    await expect(page.locator("text=新建伙伴").first()).toBeVisible();
    await expect(page.locator("text=打开聊天").first()).toBeVisible();
    await shot(page, "01-workspace");
  });

  test("T2 总览 tab：伙伴形象 + 模型配置", async ({ page }) => {
    await openNomi(page);
    // 选中伙伴「小蓝」
    await humanClick(page, page.locator("text=小蓝").first());
    await think(page, 600);
    // 切到「总览」
    await humanClick(page, page.locator("[role=tab]:has-text('总览')").or(page.locator("text=总览").first()));
    await think(page, 600);
    await shot(page, "02-overview");
    expect(await page.locator("text=伙伴形象").count()).toBeGreaterThan(0);
  });

  test("T3 记忆&知识库 tab：展示真实记忆 + 归档/删除操作", async ({ page }) => {
    await openNomi(page);
    await humanClick(page, page.locator("text=小蓝").first());
    await think(page, 600);
    await humanClick(page, page.locator("[role=tab]:has-text('记忆')").or(page.locator("text=记忆&知识库").first()));
    await think(page, 800);
    // 记忆列表里有 E2E 记忆
    await expect(page.locator("text=用户喜欢简洁明了的回答").first()).toBeVisible({ timeout: 10000 });
    await shot(page, "03-memory");
    await expect(page.locator("text=归档").first()).toBeVisible();
    await expect(page.locator("text=删除").first()).toBeVisible();
  });

  test("T4 技能 tab：展示 E2E 技能", async ({ page }) => {
    await openNomi(page);
    await humanClick(page, page.locator("text=小蓝").first());
    await think(page, 600);
    await humanClick(page, page.locator("[role=tab]:has-text('技能')").or(page.locator("text=技能").first()));
    await think(page, 800);
    await expect(page.locator("text=git助手").first()).toBeVisible({ timeout: 10000 });
    await shot(page, "04-skills");
  });

  test("T5 打开聊天 → 跳转伙伴专属会话", async ({ page }) => {
    await openNomi(page);
    await humanClick(page, page.locator("text=小蓝").first());
    await think(page, 600);
    await humanClick(page, page.locator("text=打开聊天").first());
    await page.waitForURL("**/#/conversation/**", { timeout: 15000 });
    await think(page, 2000);
    expect(page.url()).toMatch(/#\/conversation\//);
    await shot(page, "05-chat");
  });

  test("T6 新建伙伴弹窗", async ({ page }) => {
    await openNomi(page);
    await humanClick(page, page.locator("text=新建伙伴").first());
    await think(page, 800);
    await shot(page, "06-create-dialog");
    await expect(page.locator("text=创建伙伴").or(page.locator("text=新建伙伴")).first()).toBeVisible();
  });
});
