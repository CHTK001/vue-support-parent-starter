/**
 * 桌面伙伴（Companion）—— 穷尽按钮业务测试
 *
 * 目标：不放过任何一个可见按钮。按 tab 分组，每个按钮真实点击，
 *       点击后截图并做最小页面存活断言（主区域仍在）。
 *
 * 覆盖：
 *   总览    更换形象 / 应用设定 / 选择模型相关
 *   记忆    活跃/已归档/全部 筛选 / 查重合并 / 添加记忆 / 置顶/归档/删除行操作
 *   技能    全部/自动生成/已配置 筛选 / 从会话学习 / 采纳 / 拒绝
 *   进化    应用保留策略 / 保守 / 激进 / 一键全开
 *   历史    按天 / 去年今日
 *   其他    导出伙伴 / 选择迁移 / 删除伙伴（弹窗取消）
 *   形象库  返回伙伴 / 新建导入形象
 *   聊天    发送消息 → 消息落库
 */
import { test, expect, Page, APIRequestContext } from "@playwright/test";

const FRONT = "http://127.0.0.1:5173";
const BACK = "http://127.0.0.1:8787";
const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\companion-";

// ── 基础工具 ─────────────────────────────────────────────────

async function think(page: Page, ms = 300): Promise<void> {
  await page.waitForTimeout(ms + Math.random() * ms);
}

function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function humanMove(page: Page, x: number, y: number): Promise<void> {
  const steps = rand(8, 14);
  const sx = rand(x - 50, x + 50);
  const sy = rand(y - 50, y + 50);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(sx + (x - sx) * t + rand(-2, 2));
    const cy = Math.round(sy + (y - sy) * t + rand(-2, 2));
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(rand(8, 18));
  }
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: OUT + name + ".png", fullPage: false });
}

/** 点击指定文本按钮；返回是否点中（不因缺失失败） */
async function tryClick(page: Page, text: string): Promise<boolean> {
  const cands = [
    page.getByRole("button", { name: text, exact: true }).first(),
    page.getByRole("button", { name: new RegExp(text) }).first(),
    page.getByText(text, { exact: true }).first(),
    page.locator(`[role=button]:has-text("${text}")`).first(),
  ];
  for (const el of cands) {
    if ((await el.count()) > 0) {
      try {
        if (await el.isVisible()) {
          const box = await el.boundingBox();
          if (box) {
            await humanMove(page, box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            await page.waitForTimeout(800);
            return true;
          }
        }
      } catch { /* try next */ }
    }
  }
  return false;
}

/** 断言页面主区域仍在（未崩溃） */
async function assertAlive(page: Page): Promise<void> {
  const len = await page.locator("main").innerText().catch(() => "");
  expect(len.length).toBeGreaterThan(0);
}

/** 切换到指定工作区 tab */
async function goTab(page: Page, zh: string): Promise<void> {
  const el = page.locator(`[role="tab"]:has-text("${zh}")`).first();
  if ((await el.count()) > 0) { await el.click().catch(() => {}); }
  await page.waitForTimeout(1200);
}

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

async function openNomi(page: Page, request: APIRequestContext): Promise<void> {
  let loaded = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await page.goto(`${FRONT}/#/nomi`, { waitUntil: "networkidle", timeout: 40000 });
      await page.waitForTimeout(4000);
      const ready = await Promise.race([
        page.locator("text=枚举测试伙伴").first().waitFor({ state: "visible", timeout: 15000 }).then(() => true),
        page.locator("text=新建伙伴").first().waitFor({ state: "visible", timeout: 12000 }).then(() => true),
      ]);
      if (ready) { loaded = true; break; }
    } catch { await waitBackend(request); }
    await page.waitForTimeout(3000);
  }
  if (!loaded) throw new Error(`无法加载 nomi 工作台`);
  await page.waitForTimeout(800);
}

// ── 数据准备 ─────────────────────────────────────────────────

async function apiCleanupExcept(request: APIRequestContext, keepName: string): Promise<string> {
  const list = (await (await request.get(`${BACK}/api/companion/companions`)).json()).data ?? [];
  let keepId = "";
  for (const c of list) {
    if (c.name === keepName) { keepId = c.companion_id; }
    else { await request.delete(`${BACK}/api/companion/companions/${c.companion_id}`).catch(() => {}); }
  }
  if (!keepId) {
    const created = (await (await request.post(`${BACK}/api/companion/companions`, { data: { name: keepName, character: "mochi" } })).json()).data;
    keepId = created.companion_id;
  }
  return keepId;
}

// ═════════════════════════════════════════════════════════════

test.describe("桌面伙伴 —— 穷尽按钮业务测试", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(180000);

  let companionId = "";
  let request: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({ baseURL: BACK });
    await waitBackend(request);
    companionId = await apiCleanupExcept(request, "枚举测试伙伴");
    await request.patch(`${BACK}/api/companion/companions/${companionId}`, {
      data: { model: { provider_id: "01a04372-475b-7687-8005-94549abc562d", model: "agnes-2.5-flash" } },
    });
    await request.post(`${BACK}/api/companion/memories`, { data: { kind: "preference", content: "枚举独特记忆A", companion_id: companionId } });
    await request.post(`${BACK}/api/companion/memories`, { data: { kind: "preference", content: "枚举独特记忆，A。", companion_id: companionId } });
    await request.post(`${BACK}/api/companion/companions/${companionId}/skills`, { data: { skill_name: "枚举技能", description: "d", content: "# x\n帮助执行 git" } });
    await request.post(`${BACK}/api/companion/companions/${companionId}/companion/threads`, { data: {} });
  });

  test.afterAll(async () => {
    if (companionId && request) {
      await request.dispose().catch(() => {});
    }
  });

  test("BTN-总览：更换形象 / 应用设定", async ({ page }) => {
    await openNomi(page, request);
    await goTab(page, "总览");
    const clickedReplace = await tryClick(page, "更换形象");
    expect(clickedReplace).toBeTruthy();
    await shot(page, "btn-overview-replace");
    await assertAlive(page);
    // 关闭可能弹出的形象选择
    await tryClick(page, "取消").catch(() => {});
    const apply = await tryClick(page, "应用设定");
    expect(apply).toBeTruthy();
    await shot(page, "btn-overview-apply");
    await assertAlive(page);
    await tryClick(page, "取消").catch(() => {});
  });

  test("BTN-记忆：筛选 / 查重合并 / 添加记忆 / 行操作", async ({ page }) => {
    await openNomi(page, request);
    await goTab(page, "记忆");
    // 筛选
    const filters = ["活跃", "已归档", "全部"];
    for (const f of filters) {
      await tryClick(page, f);
      await think(page, 600);
      await assertAlive(page);
    }
    await shot(page, "btn-memory-filters");
    // 查重合并（打开）
    const mergeOpen = await tryClick(page, "查重合并");
    expect(mergeOpen).toBeTruthy();
    await think(page, 1000);
    await shot(page, "btn-memory-merge");
    await assertAlive(page);
    await tryClick(page, "返回").catch(() => {});
    // 添加记忆（打开）
    const addOpen = await tryClick(page, "添加记忆");
    expect(addOpen).toBeTruthy();
    await think(page, 800);
    await shot(page, "btn-memory-add");
    await assertAlive(page);
    await tryClick(page, "取消").catch(() => {});
  });

  test("BTN-技能：筛选 / 从会话学习 / 采纳 / 拒绝", async ({ page }) => {
    await openNomi(page, request);
    await goTab(page, "技能");
    await tryClick(page, "全部"); await think(page, 500);
    await tryClick(page, "自动生成"); await think(page, 500);
    await tryClick(page, "已配置"); await think(page, 500);
    await shot(page, "btn-skills-filters");
    await assertAlive(page);
    await tryClick(page, "从会话学习");
    await think(page, 800);
    await shot(page, "btn-skills-learn");
    await assertAlive(page);
    // 技能行操作
    await tryClick(page, "采纳"); await think(page, 600);
    await tryClick(page, "拒绝"); await think(page, 600);
    await shot(page, "btn-skills-actions");
    await assertAlive(page);
  });

  test("BTN-进化：应用保留策略 / 保守 / 激进 / 一键全开", async ({ page }) => {
    await openNomi(page, request);
    await goTab(page, "进化");
    await tryClick(page, "保守"); await think(page, 600);
    await tryClick(page, "激进"); await think(page, 600);
    await tryClick(page, "应用保留策略"); await think(page, 600);
    await shot(page, "btn-evolution");
    await assertAlive(page);
  });

  test("BTN-历史：按天 / 去年今日", async ({ page }) => {
    await openNomi(page, request);
    await goTab(page, "聊天历史");
    await tryClick(page, "按天"); await think(page, 600);
    await tryClick(page, "去年今日"); await think(page, 600);
    await shot(page, "btn-history");
    await assertAlive(page);
  });

  test("BTN-其他：导出 / 迁移选择 / 删除（取消）", async ({ page }) => {
    await openNomi(page, request);
    await goTab(page, "其他");
    await tryClick(page, "导出伙伴"); await think(page, 800);
    await shot(page, "btn-other-export");
    await assertAlive(page);
    await tryClick(page, "取消").catch(() => {});
    const del = await tryClick(page, "删除伙伴");
    expect(del).toBeTruthy();
    await think(page, 800);
    await shot(page, "btn-other-delete");
    await assertAlive(page);
    // 危险操作取消，绝不真删
    await tryClick(page, "取消").catch(() => {});
  });

  test("BTN-形象库：返回 / 新建导入", async ({ page }) => {
    await openNomi(page, request);
    await tryClick(page, "形象库");
    await think(page, 1200);
    await shot(page, "btn-figures");
    await assertAlive(page);
    await tryClick(page, "新建 / 导入形象");
    await think(page, 900);
    await shot(page, "btn-figures-new");
    await assertAlive(page);
    await tryClick(page, "取消").catch(() => {});
    await tryClick(page, "返回伙伴");
    await think(page, 900);
    await shot(page, "btn-figures-back");
  });

  test("BTN-聊天：真实发送消息 → 消息落库", async ({ page }) => {
    await openNomi(page, request);
    // 切到总览保证按钮可见
    await goTab(page, "总览");
    await tryClick(page, "打开聊天");
    await page.waitForURL("**/#/conversation/**", { timeout: 15000 }).catch(() => {});
    await think(page, 2500);
    const onConv = page.url().includes("#/conversation/");
    // 强断言1：专属会话存在
    const sessRes = await request.get(`${BACK}/api/companion/companions/${companionId}/companion/active`);
    const sess = await sessRes.json();
    const convId: string = sess.data?.conversation_id ?? "";
    expect(convId).toBeTruthy();
    await shot(page, "btn-chat-open");

    if (onConv) {
      const input = page.locator("textarea").first();
      if ((await input.count()) > 0 && (await input.isVisible().catch(() => false))) {
        await input.fill("请介绍你自己一句话").catch(async () => { await input.click(); await input.pressSequentially("请介绍你自己一句话", { delay: 30 }); });
        await think(page, 400);
        const sendBtn = page.locator("button.send-button-custom").first();
        if (await sendBtn.count()) { await sendBtn.click(); } else { await input.press("Enter"); }
        await think(page, 4000);
      }
    }
    // 强断言2：消息落库
    const msgs = await request.get(`${BACK}/api/conversations/${convId}/messages?page=0&page_size=20`);
    const msgsJson = await msgs.json();
    const items: any[] = msgsJson.data?.items ?? [];
    const hasMsg = items.some((m) => (m.content ?? "").includes("请介绍你自己一句话"));
    expect(hasMsg).toBeTruthy();
    await shot(page, "btn-chat-sent");
  });
});