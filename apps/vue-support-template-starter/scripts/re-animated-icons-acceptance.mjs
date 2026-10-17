#!/usr/bin/env node
/**
 * ReIcon / ReIconSelect 的 icons-animated 集成验收（跑在构建产物上）
 *
 * 覆盖：
 *  1) ReIcon 能渲染注册表里的全部 16 个动画图标（anim:<lib>:<icon>）
 *  2) size / color 两个 prop 真的作用到动画图标上
 *  3) hover 会触发动画（innerHTML 在悬停期间发生变化），移开后不报错
 *  4) 未注册的 anim: 名字走 Menu 兜底，而不是被当成 Iconify 名去解析
 *  5) ReIconSelect 的「动画」tab 列出全部 16 个；选中后回填完整名；
 *     再次打开时该图标高亮；清空按钮生效
 *  6) 全程无 pageerror / console.error
 *
 * 用法：
 *   pnpm --filter vue-support-template-starter build
 *   npx vite preview --port 4181 --strictPort        # 在 apps/vue-support-template-starter
 *   LAB_BASE_URL=http://127.0.0.1:4181 node scripts/re-animated-icons-acceptance.mjs
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const ANIMATED_DIR = join(HERE, "..", "..", "..", "packages", "ui", "src", "components", "ReIcon", "animated");

const BASE = (process.env.LAB_BASE_URL || "http://127.0.0.1:4181").replace(/\/+$/, "");
/** 当前产物用的主题：koi（仓库默认）或 default（兜底主题，也要验） */
const THEME = process.env.RE_THEME === "default" ? "default" : "koi";
const EXPECTED_ICONS = ["heroicons", "hugeicons", "phosphor", "tabler"].flatMap((lib) =>
  ["bell", "heart", "plus", "trash"].map((icon) => `anim:${lib}:${icon}`),
);

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}`);
    return true;
  }
  fail += 1;
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  return false;
}

async function launchBrowser() {
  const attempts = [{}, { channel: "msedge" }, { channel: "chrome" }];
  let lastError = null;
  for (const options of attempts) {
    try {
      return await chromium.launch({ headless: true, ...options });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("无法启动 Chromium");
}

/** 参数面板里按 label 取输入框 */
function fieldInput(page, label) {
  return page.locator(".prop-field", { hasText: label }).locator("input").first();
}

/** 动画图标根 svg（上游模板固定 data-icon-node="0"） */
const ANIM_SVG = '.re-icon__anim svg[data-icon-node="0"]';

/**
 * 期望的 viewBox 直接从 vendored 源文件读取：
 * 各库网格并不统一（24 / 256 混用），硬编码就会误判；
 * 同时这条断言也校验了「图标名 → 文件」的映射没串。
 */
async function expectedViewBox(name) {
  const [, lib, icon] = name.split(":");
  const file = join(ANIMATED_DIR, lib, `${icon}.vue`);
  const source = await readFile(file, "utf8");
  const match = /viewBox="([^"]+)"/.exec(source);
  if (!match) throw new Error(`${lib}/${icon}.vue 里找不到 viewBox`);
  return match[1];
}

async function waitForAnimSvg(page, timeout = 15000) {
  await page.locator(ANIM_SVG).first().waitFor({ state: "visible", timeout });
  return page.locator(ANIM_SVG).first();
}

async function svgHtml(page) {
  return page.locator(ANIM_SVG).first().evaluate((el) => el.outerHTML);
}

/** 轮询等待取值变化（动画由 rAF 驱动，不能只等固定时间） */
async function waitChanged(read, before, timeout = 2000) {
  const started = Date.now();
  let latest = before;
  while (Date.now() - started < timeout) {
    latest = await read();
    if (latest !== before) return { changed: true, latest };
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  return { changed: false, latest };
}

/** koi 主题：ReIconSelect 的验收 */
async function checkKoiIconSelect(page) {
  await page.goto(`${BASE}/#/debug/ReIconSelect`, { waitUntil: "domcontentloaded" });
  await page.locator(".koi-select-icon-input").waitFor({ timeout: 30000 });

  const selectInput = page.locator(".koi-select-icon-input input").first();
  await page.locator(".koi-select-icon-input").click();
  await page.locator(".koi-select-icon-panel").waitFor({ timeout: 10000 });

  const tabLabels = await page.locator(".koi-select-icon-tabs .el-tabs__item").allInnerTexts();
  check("存在「动画」tab", tabLabels.some((label) => label.trim() === "动画"), tabLabels.join(" | "));

  await page.locator(".koi-select-icon-tabs .el-tabs__item", { hasText: "动画" }).click();
  await page.waitForTimeout(300);

  const buttons = page.locator(".koi-select-icon-button");
  const count = await buttons.count();
  check(`动画 tab 列出 ${EXPECTED_ICONS.length} 个`, count === EXPECTED_ICONS.length, `实际 ${count}`);

  const titles = await buttons.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("title")));
  const missing = EXPECTED_ICONS.filter((name) => !titles.includes(name));
  check("16 个动画图标都在列表里", missing.length === 0, `缺 ${missing.join(", ")}`);

  // tab 内的预览也必须是真动画组件（不是空白/兜底 Menu）
  const previewReady = await page.evaluate(
    () => document.querySelectorAll(".koi-select-icon-button [data-icon-node]").length,
  );
  check("tab 内每项都渲染了动画组件", previewReady >= EXPECTED_ICONS.length * 2, `节点数 ${previewReady}`);

  const target = "anim:hugeicons:bell";
  await page.locator(`.koi-select-icon-button[title="${target}"]`).click();
  await page.waitForTimeout(400);

  const modelValue = await selectInput.inputValue();
  check("选中后回填完整名", modelValue === target, modelValue);

  const triggerAnimated = await page.locator(".koi-select-icon-input__preview .re-icon__anim svg").count();
  check("触发区预览渲染动画图标", triggerAnimated === 1, `count=${triggerAnimated}`);

  await page.locator(".koi-select-icon-input").click();
  await page.locator(".koi-select-icon-panel").waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  const activeTitle = await page.locator(".koi-select-icon-button.is-active").first().getAttribute("title");
  check("再次打开时该图标高亮", activeTitle === target, String(activeTitle));

  await page.locator(".koi-select-icon-input__clear").click();
  await page.waitForTimeout(300);
  const cleared = await selectInput.inputValue();
  const afterClearAnim = await page.locator(".koi-select-icon-input__preview .re-icon__anim").count();
  check("清空后值清空且预览移除动画图标", cleared === "" && afterClearAnim === 0, `value=${cleared}`);
}

/** default 主题：ReIconSelect 的验收（DOM 与 koi 完全不同，不能复用选择器） */
async function checkDefaultIconSelect(page) {
  await page.goto(`${BASE}/#/debug/ReIconSelect`, { waitUntil: "domcontentloaded" });
  const preview = page.locator(".debug__preview");
  await preview.locator(".re-icon-select__trigger").waitFor({ timeout: 30000 });

  const selectInput = preview.locator("input").first();
  await preview.locator(".re-icon-select__trigger").click();
  // ElTabs 会把所有 tab-pane 都渲染进 DOM（非激活的只是隐藏），必须限定到可见面板
  const animPane = page.locator(".re-icon-select__grid:visible").first();
  await animPane.waitFor({ timeout: 10000 });

  const animTab = page.locator(".el-tabs__item", { hasText: "动画" }).last();
  check("存在「动画」tab", (await animTab.count()) > 0);
  await animTab.click();
  await page.waitForTimeout(300);
  await animPane.waitFor({ timeout: 10000 });

  const items = page.locator(".re-icon-select__grid:visible .re-icon-select__item");
  const count = await items.count();
  check(`动画 tab 列出 ${EXPECTED_ICONS.length} 个`, count === EXPECTED_ICONS.length, `实际 ${count}`);

  const titles = await items.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("title")));
  const missing = EXPECTED_ICONS.filter((name) => !titles.includes(name));
  check("16 个动画图标都在列表里", missing.length === 0, `缺 ${missing.join(", ")}`);

  const previewReady = await animPane.evaluate((el) => el.querySelectorAll("[data-icon-node]").length);
  check("tab 内每项都渲染了动画组件", previewReady >= EXPECTED_ICONS.length * 2, `节点数 ${previewReady}`);

  const target = "anim:hugeicons:bell";
  await page.locator(`.re-icon-select__grid:visible .re-icon-select__item[title="${target}"]`).click();
  await page.waitForTimeout(400);

  const modelValue = await selectInput.inputValue();
  check("选中后回填完整名（不重复拼前缀）", modelValue === target, modelValue);

  const activeStyle = await page
    .locator(`.re-icon-select__grid:visible .re-icon-select__item[title="${target}"]`)
    .getAttribute("style");
  check("选中项有选中样式", Boolean(activeStyle && activeStyle.includes("border-color")), String(activeStyle));

  await page.locator(".re-icon-select__footer .el-button", { hasText: "清空" }).click();
  await page.waitForTimeout(300);
  const cleared = await selectInput.inputValue();
  check("清空后值清空", cleared === "", `value=${cleared}`);
}

async function main() {  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // 必须显式关闭「减少动效」，否则上游组件会跳过动画，验收会假阴性
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  console.log(`\n[1] ReIcon：16 个动画图标逐个渲染  (${BASE})`);
  await page.goto(`${BASE}/#/debug/ReIcon`, { waitUntil: "domcontentloaded" });
  await page.locator(".debug__preview").waitFor({ timeout: 30000 });

  const nameInput = fieldInput(page, "图标名");
  await nameInput.waitFor({ timeout: 15000 });

  for (const name of EXPECTED_ICONS) {
    await nameInput.fill(name);
    try {
      const svg = await waitForAnimSvg(page);
      const box = await svg.evaluate((el) => ({
        viewBox: el.getAttribute("viewBox"),
        width: el.getAttribute("width"),
        height: el.getAttribute("height"),
        rootNode: el.getAttribute("data-icon-node"),
        children: el.children.length,
        childNodes: el.querySelectorAll("[data-icon-node]").length,
      }));
      // Phosphor 等库的网格并不统一，期望值以 vendored 源文件为准
      const viewBox = await expectedViewBox(name);
      check(
        `${name} 渲染`,
        box.viewBox === viewBox &&
          box.rootNode === "0" &&
          box.children >= 1 &&
          box.childNodes >= 1 &&
          Number(box.width) > 0 &&
          Number(box.height) > 0,
        JSON.stringify(box),
      );
    } catch (error) {
      check(`${name} 渲染`, false, error instanceof Error ? error.message : String(error));
    }
  }

  console.log("\n[2] ReIcon：size / color 作用到动画图标");
  await nameInput.fill("anim:tabler:heart");
  const svg = await waitForAnimSvg(page);
  await fieldInput(page, "尺寸").fill("40");
  await page.waitForTimeout(150);
  const sizeBox = await svg.evaluate((el) => ({
    width: el.getAttribute("width"),
    height: el.getAttribute("height"),
  }));
  check("size=40 生效", sizeBox.width === "40" && sizeBox.height === "40", JSON.stringify(sizeBox));

  await fieldInput(page, "颜色").fill("#ff0000");
  await page.waitForTimeout(150);
  const stroke = await svg.evaluate((el) => getComputedStyle(el).stroke);
  check("color=#ff0000 生效（stroke: currentColor）", stroke === "rgb(255, 0, 0)", stroke);

  console.log("\n[3] ReIcon：hover 触发动画");
  await nameInput.fill("anim:tabler:plus");
  await waitForAnimSvg(page);
  const beforeHover = await svgHtml(page);
  await page.locator(".re-icon__anim").first().hover();
  const hoverResult = await waitChanged(() => svgHtml(page), beforeHover, 2500);
  check("悬停期间 SVG 发生变化（动画在跑）", hoverResult.changed);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(600);

  console.log("\n[4] ReIcon：未注册的 anim 名字走兜底");
  await nameInput.fill("anim:nope:nope");
  await page.waitForTimeout(500);
  const unknown = await page.evaluate(() => {
    const preview = document.querySelector(".debug__preview-body");
    return {
      animContainers: preview?.querySelectorAll(".re-icon__anim").length ?? -1,
      svgs: preview?.querySelectorAll("svg").length ?? -1,
      animatedNodes: preview?.querySelectorAll("[data-icon-node]").length ?? -1,
    };
  });
  check(
    "未知 anim 名不进入动画分支、且渲染兜底图标",
    unknown.animContainers === 0 && unknown.animatedNodes === 0 && unknown.svgs >= 1,
    JSON.stringify(unknown),
  );

  console.log(`\n[5] ReIconSelect：「动画」tab 与回填（theme=${THEME}）`);
  if (THEME === "default") {
    await checkDefaultIconSelect(page);
  } else {
    await checkKoiIconSelect(page);
  }

  console.log("\n[6] 运行期错误");
  check("无 pageerror", pageErrors.length === 0, pageErrors.join(" | "));
  check("无 console.error", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

  await context.close();
  await browser.close();

  console.log(`\nRE_ANIMATED_PASS=${pass} FAIL=${fail}`);
  if (fail > 0) {
    console.log("失败项：");
    for (const item of failures) console.log(`  - ${item}`);
    process.exitCode = 1;
  } else {
    console.log("RE_ANIMATED_ALL_PASS");
  }
}

main().catch((error) => {
  console.error(`[验收中断] ${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exitCode = 1;
});
