/**
 * 回归探针：确认本轮「时间列选择器」改动没有破坏此前三项需求。
 *
 * <p>只查三件事：ER 三栏工作区、设计表注释列的专注图标、导入向导圆角。
 * 环境会被重置（库/表名会变），所以这里不写死表名，取当前 hotsport 里第一张表。</p>
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = process.env.MS_APP || "http://127.0.0.1:8848";
const DB = "hotsport";
const OUT = process.env.TEMP || ".";
const LOG = path.join(OUT, "regress-probe.log");

let pass = 0;
let fail = 0;
function log(s) {
  fs.appendFileSync(LOG, s + "\n", "utf8");
  process.stdout.write(s + "\n");
}
function check(name, ok, detail = "") {
  if (ok) pass++;
  else fail++;
  log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  [" + detail + "]" : ""}`);
}

async function markNode(page, label, cls) {
  for (let i = 0; i < 80; i++) {
    const state = await page.evaluate(
      ({ label, cls }) => {
        document.querySelectorAll("[data-vfy]").forEach((e) => e.removeAttribute("data-vfy"));
        const hit = [...document.querySelectorAll(cls)].find(
          (e) => ((e.querySelector(".dbm-tree-label") || {}).textContent || "").trim() === label,
        );
        if (hit) {
          hit.setAttribute("data-vfy", "hit");
          hit.scrollIntoView({ block: "center" });
          return "found";
        }
        const tree = document.querySelector(".dbm-tree");
        let sc = tree;
        while (sc && sc !== document.body) {
          const st = getComputedStyle(sc);
          if (/(auto|scroll)/.test(st.overflowY) && sc.scrollHeight > sc.clientHeight + 4) break;
          sc = sc.parentElement;
        }
        if (sc && sc !== document.body) {
          sc.scrollTop += Math.max(200, Math.round(sc.clientHeight * 0.8));
          return "scroll";
        }
        return "nostop";
      },
      { label, cls },
    );
    if (state === "found") return true;
    await page.waitForTimeout(200);
  }
  return false;
}

async function dismiss(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);
  await page
    .evaluate(() => document.querySelectorAll(".dbm-context-menu").forEach((e) => e.remove()))
    .catch(() => {});
  await page.waitForTimeout(200);
}

/** 右键某个已标记节点，点菜单项 */
async function openMenu(page, itemText) {
  await dismiss(page);
  await page.locator('[data-vfy="hit"]').first().click({ button: "right" });
  await page.waitForTimeout(1500);
  const item = page.locator(".dbm-context-item", { hasText: itemText }).first();
  if ((await item.count()) === 0) return false;
  await item.click();
  await page.waitForTimeout(3000);
  return true;
}

(async () => {
  fs.writeFileSync(LOG, "", "utf8");
  log("回归探针 " + new Date().toISOString());
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
  try {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(15000);
    await page.locator('input[placeholder*="用户名"]').first().fill("admin");
    await page.locator('input[type="password"]').first().fill("Admin@123");
    await page.locator('button:has-text("登录")').first().click();
    await page.waitForFunction(() => !location.hash.includes("/login"), null, { timeout: 120000 });
    await page.goto(BASE + "/#/db-manager", { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(8000);
    log("登录完成");

    // 展开 hotsport，取第一张表
    const dbOk = await markNode(page, DB, ".dbm-tree-node");
    check("树里能找到库 " + DB, dbOk);
    if (!dbOk) throw new Error("找不到库 " + DB);

    // 库节点是单击切换展开，可能本来就是展开的 —— 点击后复查，必要时来回切换
    let firstTable = null;
    for (let i = 0; i < 5 && !firstTable; i++) {
      const has = await page.evaluate(() => document.querySelectorAll(".dbm-table-node").length);
      if (!has) {
        const ok = await markNode(page, DB, ".dbm-tree-node");
        if (!ok) break;
        await page.locator('[data-vfy="hit"]').first().click();
        await page.waitForTimeout(4000);
      }
      firstTable = await page.evaluate(() => {
        const t = [...document.querySelectorAll(".dbm-table-node")].find(
          (e) => ((e.querySelector(".dbm-tree-label") || {}).textContent || "").trim() !== "",
        );
        if (!t) return null;
        t.setAttribute("data-vfy", "hit");
        return (t.querySelector(".dbm-tree-label") || {}).textContent.trim();
      });
    }
    check("树里有表节点", !!firstTable, firstTable || "");
    if (!firstTable) throw new Error("没有表节点");

    // ---- 1. ER 三栏工作区 ----
    const erOpened = await openMenu(page, "ER 图");
    check("右键「ER 图」菜单可用", erOpened);
    if (erOpened) {
      await page.waitForTimeout(3000);
      const er = await page.evaluate(() => ({
        wrap: !!document.querySelector(".erw"),
        rail: !!document.querySelector(".erw-rail"),
        canvas: !!document.querySelector(".erw-canvas"),
        insp: !!document.querySelector(".erw-insp"),
        radius: (() => {
          const r = document.querySelector(".erw-rail");
          return r ? getComputedStyle(r).borderRadius : "";
        })(),
      }));
      check("ER 三栏都在（清单/画布/检查器）", er.rail && er.canvas && er.insp, JSON.stringify(er));
      check("ER 左栏圆角 12px", er.radius === "12px", er.radius);
      await page.screenshot({ path: path.join(OUT, "regress-er.png") });
      await dismiss(page);
      // 关掉 ER 弹窗
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(1200);
    }

    // ---- 2. 设计表注释列的专注图标 ----
    const marked = await markNode(page, firstTable, ".dbm-table-node");
    check("重新定位表节点", marked);
    if (marked) {
      const designOpened = await openMenu(page, "设计表");
      check("右键「设计表」可用", designOpened);
      if (designOpened) {
        await page.waitForTimeout(4000);
        const focus = await page.evaluate(() => ({
          commentCells: document.querySelectorAll(".dcg-comment").length,
          icons: document.querySelectorAll(".dcg-comment .rm-input__focus").length,
        }));
        check("注释列存在", focus.commentCells > 0, `注释格=${focus.commentCells}`);
        check("注释列输入框内有专注图标", focus.icons > 0, `图标数=${focus.icons}`);
        if (focus.icons > 0) {
          await page.locator(".dcg-comment .rm-input__focus").first().click();
          await page.waitForTimeout(1500);
          const panel = await page.evaluate(() => ({
            panel: !!document.querySelector(".rm-focus-panel"),
            textarea: !!document.querySelector(".rm-focus-textarea"),
          }));
          check("点图标弹出专注编辑层", panel.panel && panel.textarea, JSON.stringify(panel));
          await page.screenshot({ path: path.join(OUT, "regress-focus.png") });
          await dismiss(page);
        }
      }
    }

    // ---- 3. 导入向导圆角 ----
    const marked2 = await markNode(page, firstTable, ".dbm-table-node");
    if (marked2) {
      const iwOpened = await openMenu(page, "导入数据");
      check("右键「导入数据」可用", iwOpened);
      if (iwOpened) {
        await page.waitForTimeout(3000);
        // 两处圆角分属不同步骤：类型卡 `.iw-type` 只在第 1 步（step === 0）渲染，
        // 拖拽区 `.iw-file-box` 只在第 2 步（step === 1）渲染。
        // 一次 evaluate 同时读必然有一条是空字符串 —— 分两次、按步骤量。
        const radiusOf = (sel) => page.evaluate((sel) => {
          const e = document.querySelector(sel);
          return e ? getComputedStyle(e).borderRadius : "";
        }, sel);

        const typeRadius = await radiusOf(".iw-type");
        const nextBtn = page.locator('.iw-footer button:has-text("下一步")').first();
        if (await nextBtn.count()) {
          await nextBtn.click();
          await page.waitForTimeout(1500);
        }
        const fileBoxRadius = await radiusOf(".iw-file-box");

        check("导入类型卡圆角 12px", typeRadius === "12px", typeRadius);
        check("导入拖拽区圆角 12px", fileBoxRadius === "12px", fileBoxRadius);
        await page.screenshot({ path: path.join(OUT, "regress-import.png") });
        await dismiss(page);
      }
    }
  } catch (e) {
    fail++;
    log("EXCEPTION " + (e && e.stack ? e.stack : String(e)));
    await page.screenshot({ path: path.join(OUT, "regress-exc.png") }).catch(() => {});
  } finally {
    log(`\n===== 汇总 PASS=${pass} FAIL=${fail} =====`);
    await browser.close();
  }
})();
