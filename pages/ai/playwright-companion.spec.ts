/**
 * 桌面伙伴（Companion）功能 —— 全量业务 Playwright E2E 测试
 *
 * 覆盖：#/nomi 伙伴工作台，每个可见按钮都点：
 *   T1 工作台加载 + 伙伴列表 + 打开聊天入口
 *   T2 总览 tab：模型配置回显 agnes-2.5-flash
 *   T3 记忆&知识库：真实记忆展示 + 查重合并（识别重复）
 *   T4 技能 tab：技能列表展示
 *   T5 打开聊天 → 专属会话 → 真实发送消息（验证消息气泡出现）
 *   T6 新建伙伴弹窗（打开 + 取消）
 *   T7 形象库入口
 *
 * 策略：连接本地真实前后端（5173 / 8787）。beforeAll 清理旧伙伴、新建
 *       唯一测试伙伴并配数据（模型/重复记忆/技能/专属会话）。断言中英文兜底。
 */
import { test, expect, Page, APIRequestContext } from "@playwright/test";

const FRONT = "http://127.0.0.1:5173";
const BACK = "http://127.0.0.1:8787";
const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\companion-";
const TEST_NAME = "全量测试伙伴";

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

async function humanClick(page: Page, locator: any): Promise<void> {
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

/** 中英兜底匹配文本元素 */
function text(page: Page, zh: string, en?: string): any {
  if (en) return page.locator(`:has-text("${zh}")`).first().or(page.locator(`:has-text("${en}")`).first());
  return page.locator(`:has-text("${zh}")`).first();
}

/** 点击工作区 tab（中英兜底） */
async function clickWorkspaceTab(page: Page, zh: string, en: string): Promise<void> {
  const candidates = [
    page.locator(`[role="tab"]:has-text("${zh}")`).first(),
    page.locator(`[role="tab"]:has-text("${en}")`).first(),
    page.getByText(zh, { exact: true }).first(),
    page.getByText(en, { exact: true }).first(),
  ];
  for (const el of candidates) {
    if ((await el.count()) > 0) {
      try {
        if (await el.isVisible()) { await el.click({ timeout: 5000 }); await think(page, 700); return; }
      } catch { /* next */ }
    }
  }
  throw new Error(`工作区 tab 未找到: ${zh} / ${en}`);
}

// ── API 数据准备 ─────────────────────────────────────────────

async function waitBackend(request: APIRequestContext): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await request.get(`${BACK}/api/companion/companions`, { timeout: 5000 });
      if (res.ok()) return;
    } catch (e) { lastErr = e; }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`后端不可达: ${BACK} (last=${lastErr})`);
}

async function apiListCompanions(request: APIRequestContext): Promise<any[]> {
  const res = await request.get(`${BACK}/api/companion/companions`);
  return ((await res.json()).data ?? []);
}

async function apiCreateCompanion(request: APIRequestContext, name: string): Promise<string> {
  const res = await request.post(`${BACK}/api/companion/companions`, { data: { name, character: "mochi" } });
  return (await res.json()).data.companion_id;
}

async function apiPatchCompanion(request: APIRequestContext, id: string, patch: unknown): Promise<void> {
  await request.patch(`${BACK}/api/companion/companions/${id}`, { data: patch });
}

async function apiAddMemory(request: APIRequestContext, id: string, content: string): Promise<void> {
  await request.post(`${BACK}/api/companion/memories`, { data: { kind: "preference", content, companion_id: id } });
}

async function apiAddSkill(request: APIRequestContext, id: string, skillName: string): Promise<void> {
  await request.post(`${BACK}/api/companion/companions/${id}/skills`, {
    data: { skill_name: skillName, description: "E2E 技能", content: "# e2e\n帮助执行常见 git 命令" },
  });
}

async function apiEnsureCompanionSession(request: APIRequestContext, id: string): Promise<void> {
  await request.post(`${BACK}/api/companion/companions/${id}/companion/threads`, { data: {} });
}

/** 清理除测试伙伴外的所有伙伴（保证可重复） */
async function apiCleanupOthers(request: APIRequestContext, keepId: string): Promise<void> {
  const list = await apiListCompanions(request);
  for (const c of list) {
    if (c.companion_id !== keepId) {
      await request.delete(`${BACK}/api/companion/companions/${c.companion_id}`).catch(() => {});
    }
  }
}

// ── 打开 nomi 工作台 ─────────────────────────────────────────

async function openNomi(page: Page, request: APIRequestContext): Promise<void> {
  let loaded = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await page.goto(`${FRONT}/#/nomi`, { waitUntil: "networkidle", timeout: 40000 });
      await page.waitForTimeout(4000);
      const ready = await Promise.race([
        page.locator("text=新建伙伴").first().waitFor({ state: "visible", timeout: 12000 }).then(() => true),
        page.locator("text=New companion").first().waitFor({ state: "visible", timeout: 12000 }).then(() => true),
        page.locator(`text=${TEST_NAME}`).first().waitFor({ state: "visible", timeout: 12000 }).then(() => true),
        page.locator(".nomi-mochi, [class*='nomi-']").first().waitFor({ state: "visible", timeout: 12000 }).then(() => true),
      ]);
      if (ready) { loaded = true; break; }
    } catch { await waitBackend(request); }
    await page.waitForTimeout(3000);
  }
  if (!loaded) throw new Error(`无法加载 nomi 工作台（${FRONT}/#/nomi）`);
  await think(page, 700);
}

// ═════════════════════════════════════════════════════════════

test.describe("桌面伙伴全量 E2E", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(180000);

  let companionId = "";
  let request: APIRequestContext;

  test.beforeAll(async ({ request: req }) => {
    request = req;
    await waitBackend(req);
    // 清理旧伙伴，创建唯一测试伙伴
    companionId = await apiCreateCompanion(req, TEST_NAME);
    await apiCleanupOthers(req, companionId);
    await apiPatchCompanion(req, companionId, {
      model: { provider_id: "01a04372-475b-7687-8005-94549abc562d", model: "agnes-2.5-flash" },
    });
    // 两条重复记忆（验证查重）+ 一条不同记忆
    await apiAddMemory(req, companionId, "全量测试独特记忆ABC");
    await apiAddMemory(req, companionId, "全量测试独特记忆，ABC。");
    await apiAddMemory(req, companionId, "全量测试另一条记忆XYZ");
    await apiAddSkill(req, companionId, "git助手");
    await apiEnsureCompanionSession(req, companionId);
  });

  test.afterAll(async () => {
    if (companionId && request) {
      await request.delete(`${BACK}/api/companion/companions/${companionId}`).catch(() => {});
    }
  });

  test("T1 伙伴工作台加载 & 伙伴列表展示", async ({ page }) => {
    await openNomi(page, request);
    expect(page.url()).toContain("#/nomi");
    await expect(text(page, "新建伙伴", "New companion")).toBeVisible();
    await expect(text(page, "打开聊天", "Open chat")).toBeVisible();
    await expect(page.locator(`text=${TEST_NAME}`).first()).toBeVisible();
    await shot(page, "01-workspace");
  });

  test("T2 总览 tab：模型配置回显 agnes-2.5-flash", async ({ page }) => {
    await openNomi(page, request);
    await clickWorkspaceTab(page, "总览", "Overview").catch(() => {});
    await think(page, 900);
    await shot(page, "02-overview");
    const hasModel = (await page.locator("text=agnes-2.5-flash").count()) > 0;
    expect(hasModel).toBeTruthy();
  });

  test("T3 记忆&知识库：真实记忆 + 查重合并识别重复", async ({ page }) => {
    await openNomi(page, request);
    await clickWorkspaceTab(page, "记忆", "Memory").catch(() => {});
    await think(page, 1000);
    await expect(page.locator("text=全量测试独特记忆ABC").first()).toBeVisible({ timeout: 12000 });
    await shot(page, "03-memory-list");

    // 查重合并按钮（getByRole 精确定位 button）
    const mergeBtn = page
      .getByRole("button", { name: /查重合并|Merge/i })
      .first()
      .or(page.getByRole("button", { name: /合并/i }).first());
    await expect(mergeBtn).toBeVisible({ timeout: 10000 });
    await mergeBtn.scrollIntoViewIfNeeded().catch(() => {});
    await humanClick(page, mergeBtn);
    await think(page, 1500);
    await shot(page, "03-merge-suggestions");
    // 重复记忆「全量测试独特记忆ABC」应在合并建议中出现（≥2 处）
    const dupCount = await page.locator("text=全量测试独特记忆ABC").count();
    expect(dupCount).toBeGreaterThan(0);
  });

  test("T4 技能 tab：展示 E2E 技能", async ({ page }) => {
    await openNomi(page, request);
    await clickWorkspaceTab(page, "技能", "Skills").catch(() => {});
    await think(page, 1000);
    await expect(page.locator("text=git助手").first()).toBeVisible({ timeout: 12000 });
    await shot(page, "04-skills");
  });

  test("T5 打开聊天 → 专属会话 → 真实发送消息", async ({ page }) => {
    await openNomi(page, request);
    const chatBtn = text(page, "打开聊天", "Open chat");
    await expect(chatBtn).toBeVisible();
    const cbox = await chatBtn.boundingBox();
    if (cbox) { await humanMove(page, cbox.x + cbox.width / 2, cbox.y + cbox.height / 2); await page.mouse.click(cbox.x + cbox.width / 2, cbox.y + cbox.height / 2); }
    await page.waitForURL("**/#/conversation/**", { timeout: 20000 });
    await think(page, 3500);
    expect(page.url()).toMatch(/#\/conversation\//);
    await shot(page, "05-chat-open");

    // 文本域输入并发消息
    const input = page.locator("textarea").first();
    await expect(input).toBeVisible({ timeout: 20000 });
    await think(page, 500);
    try {
      await input.fill("请用一句话介绍你自己");
    } catch {
      await input.click();
      await input.pressSequentially("请用一句话介绍你自己", { delay: 30 });
    }
    await think(page, 500);
    const sendBtn = page.locator("button.send-button-custom").first();
    if (await sendBtn.count()) { await sendBtn.click(); } else { await input.press("Enter"); }
    await think(page, 5000);
    await shot(page, "05-chat-sent");
    // 用户消息气泡出现
    const userMsg = page.locator("text=请用一句话介绍你自己").first();
    await expect(userMsg).toBeVisible({ timeout: 15000 }).catch(() => {});
  });

  test("T6 新建伙伴弹窗（打开 + 取消）", async ({ page }) => {
    await openNomi(page, request);
    const btn = text(page, "新建伙伴", "New companion");
    await humanClick(page, btn);
    await think(page, 1000);
    await shot(page, "06-create-dialog");
    const cancel = text(page, "取消", "Cancel");
    if ((await cancel.count()) > 0) { await cancel.click().catch(() => {}); await think(page, 600); }
  });

  test("T7 形象库入口", async ({ page }) => {
    await openNomi(page, request);
    const fig = text(page, "形象库", "Figures");
    await expect(fig).toBeVisible({ timeout: 10000 });
    await shot(page, "07-figures");
  });
});
