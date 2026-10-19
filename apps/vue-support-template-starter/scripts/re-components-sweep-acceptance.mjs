/**
 * 演示站**全量组件页**可点击按钮与图标的生产级普查。
 *
 * <p>需求原话：「每个可以点击的按钮，图标都要测试」。单组件验收
 * {@code re-controls-acceptance.mjs} 只覆盖了本次交付的两个组件（按钮组 /
 * square 图标选择器），其余 66 个 Re 组件的可点元素一直没被同一套判据扫过。
 * 这一份把同一套 5 条契约铺到注册表里的<b>每一个</b>组件调试页。</p>
 *
 * <p><b>为什么扫的是演示站调试页</b>：那是每个组件在仓库里唯一稳定、无后端依赖、
 * 每次进页面都有真实内容的宿主。生产页面要登录、要后端台账，离线跑不起来。</p>
 *
 * <p><b>本轮只跑静态契约，不跑「逐个点」</b>：死按钮判据需要「点了之后有可观测
 * 副作用」的精确信号（对照组页那种变更计数）。调试页上的控件点下去常常不改任何
 * 可见状态（例如给预览区传一个当前布局用不上的 prop），套上去会产出大批假死按钮，
 * 反而把真缺陷淹没。逐点遍历由单组件验收在有精确信号的页面上承担。</p>
 *
 * <p><b>组件清单从注册表源文件现读</b>，不硬编码：注册表加了组件，本轮就多扫一页；
 * 注册表格式变了导致解析不到名字，这里会<b>直接判 FAIL</b>而不是静默扫 0 页。</p>
 *
 * <h3>长跑的健壮性（以下每一条都是实测撞出来的，不是预先设计）</h3>
 * <ul>
 *   <li><b>按批回收会话</b>：连续加载几十个页面后，Edge 无头外壳会无声退出。
 *       与其等它崩，不如每 {@code RECYCLE_EVERY} 页主动关掉浏览器重开。</li>
 *   <li><b>崩溃后从当页续跑</b>：会话崩了不代表前面扫过的页作废。结果表与
 *       「已扫集合」挂在会话之外，重开会话从当前页继续，而不是整轮重来。</li>
 *   <li><b>会话启动硬超时</b>：{@code chromium.launch()} 在浏览器进程被外部杀掉时
 *       会返回一个**永不 settle** 的 Promise；此时事件循环空掉，Node 打印
 *       「Detected unsettled top-level await」并以**退出码 13** 结束 ——
 *       既没有 PASS 也没有 FAIL，连「哪一页没测」都没留下。</li>
 *   <li><b>单页正文硬超时</b>：见 {@link PER_PAGE_MS}。被测页把渲染进程主线程占死时
 *       （实测 ReGraphForce 的力导向仿真把单个渲染进程吃到约 5GB），
 *       {@code page.evaluate} 永不返回。</li>
 *   <li><b>服务不可达与页面不合契约分开判</b>：preview 被内存压力打死时，
 *       每页都会连接失败；若照常说「某组件调试页可加载 FAIL」，
 *       一次基础设施故障会被读成几十个组件同时坏掉。</li>
 *   <li><b>弹层打开时改判弹层内元素，并要求弹层有退出路径</b>：遮罩挡住页面是
 *       弹层的设计意图，不是缺陷；但弹层若关不掉，整页控件就永远点不到。</li>
 * </ul>
 *
 * <p><b>基址</b>用 {@code LAB_BASE_URL} 覆盖；{@code ONLY=ReSelect,ReSwitch}
 * 只扫指定组件，便于把一次失败原地复现，也用于把全量拆成多个进程分片跑
 * （本机 33GB 内存撑不住单进程连扫 12 个图谱/3D 页）；{@code RECYCLE_EVERY} 调批次大小；
 * {@code PER_PAGE_MS} 调单页上限。</p>
 *
 * <p>退出码 0 = 全过（{@code RE_COMPONENTS_ALL_PASS}），1 = 有 FAIL。</p>
 *
 * @author CH
 * @since 2026-10-15
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  launchBrowser, openPage, makeSweep, waitForStable, expectContract,
  createReporter, runDiscriminativeCheck, isBrowserGone, isServiceUnreachable,
  withTimeout, closeQuietly, CLICKABLE_SEL,
} from "./lib/clickable-sweep.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(HERE, "..");

/* 空串也要回退：`??` 只处理 null/undefined，shell 里传 `VAR=` 得到的是空串 */
const BASE = process.env.LAB_BASE_URL || "http://127.0.0.1:8090";
const VIEWPORT = { width: 1560, height: 1000 };
const MARK = "data-comp-sweep";

/** 只扫调试页的「预览 + 参数面板」，排除全局页头（它是应用外壳，不是组件的一部分） */
const SCOPE = ".debug";

/** 每加载这么多页主动回收一次浏览器会话 */
const RECYCLE_EVERY = Number(process.env.RECYCLE_EVERY || 8);

/** 连续这么多次「浏览器没了 / 起不来」就放弃（防死循环） */
const MAX_BROWSER_CRASHES = Number(process.env.MAX_BROWSER_CRASHES || 12);

/**
 * 单页正文的硬上限（不含 openPage 内部的就绪重试）。
 *
 * <p>为什么必须有：{@code openPage} 只给「等页面外壳出现」设了上限，而**正文**
 * （{@code resolveScope} + {@code waitForStable} + 采集）原先没有任何上限。
 * 一旦被测页把渲染进程的主线程占死，{@code page.evaluate} 就不会返回，
 * 驱动进程会一直等，直到被系统 / V8 杀掉 —— 整轮以退出码 -1 / 134 结束，
 * 既没有 PASS 也没有 FAIL。加界之后这种页面会变成一条**明确的、带原因的**
 * 未验证记录。</p>
 */
const PER_PAGE_MS = Number(process.env.PER_PAGE_MS || 120000);

/**
 * 就绪等待上限（openPage 内部每次尝试的上限，默认 3 次）。
 *
 * <p><b>为什么默认值从 45s 提到 90s</b>：实测本机演示站的**应用挂载**本身就慢且波动大
 * （`/debug/ReGraphForce` 预热后约 18s 才挂上，而同一时刻对照组 `/debug/ReSelect`
 * 35s 仍挂不上）；再叠加 Vite 依赖预构建过期返回 504 的情形，45s 落在临界点上，
 * 会把「挂载慢」误报成「页面坏」—— 实测 `ReGraphForce` 就因此被误判多轮，
 * 我甚至一度把根因错判成组件里的同步布局。这个默认值必须留出余量，
 * 否则验收的假红会掩盖真结论。</p>
 *
 * <p>调大不是万能药：真的挂死（主线程被占死）时，加大只会拖长等待，
 * 所以另有 {@code PER_PAGE_MS} 兜住单页总时长。</p>
 */
const READY_TIMEOUT_MS = Number(process.env.READY_TIMEOUT_MS || 90000);

/** 从注册表源文件现读组件名（不硬编码，避免与主页卡片脱节） */
function readRegistryNames() {
  const file = path.join(APP_ROOT, "src/data/componentRegistry.ts");
  const src = readFileSync(file, "utf8");
  const names = [...src.matchAll(/\{\s*name:\s*"([^"]+)"/g)].map(m => m[1]);
  /* 去重：注册表里若有重名条目，同一页会被扫两遍，结论会被重复计数 */
  return [...new Set(names)];
}

const ALL = readRegistryNames();
/* ONLY=ReSelect,ReSwitch 只扫指定组件，便于把一次失败原地复现 */
const ONLY = (process.env.ONLY || "").split(",").map(s => s.trim()).filter(Boolean);
const TARGETS = ONLY.length ? ALL.filter(n => ONLY.includes(n)) : ALL;

console.log("=== 演示站全量组件页按钮/图标普查 ===");
console.log(`  注册表组件 ${ALL.length} 个，本轮扫 ${TARGETS.length} 个，每 ${RECYCLE_EVERY} 页回收一次会话`
  + `（就绪等待 ${READY_TIMEOUT_MS}ms × 3，单页上限 ${PER_PAGE_MS}ms）`);
if (ONLY.length) console.log(`  [范围过滤] 只扫 ${ONLY.join(", ")}，本轮结果不覆盖全量`);
if (TARGETS.length === 0) {
  console.log("  !! 组件清单为空：注册表格式可能变了，本轮什么都没扫，不作数");
  process.exit(3);
}

const report = createReporter();
/** 每页一行：便于一眼看出问题集中在哪 */
const rows = [];
/** 已扫过的页：续跑时跳过，避免重开会话把同一页重复计数 */
const done = new Set();
let totalClickable = 0;
let sessions = 0;

/**
 * 实际普查作用域：弹层开着就只判弹层里的元素。
 *
 * <p>为什么必须按弹层改作用域：弹层打开后**页面上其余控件本来就被遮罩挡住**，
 * 命中测试会把它们整批判成「点不到」。实测 ReFilePicker 调试页自带弹层，
 * 11 个元素集体误报，而遮罩挡住页面正是弹层的设计意图 ——
 * 这不是缺陷，是判据没看场景（house 的 {@code recron-buttons.spec.ts} 早就记过这一条）。</p>
 *
 * <p>注意只认 {@code .el-overlay}（对话框 / 抽屉的模态层）。下拉浮层
 * {@code el-popper} 不在里面，也不会盖住整页，不需要改作用域。</p>
 */
const resolveScope = page => page.evaluate(fallback => {
  const overlay = [...document.querySelectorAll(".el-overlay")]
    .find(o => {
      if (o.classList.contains("is-hidden")) return false;
      const r = o.getBoundingClientRect();
      const cs = getComputedStyle(o);
      return r.height > 0 && r.width > 0 && cs.display !== "none" && cs.visibility !== "hidden";
    });
  return overlay ? ".el-overlay" : fallback;
}, SCOPE);

/**
 * 弹层开着时，顺带验两件事。
 *
 * <p><b>1. 弹层有没有退出路径。</b>光把被挡住的页面控件豁免掉是不够的：
 * 弹层若一打开就关不掉（没有关闭 ×、没有取消、点遮罩无效），整页控件将**永远**
 * 点不到 —— 那是真缺陷，不是「弹层按设计遮挡」。所以必须确认弹层里存在可点的
 * 退出控件。</p>
 *
 * <p><b>2. 挡住了多少页面控件。</b>把数量打印出来，而不是默默缩掉作用域 ——
 * 「扫过了」必须让人看得出它实际扫的是哪一块。</p>
 */
const inspectOverlay = page => page.evaluate(sel => {
  const overlay = [...document.querySelectorAll(".el-overlay")]
    .find(o => {
      if (o.classList.contains("is-hidden")) return false;
      const r = o.getBoundingClientRect();
      return r.height > 0 && r.width > 0;
    });
  if (!overlay) return null;
  const visible = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden"
      && Number(cs.opacity) !== 0 && cs.pointerEvents !== "none";
  };
  const behind = [...document.querySelectorAll(sel)].filter(el => visible(el) && !overlay.contains(el));
  const exits = [...overlay.querySelectorAll('button,[role="button"],.el-dialog__headerbtn')]
    .filter(b => !b.disabled && !b.classList.contains("is-disabled") && visible(b));
  return {
    behind: behind.length,
    exits: exits.length,
    exitNames: exits.slice(0, 4).map(b =>
      (b.getAttribute("aria-label") || b.getAttribute("title") || (b.textContent || "").trim() || "(无名)").slice(0, 20)),
  };
}, CLICKABLE_SEL);

/**
 * 判别力自检单独一段短会话先跑。
 *
 * <p>先钉判据再扫全量：判据不可信的话，68 页的「全绿」一点意义都没有。</p>
 *
 * <p>它只需要一个能执行脚本的页面，所以等 {@code body} 即可 —— 之前等
 * {@code .lab, .debug} 在首页上永远等不到，白等两次超时才继续。</p>
 */
console.log("\n=== 判别力自检（先跑，判据不可信则后面全部无意义）===");
{
  const { browser, page } = await withTimeout(launchBrowser({ viewport: VIEWPORT }), 60000, "启动判别力自检会话");
  sessions++;
  try {
    await openPage(page, BASE, "/home", "body", { attempts: 1 });
    await withTimeout(runDiscriminativeCheck(page, makeSweep(page, MARK), report), 90000, "判别力自检");
  } catch (e) {
    if (isBrowserGone(e) || isServiceUnreachable(e)) {
      console.log("  [note] 判别力自检期间浏览器或服务不可用，重开再试一次");
      const retry = await withTimeout(launchBrowser({ viewport: VIEWPORT }), 60000, "启动判别力自检重试会话");
      sessions++;
      try {
        await openPage(retry.page, BASE, "/home", "body", { attempts: 1 });
        await withTimeout(runDiscriminativeCheck(retry.page, makeSweep(retry.page, MARK), report), 90000, "判别力自检");
      } catch (e2) {
        report.check("判别力自检可执行", false, String(e2.message || e2).replace(/\s+/g, " ").slice(0, 300));
      } finally {
        await closeQuietly(retry.browser);
      }
    } else {
      report.check("判别力自检可执行", false, String(e.message || e).replace(/\s+/g, " ").slice(0, 300));
    }
  } finally {
    await closeQuietly(browser);
  }
}

console.log(`\n=== 逐页普查（${TARGETS.length} 个组件） ===`);
let i = 0;
let crashes = 0;
/** 被测服务中途不可达：只记一条基础设施故障，不把连接失败复制成 N 条页面缺陷 */
let serviceDown = false;

while (i < TARGETS.length) {
  /* 会话启动必须加硬超时：launch() 在浏览器进程被外部杀掉时返回**永不 settle** 的
     Promise，事件循环随之空掉，Node 会以「unsettled top-level await」+ 退出码 13
     直接结束 —— 连「还剩几页没扫」都来不及输出，验收结果既非 PASS 也非 FAIL。 */
  let session;
  try {
    session = await withTimeout(launchBrowser({ viewport: VIEWPORT }), 60000, "启动浏览器会话");
  } catch (e) {
    crashes++;
    console.log(`  [note] 启动浏览器会话失败/超时（累计 ${crashes} 次）：${String(e.message || e).slice(0, 120)}`);
    if (crashes >= MAX_BROWSER_CRASHES) {
      report.check("浏览器会话可用", false,
        `连续 ${crashes} 次启动不了，剩余 ${TARGETS.length - i} 页未扫（环境问题，非产品问题）`);
      break;
    }
    continue;
  }
  sessions++;
  const { browser, page } = session;
  const sweep = makeSweep(page, MARK);

  try {
    for (; i < TARGETS.length; i++) {
      const name = TARGETS[i];
      if (done.has(name)) continue;

      await openPage(page, BASE, `/debug/${name}`, ".debug", { readyTimeout: READY_TIMEOUT_MS });
      /* 正文整体加硬上限：渲染进程被占死时，绝不允许驱动无限期等下去（见 PER_PAGE_MS 说明） */
      await withTimeout((async () => {
        /* 弹层打开时改判弹层内的元素（见 resolveScope 的说明） */
        const scope = await resolveScope(page);
        await waitForStable(sweep, scope, { maxMs: 15000 });
        const items = await sweep(scope);
        const bad = expectContract(report, items, name);
        totalClickable += items.length;
        rows.push({ name, n: items.length, bad: bad.length, scope });
        done.add(name);
        report.info(name, `可点 ${items.length} 个（作用域 ${scope}），不合规 ${bad.length} 项`);

        if (scope !== SCOPE) {
          const ov = await inspectOverlay(page);
          if (ov) {
            /* 弹层挡住了多少页面控件：打印出来，而不是默默缩掉作用域 */
            report.note(`${name}：弹层挡住了 ${ov.behind} 个页面控件（按弹层设计豁免「点不到」）`);
            /* 弹层没有可点的退出控件 = 整页控件永远点不到，这是真缺陷 */
            report.check(`${name}：弹层有可点的退出路径`, ov.exits > 0,
              ov.exits > 0 ? `可点退出控件 ${ov.exits} 个：${ov.exitNames.join(" / ")}`
                : `弹层里没有可点的关闭/取消控件，${ov.behind} 个页面控件将永远点不到`);
          }
        }
      })(), PER_PAGE_MS, `${name} 单页普查`).catch(e => {
        /* 超时不等于判定它是缺陷，但也**绝不能算通过**：
           「每个可点按钮都被测过」这条要求下，没验证过就是没验证过。
           所以记 FAIL 并在文案里写清性质，避免被读成「组件坏了」。 */
        const reason = String(e.message || e).replace(/\s+/g, " ").slice(0, 160);
        report.check(`${name}：单页普查完成（未被验证）`, false,
          `${reason}；该页未通过本项验证（超时多为渲染进程被占死，非缺陷判定）`);
        rows.push({ name, n: 0, bad: -2, scope: SCOPE });
        done.add(name);
        /* 页面可能已不可用，重开会话继续下一页 */
        throw new Error("__PER_PAGE_ABORT__");
      });

      /* 主动回收：不等它崩。构造性 break 后由外层重开会话、
         从下一页继续（i 已自增）。 */
      if ((i + 1) % RECYCLE_EVERY === 0) {
        i++;
        break;
      }
    }
  } catch (e) {
    if (String(e?.message ?? "") === "__PER_PAGE_ABORT__") {
      /* 单页超时已在内层记过账（含「未通过验证」的明确文案），
         这里只负责换一个干净会话、从下一页继续 —— 那个页面此刻多半已不可用。 */
      i++;
      break;
    } else if (isBrowserGone(e)) {
      crashes++;
      console.log(`  [note] 浏览器在第 ${i + 1} 个组件（${TARGETS[i]}）前后退出`
        + `（累计 ${crashes} 次），重开会话从该页继续`);
      if (crashes >= MAX_BROWSER_CRASHES) {
        report.check("浏览器连续退出次数未超上限", false,
          `连崩 ${crashes} 次，放弃剩余 ${TARGETS.length - i} 页（疑似环境问题，非产品问题）`);
        break;
      }
    } else if (isServiceUnreachable(e)) {
      /* 被测服务不可达：这是**基础设施**故障，不是页面不合契约。
         继续跑只会把同一个连接失败复制成 N 条「某组件调试页可加载 FAIL」，
         看起来像几十个组件坏了，排查方向会被彻底带偏 ——
         实测 preview 被内存压力打死一次，后续分片共产出 8 条这种假缺陷。
         所以只记一条、说明剩多少页没扫，然后立刻停。 */
      report.check("被测服务可达", false,
        `${String(e.message || e).replace(/\s+/g, " ").slice(0, 180)}；`
        + `剩余 ${TARGETS.length - i} 页未扫（基础设施故障，非产品缺陷）`);
      serviceDown = true;
      break;
    } else {
      /* 单页打不开（组件崩溃 / 依赖缺失）不许静默跳过 */
      report.check(`${TARGETS[i]}：调试页可加载`, false,
        String(e.message || e).replace(/\s+/g, " ").slice(0, 200));
      rows.push({ name: TARGETS[i], n: 0, bad: -1, scope: SCOPE });
      done.add(TARGETS[i]);
      i++;
    }
  } finally {
    await closeQuietly(browser);
  }
}

console.log("\n=== 逐页明细 ===");
for (const r of rows) {
  const mark = r.bad === -1 ? "PAGE-FAIL"
    : r.bad === -2 ? "TIMEOUT(未验证)"
      : r.bad === 0 ? "ok"
        : `VIOLATION(${r.bad})`;
  const sc = r.scope === SCOPE ? "" : `  [作用域 ${r.scope}]`;
  console.log(`  ${r.name.padEnd(22)} 可点 ${String(r.n).padStart(3)}  ${mark}${sc}`);
}

console.log(`\n  合计：${done.size} / ${TARGETS.length} 页，${totalClickable} 个可点元素，会话 ${sessions} 个`);
report.check("扫到的页数与目标一致（中途没被打断）", done.size === TARGETS.length,
  serviceDown
    ? `扫了 ${done.size} / 目标 ${TARGETS.length}：被测服务中途不可达，剩余页未扫（基础设施故障）`
    : `扫了 ${done.size} / 目标 ${TARGETS.length}`);

process.exitCode = report.summary("RE_COMPONENTS");
