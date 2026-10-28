/**
 * ReDialog 拖拽 —— 生产级验收。
 *
 * <p>需求原话：「ReDialog 为什么没法拖拽」。根因三叠：
 * ① default 主题的 {@code draggable} 默认 false（历史受控化，需显式传 true；
 *    2026-10-28 已改为默认 true「默认可拖」）；
 * ② element-plus 2.14 的 {@code useDraggable} 在 overflow=false 时把位移钳制进视口，
 *    弹窗略矮于视口时上限≈0，近满高弹窗拖不动 —— default 主题此前不透传
 *    {@code overflow}（koi 主题已修）；
 * ③ default 主题 headless 时把 {@code .el-dialog__header} 设为 display:none（且
 *    scoped 样式因 Teleport 根不带 scope id 从未命中过），而原生 draggable 的
 *    mousedown 恰好绑在 header 上，等于没有把手。</p>
 *
 * <p>本次修复（对齐 koi）：
 * - default {@code ReDialog} 新增强 {@code overflow} 三态 prop，未传时跟随 draggable；
 * - headless 拖拽热区 CSS 移入「非 scoped」样式块（ElDialog 根是 Teleport，
 *   Vue 不传 scope id，scoped :deep 从未命中）—— 44px 透明热区，不占内容高度；
 * - 拖拽结束后检查是否越出「保留区」，越界用官方 {@code resetPosition} 归零；
 * - {@code draggable} 默认值改为 {@code true}（2026-10-28 用户决策）：未传即可拖，
 *   显式 {@code :draggable="false"} 才不可拖 —— 两主题一致。</p>
 *
 * <p><b>验收在 /lab/re-dialog-drag 对照组页上真实拖拽</b>：
 * 未传 draggable 的普通弹窗做<b>正向</b>判别（默认可拖），显式
 * {@code :draggable="false"} 的弹窗做<b>负向</b>判别（不该被拖走），避免判据恒真。</p>
 *
 * <p><b>怎么跑</b>（需先构建 + 起产物在跑，本脚本不起服务）：</p>
 * <pre>
 * VITE_THEME_ID=default pnpm --filter vue-support-template-starter build
 * pnpm --filter vue-support-template-starter exec vite preview --port 4180
 * # 另开终端
 * $env:LAB_BASE_URL="http://127.0.0.1:4180"
 * pnpm --filter vue-support-template-starter accept:re-dialog-drag
 * </pre>
 * 退出码 0 = 全过（RE_DRAG_ALL_PASS），1 = 有 FAIL。
 *
 * @author CH
 * @since 2026-10-28
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { isBrowserGone, withTimeout } from "./lib/clickable-sweep.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(HERE, "..");

const BASE = process.env.LAB_BASE_URL || "http://127.0.0.1:8090";
const HASH = "/lab/re-dialog-drag";
const VIEWPORT = { width: 1560, height: 1000 };

let pass = 0;
let fail = 0;
const failures = [];

const check = (name, ok, detail = "") => {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? `  -> ${detail}` : ""}`);
  ok ? pass++ : fail++;
  if (!ok) failures.push(`${name}${detail ? `  -> ${detail}` : ""}`);
};

/** 当前可见弹窗（一次只开一个；teleport 到 body，用可见性过滤） */
const visibleDialog = () =>
  `(() => {
    const all = [...document.querySelectorAll(".el-dialog, .rm-dialog")];
    return all.find((d) => d.offsetParent !== null);
  })()`;

/**
 * 主题探测：按弹窗 class 判定。default 主题弹窗 class 含 `re-dialog`，
 * koi 含 `koi-dialog-shell`。必须在弹窗打开后调用（返回 "default" | "koi"）。
 */
function themeFromCls(cls) {
  return cls.includes("koi-dialog-shell") ? "koi" : "default";
}

const dialogState = (page) =>
  page.evaluate(() => {
    const d = [...document.querySelectorAll(".el-dialog, .rm-dialog")].find(
      (x) => x.offsetParent !== null,
    );
    if (!d) return null;
    const r = d.getBoundingClientRect();
    return {
      cls: d.className,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      transform: d.style.transform ?? "",
      left: d.style.left ?? "",
      top: d.style.top ?? "",
    };
  });

/** 打开一个弹窗（点 data-dd-open 按钮）并等它渲染可见 */
async function openDialog(page, key) {
  await page.locator(`[data-dd-open="${key}"]`).click();
  await page.waitForTimeout(700);
  const st = await dialogState(page);
  if (!st) throw new Error(`弹窗 ${key} 打开后未渲染`);
  return st;
}

/** 当前页结束后 reload 重置（modal 遮罩挡后续按钮，同 URL goto 不真正 reload） */
async function resetPage(page) {
  await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForSelector("[data-dd-open]", { timeout: 45000 });
  await page.waitForTimeout(400);
}

async function dragByMouse(page, fromX, fromY, dx, dy, steps = 10) {
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(fromX + (dx * i) / steps, fromY + (dy * i) / steps);
  }
  await page.mouse.up();
  await page.waitForTimeout(250);
}

async function run() {
  console.log(`ReDialog 拖拽验收  基址=${BASE}  路径=${HASH}`);
  const browser = await withTimeout(chromium.launch({ headless: true }), 120000, "启动浏览器会话");
  const page = await browser.newPage({ viewport: VIEWPORT });
  try {
    console.log("=== 1. 静态：渲染对照组页 ===");
    await page.goto(`${BASE}/#${HASH}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector(".ddl", { state: "attached", timeout: 45000 }).catch(async (e) => {
      if (isBrowserGone(e)) throw e;
      console.log("  [note] 首载超时，重载一次（Vite 预构建会整页 reload）");
      await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {});
      await page.waitForSelector(".ddl", { state: "attached", timeout: 45000 });
    });
    check("对照组页渲染出 6 个弹窗按钮", (await page.locator("[data-dd-open]").count()) >= 6);

    console.log("=== 2. 默认值契约：未传 draggable 默认可拖（正向）；显式 false 不可拖（负向） ===");
    const plain0 = await openDialog(page, "plain");
    const theme = themeFromCls(plain0.cls);
    check(`主题探测 => ${theme}（两主题产物下判据自适配）`, theme === "koi" || theme === "default", theme);
    check("plain 弹窗渲染可见（el-dialog 结构）", /el-dialog/.test(plain0.cls), plain0.cls.slice(0, 60));
    const plainCursor = await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      const hdr = d?.querySelector(".el-dialog__header");
      return hdr ? getComputedStyle(hdr).cursor : "n/a";
    });
    check("未传 draggable 时 header 有 move 光标（默认值=可拖）", plainCursor === "move", `cursor=${plainCursor}`);
    const phdr = await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      const hdr = d?.querySelector(".el-dialog__header");
      const r = hdr.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await dragByMouse(page, phdr.x + phdr.w / 2, phdr.y + phdr.h / 2, 160, 90);
    const plain1 = await dialogState(page);
    const plainMoved = Math.round(
      Math.abs(plain1.rect.x - plain0.rect.x) + Math.abs(plain1.rect.y - plain0.rect.y),
    );
    check("未传 draggable 的普通弹窗实际可拖（默认值=可拖）", plainMoved > 40, `位移 ${plainMoved}px`);
    await resetPage(page);

    console.log("=== 2b. 显式 :draggable=false 不可拖（负向判别，判据非恒真） ===");
    const nd0 = await openDialog(page, "nondrag");
    check("nondrag 弹窗渲染可见（el-dialog 结构）", /el-dialog/.test(nd0.cls), nd0.cls.slice(0, 60));
    const ndCursor = await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      const hdr = d?.querySelector(".el-dialog__header");
      return hdr ? getComputedStyle(hdr).cursor : "n/a";
    });
    check("显式 draggable=false 时 header 无 move 光标", ndCursor !== "move", `cursor=${ndCursor}`);
    const ndHdr = await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      const hdr = d?.querySelector(".el-dialog__header");
      const r = hdr.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await dragByMouse(page, ndHdr.x + ndHdr.w / 2, ndHdr.y + ndHdr.h / 2, 160, 90);
    const nd1 = await dialogState(page);
    const ndMoved = Math.round(
      Math.abs(nd1.rect.x - nd0.rect.x) + Math.abs(nd1.rect.y - nd0.rect.y),
    );
    check("显式 draggable=false 弹窗拖拽后位置不动（判别力）", ndMoved === 0, `位移 ${ndMoved}px`);
    await resetPage(page);

    console.log("=== 3. el 布局：拖拽产生 transform 位移 ===");
    const el0 = await openDialog(page, "el");
    const eHdr = await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      const r = d.querySelector(".el-dialog__header").getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await dragByMouse(page, eHdr.x + eHdr.w / 2, eHdr.y + eHdr.h / 2, 200, 120);
    const el1 = await dialogState(page);
    check("el draggable 弹窗拖拽后带 transform translate", /translate\(/.test(el1.transform), el1.transform);
    const elMoved = Math.round(
      Math.abs(el1.rect.x - el0.rect.x) + Math.abs(el1.rect.y - el0.rect.y),
    );
    check("el draggable 弹窗实际发生位移", elMoved > 50, `位移 ${elMoved}px`);
    await resetPage(page);

    console.log("=== 4. 近满高（此前拖不动的规格）：现在能拖 ===");
    const tall0 = await openDialog(page, "tall");
    check("近满高弹窗是目标规格（宽>1000，高≈视口高度）",
      tall0.rect.w > 1000 && tall0.rect.h > 0.85 * VIEWPORT.height,
      `${Math.round(tall0.rect.w)}×${Math.round(tall0.rect.h)}`);    const tHdr = await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      const r = d.querySelector(".el-dialog__header").getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await dragByMouse(page, tHdr.x + 60, tHdr.y + tHdr.h / 2, 120, 60);
    const tall1 = await dialogState(page);
    const tallMovedY = Math.round(Math.abs(tall1.rect.y - tall0.rect.y));
    check("近满高弹窗竖向能拖（overflow 放开钳制）", tallMovedY > 15, `竖向位移 ${tallMovedY}px`);
    await resetPage(page);

    console.log("=== 5. headless：44px 热区是把手 ===");
    const h0 = await openDialog(page, "headless");
    const hMeta = await page.evaluate((theme) => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      const hdr = d.querySelector(".el-dialog__header");
      // 热区条：default 用 .re-dialog__drag-strip，koi 用 .koi-dialog-header-drag
      const strip = theme === "koi"
        ? d.querySelector(".koi-dialog-header-drag")
        : d.querySelector(".re-dialog__drag-strip");
      const cs = getComputedStyle(hdr);
      return {
        pos: cs.position,
        h: cs.height,
        stripH: strip ? getComputedStyle(strip).height : "n/a",
        stripVisible: strip ? (strip.offsetParent !== null || getComputedStyle(strip).display !== "none") : false,
        headerVisible: hdr.offsetParent !== null,
      };
    }, theme);
    check("headless+draggable 渲染 44px 绝对定位热区 header",
      hMeta.pos === "absolute" && hMeta.h === "44px",
      `pos=${hMeta.pos} h=${hMeta.h}`);
    check("headless 热区条可见（不被 display:none 吃掉）",
      hMeta.stripVisible && hMeta.stripH === "44px",
      `stripH=${hMeta.stripH}`);
    check("headless 关闭按钮走 CloseFab 而非原生 x",
      (await page.locator(".re-dialog__close-fab").count()) === 1);
    await dragByMouse(page, h0.rect.x + h0.rect.w / 2, h0.rect.y + 10, 150, 80);
    const h1 = await dialogState(page);
    const hMoved = Math.round(Math.abs(h1.rect.y - h0.rect.y) + Math.abs(h1.rect.x - h0.rect.x));
    check("headless 弹窗经顶部热区拖动了", hMoved > 40, `位移 ${hMoved}px`);
    await resetPage(page);

    console.log("=== 6. modern 布局：自绘 left/top 拖拽（default）/ koi 回退 el-dialog 实拖 ===");
    await openDialog(page, "modern");
    const m0 = await dialogState(page);
    const mIsModern = m0.cls.includes("rm-dialog");
    if (theme === "koi") {
      // koi 不实现 modern 布局（index.ts 按主题加载，koi 仅 ElDialog 实现），
      // modern 按钮回退为 koi-dialog-shell —— 仍应默认可拖
      check("koi 下 modern 按钮回退为可拖的 koi-dialog-shell", /el-dialog/.test(m0.cls), m0.cls.slice(0, 70));
    } else {
      check("default 下 modern 按钮渲染 rm-dialog", mIsModern, m0.cls.slice(0, 50));
    }
    const mHdr = await page.evaluate(() => {
      const sel = ".rm-dialog:not([style*='display: none']), .el-dialog";
      const d = [...document.querySelectorAll(".rm-dialog, .el-dialog")].find((x) => x.offsetParent !== null);
      const hdr = d.querySelector(".rm-dialog__header, .el-dialog__header");
      const r = hdr.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await dragByMouse(page, mHdr.x + mHdr.w / 2, mHdr.y + mHdr.h / 2, 140, 90);
    const m1 = await dialogState(page);
    const mMoved = Math.round(Math.abs(m1.rect.y - m0.rect.y) + Math.abs(m1.rect.x - m0.rect.x));
    check("modern（或回退）弹窗实际位移", mMoved > 40, `${mMoved}px`);
    await resetPage(page);

    console.log("=== 7. 越界兜底：拖到视口外会 resetPosition 拉回 ===");
    await openDialog(page, "el");
    const eHdr2 = await page.evaluate(() => {
      const d = [...document.querySelectorAll(".el-dialog")].find((x) => x.offsetParent !== null);
      const r = d.querySelector(".el-dialog__header").getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await dragByMouse(page, eHdr2.x + eHdr2.w / 2, eHdr2.y + eHdr2.h / 2, VIEWPORT.width + 500, VIEWPORT.height + 500, 3);
    const afterLost = await dialogState(page);
    // resetPosition 兜底会把 transform 归零 —— 弹窗应回到初始位置（transform 清空）
    const nearInitial =
      afterLost &&
      Math.abs(afterLost.rect.x - 540) < 500 &&
      Math.abs(afterLost.rect.y - 120) < 500 &&
      afterLost.transform === "";
    check("拖出视口后弹窗仍抓得到且回到初始位置（resetPosition 兜底归零 transform）",
      !!nearInitial,
      afterLost
        ? `x=${Math.round(afterLost.rect.x)} y=${Math.round(afterLost.rect.y)} transform="${afterLost.transform}"`
        : "弹窗消失");
    await resetPage(page);

    console.log("=== 8. 源码契约：修复必须落在已提交源码 ===");
    const srcPath = path.resolve(APP_ROOT, "../../packages/ui/src/components/ReDialog/ReDialog.vue");
    const src = readFileSync(srcPath, "utf8");
    const koiPath = path.resolve(APP_ROOT, "../../packages/ui/src/components/ReDialog/theme/koi/ReDialog.vue");
    const koiSrc = readFileSync(koiPath, "utf8");
    const modernPath = path.resolve(APP_ROOT, "../../packages/ui/src/components/ReDialog/layouts/Modern.vue");
    const modernSrc = readFileSync(modernPath, "utf8");
    check("ReDialog.vue 透传 overflow 到 ElDialog", src.includes(':overflow="effectiveOverflow"'));
    check("ReDialog.vue 定义 overflow 三态跟随 draggable", src.includes("props.overflow ?? props.draggable"));
    check("ReDialog.vue 定义越界兜底 resetPosition", src.includes("resetPosition"));
    check("ReDialog.vue 定义 headless 44px 拖拽热区（非 scoped 块）",
      src.includes("re-dialog__drag-strip") && src.includes("height: 44px"));
    check("headless 热区在非 scoped 样式块（Teleport 根不带 scope id）：选择器不带 data-v 前缀",
      src.includes(".re-dialog--headless.re-dialog--draggable .el-dialog__header") &&
        src.includes(".re-dialog--headless .el-dialog__header {\n  display: none;"));
    check("Modern 布局拖拽已改 transform 位移（left/top 对非定位 .rm-dialog 无效）",
      modernSrc.includes("transform: `translate(") && modernSrc.includes("closest<HTMLElement>(\".rm-dialog\")"));
    check("default 主题 draggable 默认 true（默认可拖）", /draggable:\s*true/.test(src));
    check("koi 主题 draggable 默认 true（两主题一致）", /draggable:\s*true/.test(koiSrc));
  } finally {
    await browser.close();
  }

  console.log(`\nRE_DRAG 结果  PASS=${pass} FAIL=${fail}`);
  if (fail === 0) {
    console.log("RE_DRAG_ALL_PASS");
    process.exit(0);
  } else {
    console.error(failures.join("\n"));
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("验收异常:", e);
  process.exit(1);
});