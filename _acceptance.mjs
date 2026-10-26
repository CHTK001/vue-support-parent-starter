import { chromium } from "playwright";

const OUT = "C:/Users/Administrator/AppData/Local/Temp/opencode";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const out = { steps: [], errors: [] };
page.on("pageerror", (e) => out.errors.push("PAGEERR " + String(e).slice(0, 300)));

// ===== 登录（带幂等确认） =====
let loggedIn = false;
for (let attempt = 0; attempt < 3 && !loggedIn; attempt++) {
  await page.goto("http://127.0.0.1:8848/#/login", { waitUntil: "domcontentloaded" });
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(10000);
    if ((await page.locator('input[placeholder="请输入用户名"]').count()) > 0) break;
  }
  if ((await page.locator('input[placeholder="请输入用户名"]').count()) === 0) continue;
  await page.locator('input[placeholder="请输入用户名"]').fill("admin");
  await page.locator('input[type="password"]').fill("admin123");
  await page.locator("button", { hasText: "登录" }).first().click();
  await page.waitForTimeout(12000);
  if (page.url().includes("home")) { loggedIn = true; out.steps.push({ at: "login", attempt, ok: true }); }
  else out.steps.push({ at: "login", attempt, ok: false, url: page.url() });
}
if (!loggedIn) { out.fatal = "login failed"; await browser.close(); console.log(JSON.stringify(out, null, 2)); process.exit(0); }
await page.waitForTimeout(3000);

// ===== 1. 图标 =====
const sprite = await page.evaluate(() => ({
  symbols: document.querySelectorAll("body symbol").length,
  pinned: document.getElementById("icon-koi-pinned") !== null,
}));
out.steps.push({ at: "sprite", ...sprite, ok: sprite.symbols > 0 && sprite.pinned });

const menuSvgs = page.locator(".el-menu svg, aside svg, [class*='aside'] svg");
let emptyM = 0; const totalM = await menuSvgs.count();
for (let i = 0; i < Math.min(totalM, 60); i++) { const b = await menuSvgs.nth(i).boundingBox().catch(() => null); if (!b || b.width === 0 || b.height === 0) emptyM++; }
out.steps.push({ at: "menu-icons", total: totalM, empty: emptyM, ok: totalM > 0 && emptyM === 0 });

const headerSvgs = page.locator("header svg, [class*='header'] svg");
let emptyH = 0; const totalH = await headerSvgs.count();
for (let i = 0; i < Math.min(totalH, 60); i++) { const b = await headerSvgs.nth(i).boundingBox().catch(() => null); if (!b || b.width === 0 || b.height === 0) emptyH++; }
out.steps.push({ at: "header-icons", total: totalH, empty: emptyH, ok: emptyH === 0 });
await page.screenshot({ path: `${OUT}/accept-home.png` });

// ===== 2. 同步日志页 =====
await page.goto("http://127.0.0.1:8848/#/sync-task-logs", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(7000);

out.steps.push({
  at: "hero-card",
  title: (await page.locator(".flow-title").innerText().catch(() => "")).replace(/\s+/g, " "),
  stat: (await page.locator(".flow-hero-stat").innerText().catch(() => "")).replace(/\s+/g, " "),
  badge: (await page.locator(".flow-badge").innerText().catch(() => "")).replace(/\s+/g, " "),
  ok: (await page.locator(".flow-hero").count()) > 0,
});
out.steps.push({
  at: "filter-card",
  taskSel: (await page.locator(".flow-filter-task").count()) > 0,
  seg: (await page.locator(".flow-seg").count()) > 0,
  triggerSel: (await page.locator(".flow-filter-trigger").count()) > 0,
  ok: (await page.locator(".flow-filters").count()) > 0,
});
const rows = await page.locator(".el-table__body tr, .re-table tbody tr, .vxe-body--row").count();
const headers = (await page.locator(".el-table__header th, .re-table thead th, .vxe-header--column").allInnerTexts().catch(() => [])).map((h) => h.replace(/\s+/g, " ").trim()).filter(Boolean);
out.steps.push({ at: "retable", rows, headers: headers.slice(0, 10), ok: rows > 0 });
out.steps.push({ at: "journey-mini", count: await page.locator(".flow-mini").count() });
out.steps.push({
  at: "cells",
  status: await page.locator(".flow-status").count(),
  trigger: await page.locator(".flow-trigger").count(),
  actionBtns: await page.locator('.flow-table button').count(),
});
out.steps.push({ at: "pager", text: (await page.locator(".el-pagination").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 60) });
await page.screenshot({ path: `${OUT}/accept-synclog.png` });

// ===== 3. 详情弹窗（会话 A，打开后截图即可，不继续点） =====
const viewBtn = page.locator('.flow-table button[aria-label="查看过程日志"], .flow-table button[aria-label="详情"]').first();
const hasViewBtn = (await viewBtn.count()) > 0;
out.steps.push({ at: "view-btn", found: hasViewBtn });
if (hasViewBtn) {
  await viewBtn.click();
  await page.waitForTimeout(3500);
  const dlg = page.locator(".el-dialog:visible").first();
  const lineCount = await dlg.locator(".flow-line-row").count();
  out.steps.push({
    at: "detail-dialog",
    journeyNodes: await dlg.locator(".flow-node").count(),
    lines: lineCount,
    summary: (await dlg.innerText()).replace(/\s+/g, " ").slice(0, 160),
    ok: lineCount > 0,
  });
  await page.screenshot({ path: `${OUT}/accept-synclog-detail.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
}

// ===== 4. 筛选（详情已关闭） =====
const segBtns = page.locator(".flow-seg label.el-segmented__item");
const segCount = await segBtns.count();
out.steps.push({ at: "seg-control", count: segCount });
if (segCount > 1) {
  await segBtns.nth(1).click();
  await page.waitForTimeout(3000);
  const rowsAfter = await page.locator(".el-table__body tr, .re-table tbody tr, .vxe-body--row").count();
  const statuses = (await page.locator(".flow-status").allInnerTexts()).map((x) => x.trim());
  out.steps.push({ at: "filter-success", rowsAfter, statuses: statuses.slice(0, 5), allSuccess: statuses.every((s) => s === "成功"), ok: rowsAfter > 0 && statuses.every((s) => s === "成功") });
  await page.screenshot({ path: `${OUT}/accept-filter.png` });
}

await browser.close();
console.log(JSON.stringify(out, null, 2));