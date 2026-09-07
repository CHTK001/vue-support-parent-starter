/**
 * 桌面伙伴（Companion）功能 Playwright E2E 测试
 *
 * 覆盖：#/nomi 伙伴工作台 —— 伙伴列表、总览、记忆&知识库、技能、
 *        打开聊天（专属会话跳转）、新建伙伴弹窗。
 *
 * 策略：连接本地真实前后端（前端 5173 / 后端 8787），先经后端 API
 *       准备稳定的伙伴数据，再逐屏验证并截图。
 */
import { test, expect, Page, APIRequestContext } from "@playwright/test";

const FRONT = "http://127.0.0.1:5173";
const BACK = "http://127.0.0.1:8787";
const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\companion-";

// ── 人类行为辅助 ─────────────────────────────────────────────

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

/** 找到工作区内的 tab 按钮并点击（避免匹配 icon 内联 style 噪声） */
async function clickWorkspaceTab(page: Page, text: string): Promise<void> {
  const tab = page.locator(`[data-testid="workspace-tab"]:has-text("${text}")`).first();
  const count = await tab.count();
  if (count > 0) {
    await tab.click({ timeout: 10000 });
    await think(page, 700);
    return;
  }
  // fallback：精确文本匹配的 tab 元素
  const el = page.locator(`[role="tab"]:text-is("${text}")`).first();
  const elCount = await el.count();
  if (elCount > 0) {
    await el.click({ timeout: 10000 });
    await think(page, 700);
    return;
  }
  throw new Error(`工作区 tab 未找到: ${text}`);
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: OUT + name + ".png", fullPage: false });
}

// ── API 数据准备 ─────────────────────────────────────────────

async function waitBackend(request: APIRequestContext): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < 25; i++) {
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
  await page.waitForTimeout(4500);
  // 等待工作台稳定（伙伴名单渲染）
  await expect(page.locator("text=小蓝").first()).toBeVisible({ timeout: 15000 });
}

// ═════════════════════════════════════════════════════════════

test.describe("桌面伙伴 E2E", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let companionId = "";
  let request: APIRequestContext;

  test.beforeAll(async ({ request: req }) => {
    request = req;
    await waitBackend(req);
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
    // 伙伴名单里有「小蓝」+ 状态
    await expect(page.locator("text=小蓝").first()).toBeVisible();
    // 工作台入口
    await expect(page.locator("text=新建伙伴").first()).toBeVisible();
    await expect(page.locator("text=打开聊天").first()).toBeVisible();
    await shot(page, "01-workspace");
  });

  test("T2 总览 tab：伙伴形象 + 设定", async ({ page }) => {
    await openNomi(page);
    await clickWorkspaceTab(page, "总览");
    await shot(page, "02-overview");
    await expect(page.locator("text=伙伴形象").first()).toBeVisible({ timeout: 10000 });
  });

  test("T3 记忆&知识库 tab：展示真实记忆 + 操作", async ({ page }) => {
    await openNomi(page);
    await clickWorkspaceTab(page, "记忆");
    await think(page, 800);
    await expect(page.locator("text=用户喜欢简洁明了的回答").first()).toBeVisible({ timeout: 10000 });
    await shot(page, "03-memory");
  });

  test("T4 技能 tab：展示 E2E 技能", async ({ page }) => {
    await openNomi(page);
    await clickWorkspaceTab(page, "技能");
    await think(page, 800);
    await expect(page.locator("text=git助手").first()).toBeVisible({ timeout: 10000 });
    await shot(page, "04-skills");
  });

  test("T5 打开聊天 → 跳转伙伴专属会话", async ({ page }) => {
    await openNomi(page);
    const chatBtn = page.locator("text=打开聊天").first();
    await expect(chatBtn).toBeVisible();
    const box = await chatBtn.boundingBox();
    if (box) {
      await humanMove(page, box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.waitForURL("**/#/conversation/**", { timeout: 20000 });
    await think(page, 2500);
    expect(page.url()).toMatch(/#\/conversation\//);
    await shot(page, "05-chat");
  });

  test("T6 新建伙伴弹窗", async ({ page }) => {
    await openNomi(page);
    const btn = page.locator("text=新建伙伴").first();
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    if (box) {
      await humanMove(page, box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await think(page, 900);
    await shot(page, "06-create-dialog");
  });
});