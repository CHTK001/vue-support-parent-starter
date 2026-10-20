/**
 * Re 按钮组 / square 图标选择器 —— 生产级验收。
 *
 * <p>需求原话：「每个可以点击的按钮，图标都要测试」。这里不抽样：对
 * {@code /lab/re-controls} 对照组页上的<b>每一个</b>可点元素逐个点掉，
 * 契约与仓库既有做法同源（{@code module-button-sweep-acceptance.mjs} 逐页扫、
 * {@code recron-buttons.spec.ts} 五条契约 + 判别力自检）。</p>
 *
 * <h3>七段结构</h3>
 * <ol>
 *   <li><b>源码契约</b>（不开浏览器）：被测样式段里不允许出现写死色值、
 *       不允许引用 Modern 族的 {@code --rm-*}、不允许引用失效变量。</li>
 *   <li><b>静态契约</b>（浏览器）：非塌陷 / 有可访问名 / 图标真画出来 / 点得到。</li>
 *   <li><b>配色契约</b>（浏览器）：本次重做的主体 —— 用「探针元素 + computed style」
 *       证明底色与字色<b>真的来自系统令牌</b>，而不是碰巧看着对。
 *       亮色、暗色各跑一遍。</li>
 *   <li><b>行为契约</b>：逐个点，必须有可观测副作用，没有死按钮。</li>
 *   <li><b>判别力自检</b>：判据本身必须被证明能区分好坏，否则「全绿」可能只是判据太松。</li>
 *   <li><b>真实宿主页</b>：被改组件在演示站真实页面里也合契约。</li>
 *   <li><b>弹窗编辑路径</b>（{@code /lab/re-tree}）：ReTree 弹窗里「名称」输入框的
 *       可写 computed 绑定 —— 该路径要靠 {@code showToolbar}/{@code enableAdd}/
 *       {@code enableEdit}/{@code editable} 才渲染，演示站没开这些开关，
 *       <b>在别处永远测不到</b>。模态会盖住整页，所以单开一节、单开一页，
 *       不并进第 2/4 节的逐点遍历。</li>
 * </ol>
 *
 * <p><b>为什么配色要这么验</b>：截图只能证明「看起来像」，证不了「用的是系统变量」。
 * 探针做法是往页面里插一个 {@code background: var(--el-color-primary)} 的空 div，
 * 取它的 computed 值再和控件的实际 computed 值逐字节比 —— 相等就等于
 * 「这个颜色确实是那个令牌的解析结果」。换主题时这段依然成立。</p>
 *
 * <p><b>基址</b>可用 {@code LAB_BASE_URL} 覆盖 —— 交付验收必须在构建产物上再跑一遍，
 * 只在 dev 上绿不足以说明产物可用。</p>
 *
 * <p><b>怎么跑</b>（需要先有一个在跑的前端，本脚本不负责起服务）：</p>
 * <pre>
 *   # dev
 *   pnpm --filter vue-support-template-starter dev
 *   pnpm --filter vue-support-template-starter accept:re-controls
 *
 *   # 构建产物（交付验收必须走这一遍）
 *   pnpm --filter vue-support-template-starter build
 *   pnpm --filter vue-support-template-starter exec vite preview --port 4180
 *   # 另开一个终端
 *   $env:LAB_BASE_URL="http://127.0.0.1:4180"
 *   pnpm --filter vue-support-template-starter accept:re-controls
 * </pre>
 * 退出码 0 = 全过（{@code RE_CONTROLS_ALL_PASS}），1 = 有 FAIL。
 *
 * @author CH
 * @since 2026-10-15
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
/* 只借用一个纯工具：会话启动的硬超时。判据本身仍是本地副本（已知债务，见 lib 头注）。 */
import {
  /* 判据与采集器**共用一份实现**（scripts/lib/clickable-sweep.mjs），
     本文件不再保留本地副本：两份逐字相同的判据一旦各自漂移，
     两套「全绿」就不可比 —— 而验收的全部价值恰恰在于判据可信。 */
  CLICKABLE_SEL, collectFn, DECORATIVE_EXEMPT, isExempt, label,
  assignKeys, isClickableCandidate, violations, isBrowserGone, sleep,
  withTimeout,
} from "./lib/clickable-sweep.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(HERE, "..");
const REPO_ROOT = path.resolve(APP_ROOT, "..", "..");

/* 空串也要回退：`??` 只处理 null/undefined，而 shell 里传 `VAR=` 得到的是空串 */
const BASE = process.env.LAB_BASE_URL || "http://127.0.0.1:8090";
const LAB_HASH = "/lab/re-controls";
const VIEWPORT = { width: 1560, height: 1000 };

/**
 * 组件在演示站里的**真实宿主页**。
 *
 * <p>对照组页是受控环境（状态固定、控件密集），但它证明不了「组件在真实宿主里
 * 也合契约」。这两页正好各自带着被改的组件：ReSelect 调试页的属性面板本身就用
 * {@code ReSelect layout="square"} 渲染「布局」字段，ReSwitch 调试页的 radio 布局
 * 走的是同一个 {@code ReRadioGroup} / {@code ReRadioButton}。</p>
 *
 * <p>这两页只跑<b>静态契约</b>，不跑「逐个点」：死按钮判据依赖对照组页的变更计数，
 * 而这里没有那个计数器 —— 硬套会得到「整页都是死按钮」的假结论。
 * 逐点遍历留在对照组页（有精确信号），真实宿主只验「看得见 / 有名字 / 图标画出来 /
 * 点得到」这四条同样会真实伤到用户的项。</p>
 */
const HOSTS = [
  { name: "ReSelect 调试页（属性面板的 square 选择器 + 预览）", hash: "/debug/ReSelect", scope: "body" },
  { name: "ReSwitch 调试页（radio 布局共用 ReRadioGroup）", hash: "/debug/ReSwitch", scope: "body" },
];

/* ───────────────────────── 结果统计 ───────────────────────── */

let pass = 0;
let fail = 0;
/** 告警计数：刻意不叫 warn —— 下面有一个同名的 warn() 函数，同名会直接语法报错 */
let warned = 0;
let skip = 0;
let failures = [];
let warnings = [];

const check = (name, ok, detail = "") => {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? `  -> ${detail}` : ""}`);
  ok ? pass++ : fail++;
  if (!ok) failures.push(`${name}${detail ? `  -> ${detail}` : ""}`);
};

/**
 * 记一条告警（不判失败）。
 *
 * <p>用于「组件没有做错，但上游令牌本身有缺口」这类事实：硬判成 FAIL 会逼着
 * 去改组件，而根因在主题令牌；默默放过又等于藏起来。两种都不行，
 * 所以单列一档并把实测值打印出来。</p>
 */
const warn = (name, detail = "") => {
  console.log(`  [WARN] ${name}${detail ? `  -> ${detail}` : ""}`);
  warned++;
  warnings.push(`${name}${detail ? `  -> ${detail}` : ""}`);
};

const skipAs = (name, detail = "") => {
  skip++;
  console.log(`  [SKIP] ${name}${detail ? `  -> ${detail}` : ""}`);
};

/* ═══════════════════ 1. 源码契约（不开浏览器） ═══════════════════ */

console.log("=== 1. 源码契约：只走系统令牌，不写死色值 ===");

/** 去注释（CSS 与 SCSS 的行/块注释都要） */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/**
 * 抽出「被测的那一段样式」而不是整个文件。
 *
 * <p>re-kit.css 里还有 ReDescriptions / ReAlert 等段落仍用 {@code --rm-*}，
 * 那是本次范围外的历史债；连整个文件一起判会立刻红，而红的原因与本次交付
 * 无关。段落边界用稳定注释锚定，避免误伤。</p>
 */
function readRadioGroupSection() {
  const file = path.join(REPO_ROOT, "packages/ui/src/components/ReKit/re-kit.css");
  const css = readFileSync(file, "utf8");
  /* 起点必须带上前面的 "/*"：分段说明本身就是一整块块注释，
     从注释中间的 "---------- ReRadioGroup" 起切会得到一段**没有开头符**的注释，
     stripComments 便删不掉它，整段说明文字会被当成一条条声明去判颜色，
     于是判据在纯文字上报错 —— 判据自己有 bug，结论就不可信。 */
  const from = css.indexOf("/* ---------- ReRadioGroup");
  const to = css.indexOf("---------- ReDescriptions");
  if (from < 0 || to < 0 || to <= from) {
    throw new Error(`re-kit.css 里找不到 ReRadioGroup 段落边界（from=${from} to=${to}）`);
  }
  return css.slice(from, to);
}

function readSquareStyleBlock() {
  const file = path.join(REPO_ROOT, "packages/ui/src/components/ReSelect/layouts/Square.vue");
  const vue = readFileSync(file, "utf8");
  const m = vue.match(/<style[^>]*lang="scss"[^>]*>([\s\S]*?)<\/style>/);
  if (!m) throw new Error('Square.vue 里找不到 <style lang="scss"> 块');
  return m[1];
}

const SECTIONS = [
  ["re-kit.css · 按钮组段", readRadioGroupSection()],
  ["ReSelect Square.vue · 样式块", readSquareStyleBlock()],
];

/**
 * 写死色值判据。
 *
 * <p>规则：声明里出现 {@code #hex} 时，同一条声明必须同时出现 {@code var(--…)} ——
 * 即 hex 只允许作为令牌的兜底值出现。其余位置的 hex 都是主题换不掉的颜色。</p>
 *
 * <p>另外禁 {@code rgb(} / {@code rgba(} 字面量：它们正是「上一版写死主色」
 * 的形态（{@code rgba(64,158,255,.12)}），换成 {@code color-mix(...)} 才是正解。</p>
 */
function hardCodedColors(css) {
  const bad = [];
  for (const raw of stripComments(css).split(";")) {
    const decl = raw.trim();
    if (!decl) continue;
    const hasHex = /#[0-9a-fA-F]{3,8}\b/.test(decl);
    if (hasHex && !/var\(\s*--/.test(decl)) bad.push(decl.replace(/\s+/g, " ").slice(0, 90));
    if (/\brgba?\(/.test(decl)) bad.push(decl.replace(/\s+/g, " ").slice(0, 90));
  }
  return bad;
}

for (const [name, css] of SECTIONS) {
  const bare = hardCodedColors(css);
  check(`${name}：没有裸色值（hex 只允许作 var 兜底，且无 rgb/rgba 字面量）`, bare.length === 0,
    bare.length ? bare.join(" | ") : "");

  /* --rm-* 是 Modern 控件族的私有色板，与 koi 的 --el-* 各走各的 */
  const rm = (stripComments(css).match(/--rm-[a-z-]+/g) || []);
  check(`${name}：不引用 Modern 族私有令牌 --rm-*`, rm.length === 0, rm.length ? [...new Set(rm)].join(", ") : "");

  /* --el-radius-base 不存在（Element 只有 --el-border-radius-base），
     写它等于永远走兜底值 —— 令牌名写错不会有任何报错 */
  const dead = (stripComments(css).match(/--el-radius-base\b/g) || []);
  check(`${name}：不引用不存在的令牌 --el-radius-base`, dead.length === 0, dead.length ? `${dead.length} 处` : "");
}

check("对照组页面存在（/lab/re-controls 的宿主）",
  existsSync(path.join(APP_ROOT, "src/views/ReControlsLab.vue")),
  "apps/vue-support-template-starter/src/views/ReControlsLab.vue");

/* ═══════════════════ 浏览器段 ═══════════════════ */

const MARK = "data-lab-sweep";

/* 采集器与可点选择器都来自 scripts/lib，缺失导出等改动会在启动时立刻炸出来，
   而不是两边悄悄跑成不同的判据。 */
const COLLECT = collectFn(MARK);

/**
 * 可点元素选择器。
 *
 * <p>刻意包含 Element Plus 与 ReSelect 的内部点击目标：只查原生 {@code button}
 * 会把整批漏掉（按钮组的 {@code .el-radio-button__inner} 是 label 内的 span，
 * square 选择器的 {@code .re-select-square__item} 是 div，两者都不是 button）。</p>
 */

/**
 * 装饰字形白名单（**裸类名**，精确匹配）。
 *
 * <p>只有「自己不是交互控件、名字由外层控件提供」的图标可以进来。这里收的是
 * combobox 里的下拉箭头：它只是 select 的一个装饰字形，可访问名由所在 combobox
 * 提供，自己再挂 aria-label 反而重复。</p>
 *
 * <p>刻意用<b>精确类名</b>而不是「前缀包含」：将来多出任何一个真的无名图标，
 * 用例照样会红 —— 豁免名单不允许变成漏网的口子（判据的自检里钉了这条）。</p>
 */

function expectContract(items, ctx) {
  if (items.length === 0) {
    check(`${ctx}：扫到了可点元素`, false, "一个都没枚举到，说明选择器或作用域失效");
    return;
  }
  const bad = violations(items);
  check(`${ctx}：${items.length} 个可点元素都合契约`, bad.length === 0,
    bad.length ? `${bad.length} 项不合契约\n    - ${bad.join("\n    - ")}` : "");
}

/**
 * 启动浏览器。
 *
 * <p>默认走系统自带的 Edge（与 {@code playwright.config.ts} 的 {@code channel: "msedge"}
 * 同口径）。不用 Playwright 自带的 {@code chromium_headless_shell}：该外壳在本机
 * 一启动就崩（{@code Target page, context or browser has been closed}），
 * 而崩溃信息里看不出是外壳问题，很容易被误读成「页面打不开」。</p>
 *
 * <p>可用 {@code LAB_CHANNEL} 覆盖（如 {@code chrome} / {@code chromium}），
 * 用于换浏览器复现渲染差异。</p>
 */
const CHANNEL = process.env.LAB_CHANNEL || "msedge";

let browser;
let page;
let pageErrors = [];

/** 错误是不是「浏览器自己没了」，而不是产品/判据问题 */

async function launchBrowser() {
  try {
    browser = await chromium.launch({
      headless: true,
      channel: CHANNEL,
      /* 低配/容器环境共享内存不足会让渲染进程无声退出（实测 Edge 外壳跑到一半
         「Target page ... has been closed」），这两个是 Playwright 官方 CI 兜底 */
      args: ["--disable-dev-shm-usage", "--disable-gpu"],
    });
  } catch (e) {
    console.log(`  !! 浏览器启动失败（channel=${CHANNEL}）：${String(e.message || e).replace(/\s+/g, " ").slice(0, 300)}`);
    console.log("     可用 LAB_CHANNEL=msedge|chrome|chromium 指定通道");
    process.exit(2);
  }
  const context = await browser.newContext({ viewport: VIEWPORT, locale: "zh-CN" });
  page = await context.newPage();
  pageErrors = [];
  page.on("pageerror", e => pageErrors.push(e.message));
}

const sweep = async (scope = ".lab") => {
  if (scope === "body") {
    return page.evaluate(`(${COLLECT})("body")`);
  }
  return page.evaluate(`(${COLLECT})(${JSON.stringify(scope)})`);
};

/**
 * 打开某一页，**渲染没出来就重载再来**。
 *
 * <p>为什么要重试而不是把超时调大：Vite 冷启动会做依赖预构建，
 * 触发整页 reload（日志里的 "optimized dependencies changed. reloading"），
 * 第一次 {@code page.goto} 拿到的 document 会被换掉 —— 等在旧 document 上的
 * 选择器随之永远等不到，表现就是「等 120s 后报页面打不开」，
 * 而真因是「页面被换过一次」。等多久都救不了，只能重载再等。</p>
 *
 * <p>用 {@code state:"attached"} 而不是默认的 {@code "visible"}：
 * 普查自己会量 getBoundingClientRect 并把塌陷元素判为违规，
 * 这里只负责确认「渲染了」，不重复前置判断。</p>
 */
async function openPage(hash) {
  await page.goto(`${BASE}/#${hash}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.waitForSelector(".debug, .lab", { state: "attached", timeout: 45000 });
      /* 等布局与样式落位：字体/样式没稳定时 getBoundingClientRect 不是最终值 */
      await page.waitForTimeout(900);
      return;
    } catch (e) {
      if (isBrowserGone(e)) throw e;
      console.log(`  [note] ${hash} 第 ${attempt} 次等待渲染超时，重载再试（Vite 预构建会整页 reload）`);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {});
    }
  }
  throw new Error(`${hash} 3 次尝试都没渲染出来`);
}

const openLab = () => openPage(LAB_HASH);

/**
 * 等可点元素数量**连续两次相同**再开始判定。
 *
 * <p>固定 sleep 顶不住「属性面板还没渲染完」：实测 {@code /debug/ReSelect} 有时
 * 只采到 12 个可点元素（square 0 项），有时 24 个（square 4 项）——
 * 差的就是属性面板那一整块。数量稳定比等固定时长更贴合真正的前置条件：
 * 「页面把控件渲染出来了」。</p>
 */
async function waitForStable(scope, { maxMs = 20000, intervalMs = 400 } = {}) {
  let prev = -1;
  let same = 0;
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const n = (await sweep(scope)).length;
    if (n === prev && n > 0) {
      if (++same >= 2) return n;
    } else {
      same = 0;
    }
    prev = n;
    await sleep(intervalMs);
  }
  return prev;
}

/* ── 配色令牌探针 ── */

/**
 * 取「某个令牌表达式」在当前主题下的解析值。
 *
 * <p>做法是插一个一次性空 div 把该表达式作为 background，读 computed 值再删掉。
 * 这样拿到的是浏览器**真正解析出来的颜色**，格式（hex / rgb / oklch）都无所谓，
 * 不用自己写 hex→rgb 转换 —— 转换一旦写错，判据就成了摆设。</p>
 */
const PROBE = `
(expr, prop) => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:-99999px;top:0;width:1px;height:1px;pointer-events:none;';
  if (prop === 'color') d.style.color = expr; else d.style.backgroundColor = expr;
  document.body.appendChild(d);
  const cs = getComputedStyle(d);
  const v = prop === 'color' ? cs.color : cs.backgroundColor;
  d.remove();
  return v;
}
`;

/** 读取一批元素的配色（一次 evaluate，避免多次往返） */
const READ_STYLE = `
(sel) => [...document.querySelectorAll(sel)].map(el => {
  const cs = getComputedStyle(el);
  return { color: cs.color, background: cs.backgroundColor, radius: cs.borderTopLeftRadius };
})
`;

/**
 * 只读**第一个**匹配元素的配色。
 *
 * <p>hover 断言必须用它而不是批量版：hover 只作用于鼠标所在的那一颗，
 * 同组其余未选中项仍停在常态色。批量读再 every()，会把「没被 hover 的那些」
 * 也要求成 hover 色，判据恒假（实测 square 与按钮组两条 hover 断言都这样误报）。</p>
 */
const READ_ONE = `
(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { color: cs.color, background: cs.backgroundColor, radius: cs.borderTopLeftRadius };
}
`;

/**
 * 量静态样式契约前先关掉过渡动画。
 *
 * <p>为什么必须关：组件对 {@code color / background-color} 声明了 transition，
 * 切主题（加 {@code html.dark}）会把它们从亮色值插值到暗色值。若在插值途中读
 * computed 值，得到的是**过程值**而不是终值 —— 实测暗色档读到
 * {@code rgb(205,209,218)} 而令牌是 {@code rgb(207,211,220)}（各通道均匀差 2，
 * 正是过渡到 98% 的位置），报出一条纯属时序的假 FAIL。</p>
 *
 * <p>固定 sleep 只能把概率压小、压不到零（插值起点取决于重新计算样式的时机）。
 * 关掉过渡后读到的必然是终值，与主题切换快慢无关。交互手感不受影响 ——
 * 这只在验收进程里生效，用完即撤。</p>
 */
const TRANSITION_OFF_ID = "lab-acceptance-no-transition";

const disableTransitions = () => page.evaluate(id => {
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = "*,*::before,*::after{transition:none !important;animation:none !important;}";
  document.head.appendChild(s);
}, TRANSITION_OFF_ID);

const enableTransitions = () => page.evaluate(id => {
  document.getElementById(id)?.remove();
}, TRANSITION_OFF_ID);

/**
 * 量「元素实际渲染出来的字色 vs 填充色」的 WCAG 对比度。
 *
 * <p><b>为什么直接量元素、不拿令牌互比</b>：令牌互比测的是「意图」，
 * 用户看到的是「渲染结果」。填充是实心块之后，唯一该问的是这块上的字看不看得清。</p>
 *
 * <p><b>颜色格式坑</b>：用了 {@code color-mix()} 之后，浏览器返回的不再是
 * {@code rgb(r, g, b)}，而是 {@code color(srgb r g b)}（实测 Edge 就是这样）。
 * 只匹配 {@code rgb(} 的解析器会静默取不到颜色，表现为「对比度无法实测」——
 * 这条断言当时就是这么红的。</p>
 */
const CONTRAST_FN = `
(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const parse = s => {
    if (!s) return null;
    const t = String(s).trim();
    let m = t.match(/^rgba?\\(([^)]+)\\)$/i);
    if (m) {
      const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(parseFloat);
      if (p.length >= 3 && (p.length < 4 || p[3] > 0)) return [p[0], p[1], p[2]];
      return null;
    }
    m = t.match(/^color\\(\\s*srgb\\s+([^)]+)\\)$/i);
    if (m) {
      const p = m[1].split(/[\\s/]+/).filter(Boolean).map(parseFloat);
      if (p.length >= 3 && (p.length < 4 || p[3] > 0)) return [p[0] * 255, p[1] * 255, p[2] * 255];
      return null;
    }
    return null;
  };
  const srgb = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = c => 0.2126 * srgb(c[0]) + 0.7152 * srgb(c[1]) + 0.0722 * srgb(c[2]);
  const fg = parse(cs.color);
  const bg = parse(cs.backgroundColor);
  if (!fg || !bg) return null;
  const l1 = lum(fg), l2 = lum(bg);
  return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
}
`;

async function measureContrast(page, selector) {
  return page.evaluate(`(${CONTRAST_FN})(${JSON.stringify(selector)})`);
}

async function runPaletteContract(dark) {
  const tag = dark ? "暗色" : "亮色";
  if (dark) {
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(400);
  }

  const probe = async (expr, prop = "background") =>
    page.evaluate(`(${PROBE})(${JSON.stringify(expr)}, ${JSON.stringify(prop)})`);

  const read = async sel => page.evaluate(`(${READ_STYLE})(${JSON.stringify(sel)})`);
  const readOne = async sel => page.evaluate(`(${READ_ONE})(${JSON.stringify(sel)})`);

  const [primary, activeFill, bgColor, white, textRegular, textPrimary, textSecondary, fillLight, placeholder] =
    await Promise.all([
      probe("var(--el-color-primary)"),
      /* 选中态填充是「压深后的主色」，表达式必须与 re-kit.css 里的**逐字一致**，
         否则这里比的是另一个东西、通过与否都不说明问题 */
      probe("color-mix(in srgb, var(--el-color-primary) 72%, var(--el-color-black, #000))"),
      probe("var(--el-bg-color)"),
      probe("var(--el-color-white)", "color"),
      probe("var(--el-text-color-regular)", "color"),
      probe("var(--el-text-color-primary)", "color"),
      probe("var(--el-text-color-secondary)", "color"),
      probe("var(--el-fill-color-light)"),
      probe("var(--el-text-color-placeholder)", "color"),
    ]);

  /* 1) 按钮组轨道 = 白底（页面底色），不是灰底 */
  const track = await read('[data-lab="grp-status"]');
  check(`${tag}·按钮组轨道底色 = var(--el-bg-color)`, track[0]?.background === bgColor,
    `实得 ${track[0]?.background} / 令牌 ${bgColor}`);

  /* 2) 选中项 = 实心块 + 白字（本次重做的核心）。
        填充断言按「压深后的主色」比对：它必须来自令牌派生，不能是写死色，
        也不能退回未压深的 --el-color-primary（那样白字对比度不达标）。 */
  const active = await read('[data-lab="grp-status"] .el-radio-button.is-active .el-radio-button__inner');
  check(`${tag}·按钮组选中项底色 = 压深主色（color-mix(主色 72%, 系统黑)）`,
    active.length === 1 && active[0].background === activeFill,
    `实得 ${active[0]?.background} / 期望 ${activeFill}`);
  check(`${tag}·按钮组选中项底色确实比未压深主色深（否则等于没修对比度）`,
    active.length === 1 && active[0].background !== primary,
    `实得 ${active[0]?.background} / 未压深主色 ${primary}`);
  check(`${tag}·按钮组选中项字色 = var(--el-color-white)`,
    active.length === 1 && active[0].color === white,
    `实得 ${active[0]?.color} / 令牌 ${white}`);

  /* 3) 未选中项 = 灰字，且底色透明 */
  const idle = await read('[data-lab="grp-status"] .el-radio-button:not(.is-active) .el-radio-button__inner');
  check(`${tag}·按钮组未选中项字色 = var(--el-text-color-regular)（灰）`,
    idle.length > 0 && idle.every(s => s.color === textRegular),
    `实得 ${[...new Set(idle.map(s => s.color))].join(",")} / 令牌 ${textRegular}`);
  check(`${tag}·按钮组未选中项无底色填充`,
    idle.every(s => s.background === "rgba(0, 0, 0, 0)" || s.background === "transparent"),
    [...new Set(idle.map(s => s.background))].join(","));

  /* 4) 非胶囊档同样是实心压深块（形态开关只改圆角，不改配色） */
  const activeShape = await read('[data-lab="grp-shape"] .el-radio-button.is-active .el-radio-button__inner');
  check(`${tag}·非胶囊档选中项底色同样是压深主色（形态开关只改圆角）`,
    activeShape.length === 1 && activeShape[0].background === activeFill,
    `实得 ${activeShape[0]?.background} / 期望 ${activeFill}`);

  /* 5) 禁用项不得染主色（否则「不可点」和「已选中」分不清） */
  const dis = await read('[data-lab="grp-disabled"] .el-radio-button.is-disabled .el-radio-button__inner');
  check(`${tag}·按钮组禁用项不带主色底`,
    dis.length === 1 && dis[0].background !== primary,
    `实得 ${dis[0]?.background}`);
  check(`${tag}·按钮组禁用项字色 = var(--el-text-color-placeholder)`,
    dis.length === 1 && dis[0].color === placeholder,
    `实得 ${dis[0]?.color} / 令牌 ${placeholder}`);

  /* 6) 胶囊档圆角应接近「半个高度」（药丸） */
  const pill = await read('[data-lab="grp-status"] .el-radio-button.is-active .el-radio-button__inner');
  const px = parseFloat(pill[0]?.radius || "0");
  check(`${tag}·胶囊档选中项圆角 ≥ 高度一半（药丸形态）`, px >= 10,
    `border-radius=${pill[0]?.radius}`);

  /* ── square 图标选择器 ── */

  /* 7) 未选中项 = 灰 */
  const sqIdle = await read('[data-lab="sq-icon"] .re-select-square__item:not(.re-select-square__item--active)');
  check(`${tag}·square 未选中项字色 = var(--el-text-color-secondary)（灰）`,
    sqIdle.length > 0 && sqIdle.every(s => s.color === textSecondary),
    `实得 ${[...new Set(sqIdle.map(s => s.color))].join(",")} / 令牌 ${textSecondary}`);

  /* 8) 选中项 = 主色 */
  const sqActive = await read('[data-lab="sq-icon"] .re-select-square__item--active');
  check(`${tag}·square 选中项字色 = var(--el-color-primary)`,
    sqActive.length === 1 && sqActive[0].color === primary,
    `实得 ${sqActive[0]?.color} / 令牌 ${primary}`);

  /* 9) 竖向档选中项文字转主色 */
  const vActive = await read('[data-lab="sq-vertical"] .re-select-square__item--active .re-select-square__label');
  check(`${tag}·square 竖向档选中项文字 = var(--el-color-primary)`,
    vActive.length === 1 && vActive[0].color === primary,
    `实得 ${vActive[0]?.color} / 令牌 ${primary}`);

  /* 10) hover 未选中项必须仍是灰阶，不能变主色 —— 这是本次口径的核心之一。
         用真实 hover() 触发，再只读**被 hover 的那一颗**的 computed 值（不截图）。
         期望值分组件：两个组件的常态字色不同，hover 都是「比自己的常态深一档」，
         所以 square 期望 text-regular，按钮组期望 text-primary。 */
  const sqHoverSel = '[data-lab="sq-icon"] .re-select-square__item:not(.re-select-square__item--active)';
  await page.locator(sqHoverSel).first().hover();
  await page.waitForTimeout(350);
  const sqHover = await readOne(sqHoverSel);
  check(`${tag}·square 未选中项 hover 走灰阶（不染主色）`,
    !!sqHover && sqHover.color === textRegular && sqHover.background === fillLight,
    `实得 color=${sqHover?.color}/bg=${sqHover?.background}；期望 color=${textRegular}/bg=${fillLight}`);

  const gHoverSel = '[data-lab="grp-status"] .el-radio-button:not(.is-active) .el-radio-button__inner';
  await page.locator(gHoverSel).first().hover();
  await page.waitForTimeout(350);
  const gHover = await readOne(gHoverSel);
  check(`${tag}·按钮组未选中项 hover 走灰阶（不染主色）`,
    !!gHover && gHover.color === textPrimary && gHover.background === fillLight,
    `实得 color=${gHover?.color}/bg=${gHover?.background}；期望 color=${textPrimary}/bg=${fillLight}`);

  /* 11) hover 已选中项不得「褪色」 —— 否则会被误读成取消了选择 */
  await page.hover('[data-lab="grp-status"] .el-radio-button.is-active .el-radio-button__inner');
  await page.waitForTimeout(350);
  const gActiveHover = await read('[data-lab="grp-status"] .el-radio-button.is-active .el-radio-button__inner');
  check(`${tag}·按钮组选中项 hover 不褪色（仍是实心压深块）`,
    gActiveHover.length === 1 && gActiveHover[0].background === activeFill,
    `实得 ${gActiveHover[0]?.background} / 期望 ${activeFill}`);

  /* 12) 对比度：**直接量元素实际渲染出来的字色与填充色**（见 CONTRAST_FN 说明）。
         13px/600 不算 large text，门槛按 WCAG AA 的 4.5:1。 */
  const contrast = await measureContrast(
    page,
    '[data-lab="grp-status"] .el-radio-button.is-active .el-radio-button__inner',
  );

  if (contrast === null) {
    check(`${tag}·按钮组选中块对比度可实测`, false, "取不到实际渲染的配色，无法证明达标");
  } else if (contrast >= 4.5) {
    check(`${tag}·按钮组选中块白字对比度 ≥ 4.5:1 (WCAG AA)`, true, `实测 ${contrast}:1`);
  } else {
    /* 这次不降级成 WARN：已经为此把填充压深，达不到就是缺陷，不是「上游令牌有缺口」。
       WARN 是留给「组件没错、根因在主题」的类别（见 warn() 的说明）。 */
    check(`${tag}·按钮组选中块白字对比度 ≥ 4.5:1 (WCAG AA)`, false,
      `实测 ${contrast}:1（压深后的主色仍不足；需继续加深 --re-radio-active-bg 或换更深品牌色）`);
  }

  /* 13) ReSelect 选中对勾：白对勾压圆底，属于「非文本图形」，门槛 3:1 */
  const badge = await measureContrast(page, '[data-lab="sq-icon"] .re-select-square__check');
  if (badge === null) {
    check(`${tag}·square 选中对勾可实测`, false, "取不到实际渲染的配色，无法证明达标");
  } else {
    check(`${tag}·square 选中对勾对比度 ≥ 3:1 (WCAG 非文本)`, badge >= 3, `实测 ${badge}:1`);
  }

  if (dark) {
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.waitForTimeout(300);
  }
}

/* ═══════════════════ 浏览器段主体 ═══════════════════ */

/* ═══════════ 7. 弹窗编辑路径：ReTree 弹窗名称输入绑定 ═══════════ */

/**
 * ReTree 弹窗对照组页路径。
 *
 * <p>与 {@code /lab/re-controls} **必须隔离**：ReTree 的增删改都要开模态弹窗，
 * 模态一开就盖住整页 —— 并进第 2/4 节的 `.lab` 遍历会让后续点击全被遮罩吞掉，
 * 判出一大批「死按钮」假阳性。</p>
 */
const TREE_LAB_HASH = "/lab/re-tree";

/** 第 7 节的期望值。刻意互不为前缀，免得 `includes` 互相污染出假阳性。 */
const TL_NEW_ROOT = "新增根节点A";
const TL_EDITED = "改名后的节点B";
const TL_NEW_CHILD = "新增子节点C";
const TL_CANCELLED = "取消不应生效D";

/**
 * 打开 ReTree 弹窗对照组页。
 *
 * <p>不复用 {@link openPage}：它等的是 `.debug, .lab` 就绪，而这一页的根是
 * `.re-tree-lab`。给这一页硬挂一个 `.lab` 类能省几行，但会让第 2/4 节的
 * `.lab` 作用域多出一个候选宿主 —— 判据的语义就混了。宁可多写一个等待函数。</p>
 */
async function openTreeLab() {
  await page.goto(`${BASE}/#${TREE_LAB_HASH}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.waitForSelector(".re-tree-lab", { state: "attached", timeout: 45000 });
      /* 只等外壳会拿到「0 个节点」的中间态，所以连节点一起等 */
      await page.waitForSelector(".el-tree-node__content", { state: "attached", timeout: 45000 });
      await page.waitForTimeout(600);
      return;
    } catch (e) {
      if (isBrowserGone(e)) throw e;
      console.log(`  [note] ${TREE_LAB_HASH} 第 ${attempt} 次等待渲染超时，重载再试（Vite 预构建会整页 reload）`);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {});
    }
  }
  throw new Error(`${TREE_LAB_HASH} 3 次尝试都没渲染出来`);
}

/**
 * 第 7 节：ReTree 弹窗里的「名称」输入绑定。
 *
 * <p><b>为什么单独成节</b>：该输入框的绑定从
 * {@code v-model="(formData[labelKey] as string)"}（用 `as` 糊类型）换成了可写
 * computed {@code labelInput}。而弹窗只在 {@code showToolbar} / {@code enableAdd} /
 * {@code enableEdit} 打开时才渲染 —— 演示站没开这些开关，静态普查也点不到，
 * 所以这条改动路径在别处<b>永远测不到</b>。</p>
 *
 * <p><b>为什么断言能钉死改动本身</b>：{@code confirmDialog} 用
 * {@code { ...formData.value, children: [] }} 落地，而 {@code formData} 正是靠
 * {@code labelInput} 写入的 —— 于是「输入的名称必须原样出现在新节点上」
 * 恰好测出 setter 写错字段（会得到空标签），「编辑弹窗必须预填当前名称」
 * 恰好测出 getter 分支。</p>
 */
async function runTreeDialogSection() {
  console.log("\n=== 7. 弹窗编辑路径：ReTree 弹窗里的名称输入绑定 ===");
  try {
    await openTreeLab();

    const readNum = (sel) => page.evaluate((s) => Number(document.querySelector(s)?.textContent ?? NaN), sel);
    const readText = (sel) => page.evaluate((s) => document.querySelector(s)?.textContent ?? "", sel);
    const tally = () => readNum("[data-lab-tally]");
    const noopClicks = () => readNum("[data-lab-noop-clicks]");
    const nodeCount = () => readNum("[data-lab-tree-count]");
    const labels = () => readText("[data-lab-tree-labels]");

    /*
     * 弹窗定位一律**按打开的那个 overlay 定界**，不裸用 `.el-dialog`：
     * ReDialog 按主题分发（default / koi 两套实现），页面里也可能残留已关闭的
     * 弹窗节点；`.first()` 裸取会点到一个不可见的旧弹窗上去。
     * `:visible` 由 Playwright 的 CSS 扩展提供。
     */
    const dlg = () => page.locator(".el-overlay:visible .el-dialog").first();
    const dialogVisible = () => page.locator(".el-overlay:visible .el-dialog").first().isVisible().catch(() => false);
    const dialogInput = () => dlg().locator("input.el-input__inner").first();
    const dlgButton = (t) => dlg().locator("button", { hasText: t }).first();

    /**
     * 节点操作按钮「添加 / 编辑 / 删除」。
     *
     * <p><b>必须先 hover 再点</b>：`.re-tree__node-actions` 平时是
     * {@code display:none}，只有 `.re-tree__custom-node:hover` 时才 `display:flex`
     * —— 直接 click 会一直等「元素可见」直到超时（实测就是这么挂的，
     * locator 明明已解析到按钮，却点不动）。这也说明这几个按钮本身就是
     * 「悬停才出现」的形态，验收必须按真实用户的交互路径来点。</p>
     *
     * <p>定界用 {@code .el-tree-node__content} 而不是 {@code .el-tree-node}：
     * 后者是**子树**，父节点文本含子节点文本，`hasText` 会同时命中父子两层。
     * 名称再加「后面不能再跟 - 或数字」的负向断言：否则 {@code /^一级 1/}
     * 会同时命中「一级 1-1」「一级 1-2」，取到哪条全看 DOM 顺序。</p>
     */
    const nodeContent = (name) => page
      .locator(".el-tree-node__content", {
        hasText: new RegExp("^" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![-\\d])"),
      })
      .first();

    async function clickNodeAction(name, action) {
      const content = nodeContent(name);
      /* 先 hover 把操作区显出来，hover 不到就抛（而不是静默点到别处） */
      await content.hover({ timeout: 8000 });
      await content.locator(".re-tree__node-actions button", { hasText: action }).first()
        .click({ timeout: 6000 });
    }

    /* ── 前置：组件真的渲染出来了，否则本节全是空断言 ── */
    const seeded = await nodeCount();
    check("弹窗对照组渲染出了树节点（否则本节全是空断言）", seeded >= 4, `节点数 ${seeded}`);
    const toolbarAdd = page.locator(".re-tree__toolbar button", { hasText: "添加根节点" }).first();
    check("弹窗对照组渲染出了「添加根节点」工具栏按钮", await toolbarAdd.isVisible().catch(() => false));

    /* ── ① 基本功能：加根节点，输入的名称必须原样落到新节点 ── */
    let before = await tally();
    await toolbarAdd.click({ timeout: 6000 });
    check("点「添加根节点」打开了弹窗", await dialogVisible());
    await dialogInput().fill(TL_NEW_ROOT);
    await dlgButton("确定").click({ timeout: 6000 });
    await page.waitForTimeout(400);
    check("确定后弹窗关闭", !(await dialogVisible()));
    check("加根节点后节点数 +1", (await nodeCount()) === seeded + 1, `${seeded} -> ${await nodeCount()}`);
    check("新根节点标签与输入的名称一致", (await labels()).includes(TL_NEW_ROOT), `回显：${await labels()}`);
    check("加根节点：变更计数增加", (await tally()) > before, `${before} -> ${await tally()}`);

    /* ── ② 本次改动本体：可写 computed 必须**双向**都对 ──
       只测「写进去」不足以证明改对了：getter 写错会在编辑弹窗里显示空值，
       setter 写错会让名称落到别的字段上。两条分开钉。 */
    await clickNodeAction("一级 2", "编辑");
    check("点节点「编辑」打开了弹窗", await dialogVisible());
    const prefilled = await dialogInput().inputValue();
    check("编辑弹窗预填当前名称（labelInput 的 getter 分支）", prefilled === "一级 2", `实际 "${prefilled}"`);

    before = await tally();
    await dialogInput().fill(TL_EDITED);
    await dlgButton("确定").click({ timeout: 6000 });
    await page.waitForTimeout(400);
    const afterEdit = await labels();
    check("编辑后新名称就位、旧名称消失（labelInput 的 setter 分支）",
      afterEdit.includes(TL_EDITED) && !afterEdit.includes("一级 2"), `回显：${afterEdit}`);
    check("编辑：变更计数增加", (await tally()) > before, `${before} -> ${await tally()}`);

    /* ── ③ 加子节点：同一套输入绑定，另一条分支（父节点 → children） ── */
    await clickNodeAction("一级 1", "添加");
    await dialogInput().fill(TL_NEW_CHILD);
    await dlgButton("确定").click({ timeout: 6000 });
    await page.waitForTimeout(400);
    check("节点「添加」出来的子节点名称与输入一致", (await labels()).includes(TL_NEW_CHILD), `回显：${await labels()}`);

    /* ── ④ 取消必须不落地（否则「确定」与「取消」等价，弹窗就是坏的） ── */
    before = await tally();
    const beforeCancelCount = await nodeCount();
    await clickNodeAction("一级 1", "编辑");
    await dialogInput().fill(TL_CANCELLED);
    await dlgButton("取消").click({ timeout: 6000 });
    await page.waitForTimeout(400);
    check("取消后弹窗关闭", !(await dialogVisible()));
    const afterCancel = await labels();
    check("取消不落地：改名没生效、节点数没变",
      !afterCancel.includes(TL_CANCELLED) && (await nodeCount()) === beforeCancelCount, `回显：${afterCancel}`);
    check("取消：变更计数不增加（没改动就不该记一笔）", (await tally()) === before, `${before} -> ${await tally()}`);

    /* ── ⑤ 删除 ── */
    before = await tally();
    const beforeRemoveCount = await nodeCount();
    await clickNodeAction(TL_NEW_ROOT, "删除");
    await page.waitForTimeout(400);
    check("删除后节点数 -1", (await nodeCount()) === beforeRemoveCount - 1,
      `${beforeRemoveCount} -> ${await nodeCount()}`);
    check("删除后该节点名消失", !(await labels()).includes(TL_NEW_ROOT), `回显：${await labels()}`);
    check("删除：变更计数增加", (await tally()) > before, `${before} -> ${await tally()}`);

    /* ── ⑥ 判据自检 ──
       对照组里那颗「故意不做任何事」的按钮只为证伪判据本身：
       点它，变更计数**必须不变** —— 否则说明判据被写成了恒真（那才是静音）。
       但「计数没变」也可能是没点中，所以同时确认这一击真的落地了（noop 计数 +1）。 */
    const tallyBeforeNoop = await tally();
    const noopBefore = await noopClicks();
    await page.locator("button.re-tree-lab__noop").first().click({ timeout: 6000 });
    await page.waitForTimeout(300);
    check("无副作用按钮的点击确实落地了（否则下面那条是空断言）",
      (await noopClicks()) === noopBefore + 1, `${noopBefore} -> ${await noopClicks()}`);
    check("判据不是恒真：点无副作用按钮，变更计数保持不变",
      (await tally()) === tallyBeforeNoop, `${tallyBeforeNoop} -> ${await tally()}`);

    check("弹窗编辑路径无运行时报错", pageErrors.length === 0, pageErrors.join(" | "));
  } catch (e) {
    if (isBrowserGone(e)) throw e;
    check("弹窗编辑路径可执行", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
  }
}

async function runBrowserSuite() {
  console.log("\n=== 2. 静态契约：每个可点按钮与图标 ===");
  try {
    await openLab();
    const items = await sweep();
    expectContract(items, "对照组页");

    /* 空页守卫：渲染失败时 items 为空，上面已判红；这里再钉一次「扫到的量够不够」，
       防止将来页面改了结构导致只剩 2~3 个元素也照样全绿 */
    check("扫到的可点元素数量足够（按钮组 + square 各档合计 ≥ 25）", items.length >= 25,
      `实际 ${items.length} 个`);

    /* 分组覆盖：每一类控件都必须真的出现，否则「全绿」可能只是没扫到 */
    const groups = new Set(items.map(i => i.group));
    for (const g of ["grp-status", "grp-shape", "grp-size-sm", "grp-size-default",
      "grp-size-lg", "grp-disabled", "sq-icon", "sq-text", "sq-vertical", "sq-large", "sq-small"]) {
      check(`对照组包含「${g}」的可点元素`, groups.has(g),
        groups.has(g) ? "" : `实际分组：${[...groups].join(", ")}`);
    }

    /* 纯图标档必须真的画出 svg 图元 —— 这条直接盯 ReIcon 的渲染 */
    const icons = items.filter(i => i.group === "sq-icon");
    check("square 纯图标档：每一项都画出了图标图元",
      icons.length > 0 && icons.every(i => i.hasSvg && i.svgShapes > 0),
      icons.map(i => `${i.name}:${i.hasSvg ? i.svgShapes + "图元" : "无svg"}`).join(", "));

    /* 按钮组与 square 选择器都是 div/label 承载的可点元素，必须有名字 */
    const noName = items.filter(i => !i.name);
    check("所有可点元素都有可访问名", noName.length === 0,
      noName.length ? noName.map(i => `${i.group}/${i.cls.slice(0, 40)}`).join(" | ") : "");
  } catch (e) {
    /* 浏览器中途没了（渲染进程无声退出等）不算产品/判据问题，向上抛给外层重试；
       其它错误照常记 FAIL —— 窄口径重试，否则「重试」就会变成藏问题的口袋。 */
    if (isBrowserGone(e)) throw e;
    check("对照组页可加载并完成静态普查", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
  }

  console.log("\n=== 3. 配色契约：全部取自系统令牌（亮色 + 暗色） ===");
  try {
    await disableTransitions();
    await runPaletteContract(false);
    await runPaletteContract(true);
    await enableTransitions();
  } catch (e) {
    await enableTransitions().catch(() => {});
    if (isBrowserGone(e)) throw e;
    check("配色契约可执行", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
  }

  console.log("\n=== 4. 行为契约：逐个点，每个都必须有可观测响应 ===");
  try {
    await openLab();

    const tally = () =>
      page.evaluate(() => Number(document.querySelector("[data-lab-tally]")?.textContent ?? 0));

    const seed = await tally();
    check("对照组页变更计数可读（[data-lab-tally] 已渲染）", Number.isFinite(seed), `初始计数=${seed}`);

    const dead = [];
    const tested = new Set();
    let cursor = 0;
    let guard = 0;

    for (;;) {
      if (++guard > 120) throw new Error("点击遍历没有收敛（疑似某个控件每点一次就多出一个新控件）");

      /* 每轮重新枚举：点一下可能整块重渲染，事先抓的清单会当场过期。
         编号在**全量**上做（见 assignKeys 的注释），禁用/已激活也要占号。 */
      const now = assignKeys(await sweep());
      /* 已激活的点了本来就不变（那才是正确行为），禁用的同理 ——
         两者各由「选中项实心主色」「禁用项不带主色底」等专项断言钉住，
         不在这里重复判，否则每轮都会稳定产出一条假死按钮。 */
      const all = now.filter(isClickableCandidate);

      const pending = all.filter(c => !tested.has(c.key));
      if (pending.length === 0) break;
      const target = pending[0];
      tested.add(target.key);

      const before = await tally();
      /* 必须用**真实鼠标点击**（locator.click），不能用 el.click()。
         实测：`.el-radio-button__inner` 是 <label> 里的 <span>，非交互内容 ——
         程序化 el.click() 不会触发 label 的「转交到关联控件」行为，
         于是点它什么也不发生；而真实鼠标点击会触发。
         用 el.click() 的后果是把一整个正常控件判成死按钮（实测按钮组全组误报），
         真缺陷反而被这批假阳性淹没。
         按采集时打下的标记定位，而不是类名/nth —— 同名控件一多就会点错。 */
      await page.locator(`[${MARK}="${target.idx}"]`).click({ timeout: 6000 });
      await page.waitForTimeout(320);
      const after = await tally();
      cursor++;
      if (after <= before) {
        dead.push(`${label(target)} 第 ${target.key.split("#")[1]} 个（变更计数 ${before}→${after}）`);
      }
    }

    /* 禁用 / 已激活 / 折叠线以下三类按契约不点，但必须**显式记 SKIP 并计数** ——
       静默跳过会让「扫过了」变成空话：真出问题时看不出是被跳过了还是压根没扫到。 */
    const final = assignKeys(await sweep());
    const disabledItems = final.filter(c => c.disabled);
    const activeItems = final.filter(c => !c.disabled && c.alreadyActive);
    const belowFold = final.filter(c => !c.disabled && !c.alreadyActive && c.clip === "below-fold");
    if (disabledItems.length) {
      skipAs(`${disabledItems.length} 个禁用态控件按契约不点（另由「禁用项不带主色底」专项钉住）`,
        disabledItems.slice(0, 6).map(i => i.name ?? i.cls.slice(0, 24)).join(" | "));
    }
    if (activeItems.length) {
      skipAs(`${activeItems.length} 个已激活控件按设计点它无变化`,
        activeItems.slice(0, 6).map(i => i.name ?? i.cls.slice(0, 24)).join(" | "));
    }
    if (belowFold.length) {
      skipAs(`${belowFold.length} 个控件在折叠线以下（需先滚动才点得到）`,
        belowFold.slice(0, 6).map(i => i.name ?? i.cls.slice(0, 24)).join(" | "));
    }
    /* 「没有控件被静默忽略」：遍历收尾后的清单里，每个可点候选要么点过，
       要么属于上面三类之一。不成立就说明遍历漏了东西却被算成了「扫过了」。 */
    const unaccounted = final.filter(c => isClickableCandidate(c) && !tested.has(c.key));
    const candidates = final.filter(isClickableCandidate);
    check("没有控件被静默忽略（每个可点候选都已点，其余都有跳过理由）",
      unaccounted.length === 0,
      unaccounted.length
        ? `${unaccounted.length} 个既没点也没给出跳过理由：${unaccounted.slice(0, 5).map(label).join(" | ")}`
        : `收尾清单 ${final.length} 个 = 可点候选 ${candidates.length}（全部已点）`
          + ` + 禁用 ${disabledItems.length} + 已激活 ${activeItems.length} + 折叠线以下 ${belowFold.length}`);

    check(`逐个点过 ${cursor} 个非禁用/非激活控件，全部有可观测响应`, dead.length === 0,
      dead.length ? `${dead.length} 颗死按钮：\n    - ${[...new Set(dead)].join("\n    - ")}` : "");
    check("点击遍历覆盖量足够（≥ 20 个控件）", cursor >= 20, `实际 ${cursor} 个`);
    check("遍历过程中无运行时报错", pageErrors.length === 0, pageErrors.join(" | "));
  } catch (e) {
    if (isBrowserGone(e)) throw e;
    check("行为契约可执行", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
  }

  console.log("\n=== 5. 判别力自检：判据必须能区分好坏 ===");
  try {
    await openLab();
    /* 注入一批已知好坏样本，交给**真实采集器 + 真实 violations()**。
       不在这里抄一份简化判据：抄的那份只测自己那几行，
       采集器的过滤与豁免逻辑一点没被验证。 */
    await page.evaluate(() => {
      const host = document.createElement("div");
      host.id = "disc-host";
      host.style.cssText =
        "position:fixed;left:0;top:0;width:420px;height:520px;z-index:9999;background:#fff;padding:8px;";
      document.body.appendChild(host);
      const icon = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M1 1h4"/></svg>`;
      const mk = (name, html, style) => {
        const b = document.createElement("button");
        b.type = "button";
        b.style.cssText = `display:inline-block;width:40px;height:40px;margin:2px;${style || ""}`;
        if (name) b.setAttribute("aria-label", name);
        b.innerHTML = html;
        host.appendChild(b);
        return b;
      };
      /* ① 好元素：有名、有盒子、图标真画出来 */
      mk("样本A-好元素", icon);
      /* ② 纯图标无名 */
      mk(null, icon);
      /* ③ 有名但盒子塌陷 */
      mk("样本C-塌陷", "文字", "width:2px;height:2px;");
      /* ④ 有名有盒子但 svg 空（图标名写错 → 空白方块） */
      mk("样本D-空图标", `<svg viewBox="0 0 24 24" width="16" height="16"></svg>`);
      /* ⑤ 被透明遮罩盖住：静态断言全过，用户却点不到 */
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:relative;width:120px;height:46px;display:inline-block;vertical-align:top;";
      host.appendChild(wrap);
      const cov = document.createElement("button");
      cov.type = "button";
      cov.setAttribute("aria-label", "样本E-被盖住");
      cov.style.cssText = "position:absolute;left:0;top:0;width:40px;height:40px;";
      cov.innerHTML = icon;
      wrap.appendChild(cov);
      const over = document.createElement("div");
      over.style.cssText = "position:absolute;left:0;top:0;width:120px;height:46px;";
      wrap.appendChild(over);
      /* ⑥ 完全透明：采集阶段就该被滤掉 */
      mk("样本H-透明", "文字", "opacity:0;");

      /* ⑦ 装饰字形（白名单正样本）：combobox 的下拉箭头自身无名是对的，
            名字由它所在的 combobox 提供。走 .el-select__caret 这条选择器被采集到。 */
      const caret = document.createElement("i");
      caret.className = "el-icon el-select__caret el-select__icon";
      caret.style.cssText = "display:inline-block;width:20px;height:20px;margin:2px;";
      caret.innerHTML = icon;
      host.appendChild(caret);

      /* ⑧ 白名单必须**精确匹配类名**。样本必须是可采集元素，否则「没被误报」
            只是因为压根没采到 —— 空断言。
            用 <button class="el-select__caret2">：它走 button 这条选择器被采集到，
            类名是豁免项的前缀扩展。若判据写成「前缀包含」，它会被一起放过。 */
      const lookalike = document.createElement("button");
      lookalike.type = "button";
      lookalike.className = "el-icon el-select__caret2";
      lookalike.style.cssText = "display:inline-block;width:40px;height:40px;margin:2px;";
      lookalike.innerHTML = icon;
      host.appendChild(lookalike);
    });

    const disc = await page.evaluate(`(${COLLECT})("#disc-host")`);
    const bad = violations(disc);
    const of = n => bad.filter(v => v.includes(`[${n}]`)).join(" / ");

    check("判据放过合格样本（好元素零违规）", of("样本A-好元素") === "",
      of("样本A-好元素") || "无违规");
    check("判据抓住：纯图标无名", of("样本B") !== "" || bad.some(v => v.includes("没有可访问名")),
      bad.filter(v => v.includes("没有可访问名")).join(" | ") || "没抓到");
    check("判据抓住：盒子塌陷", of("样本C-塌陷") !== "", of("样本C-塌陷") || "没抓到");
    check("判据抓住：svg 没有图元", of("样本D-空图标") !== "", of("样本D-空图标") || "没抓到");
    check("判据抓住：被元素盖住点不到", of("样本E-被盖住") !== "", of("样本E-被盖住") || "没抓到");
    check("判据放过：完全透明的元素不进清单",
      !disc.some(c => c.name === "样本H-透明"), "透明元素被收进来了");

    /* 白名单边界：按**类名 token** 精确比对，不用子串 ——
       子串匹配会把 el-select__caret2 也算进 el-select__caret，
       于是「放过了」与「抓住了」互相污染，两条断言一起失真。 */
    const hasClass = (c, cls) => c.cls.split(/\s+/).includes(cls);
    const exemptItems = disc.filter(c => hasClass(c, "el-select__caret"));
    const lookItems = disc.filter(c => hasClass(c, "el-select__caret2"));
    check("白名单边界样本确实被采集到（否则下面两条是空断言）",
      exemptItems.length === 1 && lookItems.length === 1,
      `caret=${exemptItems.length} caret2=${lookItems.length}`);
    check("判据放过：combobox 下拉箭头（装饰字形，名字由外层给）",
      exemptItems.length > 0 && !bad.some(v => v.startsWith(label(exemptItems[0]))),
      bad.filter(v => v.includes("caret")).join(" | ") || "未误报");
    check("判据抓住：类名是豁免项前缀扩展的无名图标（白名单必须精确匹配）",
      lookItems.length > 0 && bad.some(v => v.startsWith(label(lookItems[0]))),
      bad.filter(v => v.includes("caret2")).join(" | ") || "没抓到（白名单过于宽松）");

    await page.evaluate(() => document.getElementById("disc-host")?.remove());
  } catch (e) {
    if (isBrowserGone(e)) throw e;
    check("判别力自检可执行", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
  }

  console.log("\n=== 6. 真实宿主页：被改组件在真实宿主里也合契约 ===");
  for (const host of HOSTS) {
    try {
      await openPage(host.hash);
      await waitForStable(host.scope);
      const items = await sweep(host.scope);
      expectContract(items, host.name);

      /* 宿主里必须真的渲染出被改的组件。**不做静默跳过**：
         之前写成 `if (square.length)`，而宿主还没渲染完时 square 为 0，
         整条断言被跳过、汇总里长得像「全绿」—— 采不到东西和东西合规
         必须区分开，否则这条覆盖是假的。 */
      const square = items.filter(c => c.cls.includes("re-select-square__item"));
      const radios = items.filter(c => c.cls.includes("el-radio-button__inner"));
      check(`${host.name}：渲染出了 square 图标选择项（否则本页覆盖不到被改组件）`,
        square.length > 0, `square ${square.length} 项`);
      if (square.length) {
        const noName = square.filter(c => !c.name);
        check(`${host.name}：square 选择项都有可访问名且点得到`, noName.length === 0,
          noName.length ? noName.map(label).join(" | ") : `${square.length} 项全合规`);
      }
      check(`${host.name}：渲染出了按钮组分档（否则 radio 布局覆盖不到）`,
        radios.length > 0, `按钮组分档 ${radios.length} 项`);
      if (radios.length) {
        const noName = radios.filter(c => !c.name);
        check(`${host.name}：按钮组每一档都有可访问名`, noName.length === 0,
          noName.length ? noName.map(label).join(" | ") : `${radios.length} 项全合规`);
      }
      console.log(`  [info] ${host.name}：可点 ${items.length} 个（square ${square.length} / 按钮组 ${radios.length}）`);
    } catch (e) {
      if (isBrowserGone(e)) throw e;
      check(`${host.name}：可加载并完成静态普查`, false,
        String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
    }
  }

  /* 弹窗编排单列一节：模态会盖住整页，不能并进上面的 `.lab` 逐点遍历 */
  await runTreeDialogSection();
}

/**
 * 跑浏览器段，**只在浏览器自己崩掉时**重开重试。
 *
 * <p>为什么要重试：实测本机 Edge 无头外壳会跑到一半无声退出
 * （{@code Target page, context or browser has been closed}），
 * 一整轮验收因此作废。这种环境抖动与产品、判据都无关，
 * 但一个随机崩的验收脚本等于不可交付 —— 所以要重试。</p>
 *
 * <p>为什么口径必须窄：只有 {@link isBrowserGone} 命中的错误才重试，
 * 其余错误一律照常记 FAIL。否则「重试」会变成把真缺陷刷成绿的口袋。</p>
 */
const MAX_ATTEMPTS = Number(process.env.LAB_ATTEMPTS || 3);

/**
 * 源码契约（第 1 段）的结果必须在每次重置前存下来。
 *
 * <p>不存的后果很严重：源码段跑在浏览器段**之前**，而重试循环每轮都把
 * {@code pass/fail/failures} 清零 —— 于是这 7 条既不计入 PASS，
 * 也**从失败明细里消失**。一个只让样式写死色值的回归，会因此报
 * {@code ALL_PASS}。验收脚本自己吞掉失败，比没有验收更糟。</p>
 */
const SRC_PASS = pass;
const SRC_FAIL = fail;
const SRC_FAILURES = [...failures];

let attempt = 0;
for (;;) {
  attempt++;
  pass = SRC_PASS;
  fail = SRC_FAIL;
  warned = 0;
  skip = 0;
  failures = [...SRC_FAILURES];
  warnings = [];

  /* 启动也必须加硬超时：launch() 在浏览器进程被外部杀掉时返回**永不 settle** 的
     Promise，事件循环随之空掉，Node 会以「unsettled top-level await」+ 退出码 13
     直接结束 —— 脚本连失败清单都来不及打印，验收结果既非 PASS 也非 FAIL。 */
  try {
    await withTimeout(launchBrowser(), 60000, "启动浏览器会话");
  } catch (e) {
    if (attempt >= MAX_ATTEMPTS) {
      check("浏览器会话可用", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
      break;
    }
    console.log(`\n  [note] 启动浏览器会话失败（${String(e.message || e).slice(0, 120)}），重试`);
    await sleep(1500);
    attempt++;
    continue;
  }
  try {
    await runBrowserSuite();
    await browser.close();
    break;
  } catch (e) {
    await browser.close().catch(() => {});
    if (attempt < MAX_ATTEMPTS && isBrowserGone(e)) {
      console.log(`\n  [note] 浏览器在第 ${attempt} 轮中途退出（环境抖动，非产品问题），重开再跑`);
      console.log(`         ${String(e.message || e).replace(/\s+/g, " ").slice(0, 200)}`);
      await sleep(1500);
      continue;
    }
    check("浏览器段可执行", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
    break;
  }
}

/* ═══════════════════ 汇总 ═══════════════════ */

console.log(`\nRE_CONTROLS_PASS=${pass} FAIL=${fail} WARN=${warned} SKIP=${skip}`
  + (attempt > 1 ? ` ATTEMPTS=${attempt}` : ""));
if (warnings.length) {
  console.log("告警明细（非缺陷，根因在上游令牌）：");
  for (const w of warnings) console.log(`  - ${w}`);
}
if (failures.length) {
  console.log("失败明细：");
  for (const f of failures) console.log(`  - ${f}`);
}
console.log(fail === 0 ? "RE_CONTROLS_ALL_PASS" : "RE_CONTROLS_HAS_FAIL");

process.exitCode = fail > 0 ? 1 : 0;
