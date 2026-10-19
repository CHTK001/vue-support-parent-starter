/**
 * 可点元素普查 —— 共享判据与浏览器生命周期。
 *
 * <p>抽成库的理由：有两处普查要用**同一份**判据（单组件验收
 * {@code re-controls-acceptance.mjs} 与全量组件普查
 * {@code re-components-sweep-acceptance.mjs}）。判据一旦有两份副本，
 * 改一条规则只改到其中一份，两边的「全绿」就不可比了 —— 而这类验收的
 * 全部价值恰恰在于「判据可信」。同理，连**判别力自检**也只需写一份。</p>
 *
 * <p><b>共享范围（2026-10-16 已完成合并）</b>：{@code re-controls-acceptance.mjs} 已改为
 * 从本文件 import 判据与采集器（{@code violations / COLLECT=collectFn(MARK) / label /
 * assignKeys / isClickableCandidate / isBrowserGone / sleep} 等），本地副本已删除。
 * 两个脚本现在跑的是**同一份**判据，不再存在各自漂移的可能。</p>
 *
 * <p>仍各自保留的只有**浏览器编排**（{@code launchBrowser}、{@code sweep}、
 * {@code openPage}、{@code waitForStable}）：两个脚本的调用形状不同
 * （单组件脚本用模块级 {@code browser/page}，全量普查脚本要按分片回收会话），
 * 强行统一会改动调用点、把已全绿的套件置于风险中，收益却只是少几十行编排代码。
 * 判据一致才是关键，编排重复是可接受的。</p>
 *
 * <p>计数用工厂而不是模块级变量：模块级变量在重试时一 reset 就会把
 * 之前跑完的段落结果抹掉（曾导致源码契约的 7 条从汇总里消失，
 * 只让样式写死色值的回归也报 ALL_PASS）。工厂把状态关进闭包，
 * 重试就是「新建一个 reporter」，物理上不可能互相污染。</p>
 *
 * @author CH
 * @since 2026-10-15
 */

import { chromium } from "playwright";

/**
 * 可点元素选择器。
 *
 * <p>刻意包含 Element Plus 与 Re 系组件的内部点击目标：只查原生 {@code button}
 * 会把整批漏掉（按钮组的 {@code .el-radio-button__inner} 是 label 内的 span，
 * square 选择器的 {@code .re-select-square__item} 是 div，
 * ReSwitch 的方形开关是 {@code role="switch"} 的 button）。</p>
 */
export const CLICKABLE_SEL = [
  "button",
  '[role="button"]',
  '[role="switch"]',
  "a[href]",
  ".el-radio-button__inner",
  ".re-select-square__item",
  ".el-input__clear",
  ".el-select__caret",
  ".el-tag__close",
].join(",");

/**
 * 装饰字形白名单（**裸类名**，精确匹配）。
 *
 * <p>只有「自己不是交互控件、名字由外层控件提供」的图标可以进来。这里收的是
 * combobox 里的下拉箭头：它只是 select 的一个装饰字形，可访问名由所在 combobox
 * 提供，自己再挂 aria-label 反而重复。</p>
 *
 * <p>刻意用精确类名而不是「前缀包含」：将来多出任何一个真的无名图标，
 * 用例照样会红 —— 豁免名单不允许变成漏网的口子（判别力自检里钉了这条）。</p>
 */
export const DECORATIVE_EXEMPT = new Set(["el-select__caret"]);

/** 是否在装饰字形白名单里（按任一类名精确命中） */
export const isExempt = c => c.cls.split(/\s+/).some(k => DECORATIVE_EXEMPT.has(k));

/** 短标识：失败信息里要能一眼认出是哪一个 */
export const label = c => `${c.group}/${c.cls.split(/\s+/).slice(0, 2).join(".") || "(无类名)"}[${c.name ?? "无名"}]`;

/**
 * 给一份清单按「分组 + 类名 + 名字 + 同类序号」编 key。
 *
 * <p>必须先在**全量**上编，再做筛选：如果先筛掉禁用/已激活再编，
 * 这些元素就不占号，下一轮的序号会整体前移，「本轮点过」的 key 与下一轮
 * 采到的 key 对不上 → 同一个控件被点两次、另一些永远轮不到。</p>
 */
export function assignKeys(items) {
  const seen = new Map();
  for (const c of items) {
    const base = `${c.group}|${c.cls}|${c.name ?? ""}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    c.key = `${base}#${n}`;
  }
  return items;
}

/** 可点的候选：排除禁用、已激活、折叠线以下 */
export const isClickableCandidate = c => !c.disabled && !c.alreadyActive && c.clip !== "below-fold";

/**
 * 五条静态契约的判据。
 *
 * <ol>
 *   <li>非塌陷：宽高都 ≥ 8px —— 看得见才点得到；</li>
 *   <li>有名字：交互控件必须有 aria-label / title / 文本内容（装饰字形走白名单）；</li>
 *   <li>图标真画出来了：带 svg 的必须有图元且自身盒子非零
 *       —— 抓「图标名写错 → 渲染出空白方块」这类静默失效；</li>
 *   <li>没被裁掉：{@code overflow:hidden} 裁掉且滚不出来 = 用户根本够不着；</li>
 *   <li>点得到：{@code elementFromPoint} 命中测试 —— 被别的元素盖住的按钮
 *       在静态断言里完全正常，用户却点不到。</li>
 * </ol>
 */
export function violations(items) {
  const bad = [];
  for (const c of items) {
    if (c.w < 8 || c.h < 8) bad.push(`${label(c)} 盒子塌陷 ${c.w}×${c.h}`);
    /* 名字：交互控件必须有名。装饰字形走白名单豁免（只有这一类能豁免） */
    if (!c.name && !isExempt(c)) bad.push(`${label(c)} 没有可访问名`);
    if (c.hasSvg && c.svgShapes === 0) bad.push(`${label(c)} svg 里没有图元（图标没画出来）`);
    if (c.hasSvg && (c.svgW < 4 || c.svgH < 4)) bad.push(`${label(c)} 图标盒子塌陷 ${c.svgW}×${c.svgH}`);
    if (c.clip === "clipped") bad.push(`${label(c)} 被 overflow:hidden 裁掉且滚不出来`);
    if (c.covered) bad.push(`${label(c)} 被别的元素盖住，点不到`);
  }
  return bad;
}

/**
 * 页内枚举器（返回**字符串**，供 page.evaluate 用）。
 *
 * <p>{@code mark} 可指定打标记的属性名；采集与点击必须用同一份标记属性，
 * 否则点到的不是当初采到的那个。</p>
 */
export function collectFn(mark = "data-lab-sweep") {
  return `
(scope) => {
  /* 先清掉上一轮的标记再重打：DOM 未变时标记会残留，
     序号会与实际元素错位 */
  document.querySelectorAll('[${mark}]').forEach(el => el.removeAttribute('${mark}'));
  const SEL = ${JSON.stringify(CLICKABLE_SEL)};
  const root = scope ? document.querySelector(scope) : document;
  if (!root) return [];

  const shapeCount = svg =>
    svg.querySelectorAll('path,rect,circle,line,polyline,polygon,ellipse').length;

  /**
   * 元素中心是否落在某个祖先的裁切区。
   *
   * <p>能滚的祖先（auto/scroll/overlay）→ below-fold：用户滚一下就点得到，
   * 不是缺陷；overflow:hidden 且滚不出来 → clipped：真的看不见，照罚。
   * 不分这两档的话，中心点命中测试会把折叠线以下误报成「被盖住」
   * （实测弹层里 4 颗步进箭头里有 2 颗这样集体误报）。</p>
   */
  const clipState = (el, cx, cy) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const yScroll = cs.overflowY, xScroll = cs.overflowX;
      const yCan = /auto|scroll|overlay/.test(yScroll), xCan = /auto|scroll|overlay/.test(xScroll);
      const yClip = /auto|scroll|overlay|hidden|clip/.test(yScroll) && p.scrollHeight > p.clientHeight;
      const xClip = /auto|scroll|overlay|hidden|clip/.test(xScroll) && p.scrollWidth > p.clientWidth;
      if (!yClip && !xClip) continue;
      const pr = p.getBoundingClientRect();
      const outY = yClip && (cy < pr.top || cy > pr.bottom);
      const outX = xClip && (cx < pr.left || cx > pr.right);
      if (!outY && !outX) continue;
      return ((yClip && yCan) || (xClip && xCan)) ? 'below-fold' : 'clipped';
    }
    return 'none';
  };

  return [...root.querySelectorAll(SEL)]
    .map((el, idx) => ({ el, idx }))
    .filter(({ el }) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (Number(cs.opacity) === 0) return false;
      if (cs.pointerEvents === 'none') return false;
      return true;
    })
    .map(({ el, idx }) => {
      /* 打稳定标记：点击时按这个属性定位到**同一个**元素。
         不用类名/文本定位 —— 同名控件一多就会点错，而「点错元素」在验收里
         表现为「另一个按钮是死按钮」，排查起来极费劲。 */
      el.setAttribute('${mark}', String(idx));
      const r = el.getBoundingClientRect();
      const cls = typeof el.className === 'string' ? el.className : '';
      const svg = el.querySelector('svg');
      const text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
      const aria = el.getAttribute('aria-label');
      const title = el.getAttribute('title');
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const clip = clipState(el, cx, cy);
      const hit = document.elementFromPoint(cx, cy);
      const sr = svg ? svg.getBoundingClientRect() : null;
      const group = el.closest('[data-lab]')?.getAttribute('data-lab') || 'other';
      return {
        idx, cls: cls.slice(0, 90),
        group,
        name: aria || title || text || null,
        nameFrom: aria ? 'aria-label' : title ? 'title' : text ? 'text' : 'none',
        iconOnly: text.length === 0,
        w: Math.round(r.width), h: Math.round(r.height),
        disabled:
          el.disabled === true ||
          el.getAttribute('aria-disabled') === 'true' ||
          cls.includes('is-disabled') ||
          !!el.closest('.is-disabled') ||
          !!el.closest('.el-radio-button.is-disabled'),
        alreadyActive:
          /* is-active / --active 都可能挂在**祖先**上：Element Plus 把 is-active 加在
             <label class="el-radio-button"> 上，而可点元素是它里面的
             <span class="el-radio-button__inner">（span 自身类名里没有 is-active）。
             只看自身类名会漏判 → 遍历去点一个已经选中的档位 → 值不变 →
             被记成死按钮（实测「按钮组尺寸默认档」就吃了这一条假阳性）。 */
          cls.includes('is-active') ||
          cls.includes('--active') ||
          !!el.closest('.el-radio-button.is-active') ||
          el.getAttribute('aria-checked') === 'true',
        hasSvg: !!svg,
        svgShapes: svg ? shapeCount(svg) : 0,
        svgW: sr ? Math.round(sr.width) : 0,
        svgH: sr ? Math.round(sr.height) : 0,
        clip,
        covered: clip === 'none' && !!(!hit || !(hit === el || el.contains(hit) || hit.contains(el))),
      };
    });
}
`;
}

/** 错误是不是「浏览器自己没了」，而不是产品/判据问题 */
export function isBrowserGone(e) {
  const m = String(e?.message ?? e ?? "");
  return /Target page, context or browser has been closed|Execution context was destroyed|Browser has been closed|Connection closed|has been closed/i.test(m);
}

/**
 * 启动浏览器并返回一个「上下文句柄」。
 *
 * <p>默认走系统自带的 Edge（与 {@code playwright.config.ts} 的
 * {@code channel: "msedge"} 同口径）。不用 Playwright 自带的
 * {@code chromium_headless_shell}：该外壳在本机一启动就崩，而崩溃信息里
 * 看不出是外壳问题，很容易被误读成「页面打不开」。
 * 用 {@code LAB_CHANNEL} 可覆盖。</p>
 */
export async function launchBrowser({ viewport, locale = "zh-CN", channel = process.env.LAB_CHANNEL || "msedge" } = {}) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel,
      /* 低配/容器环境共享内存不足会让渲染进程无声退出（实测 Edge 外壳跑到一半
         「Target page ... has been closed」），这两个是 Playwright 官方 CI 兜底 */
      args: ["--disable-dev-shm-usage", "--disable-gpu"],
    });
    /* newContext / newPage 必须一起包进 try：浏览器刚起来就死时它们同样会抛，
       裸调会把错误变成**顶层未捕获拒绝**，进程直接以退出码 1 崩掉
       （实测 S2 分片就是这样，日志里只剩一段 Playwright 的 launch 堆栈，
       既没有结论也没有可重试的机会）。 */
    const context = await browser.newContext({ viewport, locale });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", e => pageErrors.push(e.message));
    return { browser, context, page, pageErrors };
  } catch (e) {
    /* 抛而不是 process.exit：让调用方能按「环境问题」重试。
       （此前这里 exit(2) 会直接把整个进程带走，调用方的重试逻辑根本没机会跑。） */
    throw new Error(`浏览器会话启动失败（channel=${channel}）：`
      + `${String(e.message || e).replace(/\s+/g, " ").slice(0, 220)}`
      + "；可用 LAB_CHANNEL=msedge|chrome|chromium 指定通道");
  }
}

/**
 * 打开某一页，**渲染没出来就重载再来**。
 *
 * <p>为什么重试而不是把超时调大：Vite 冷启动会做依赖预构建，触发整页 reload
 * （"optimized dependencies changed. reloading"），第一次 goto 拿到的 document
 * 会被换掉 —— 等在旧 document 上的选择器永远等不到，报出来却是「页面打不开」，
 * 真因是「页面被换过一次」。等多久都救不了，只能重载再等。</p>
 */
/**
 * 等页面就绪的超时上限。
 *
 * <p>刻意**不放大**。实测在内存吃紧的机器上，把 45s 拉到 75s 并没有让重图页更快出来
 * ——页面还是不就绪，只是每次卡顿从 3×45s=135s 变成 3×75s=225s，反而更容易把
 * 驱动进程拖到 SIGABRT（退出码 134）。超时是<b>内存饥饿的症状</b>，不是原因；
 * 真要解决只能缩小分批，而不是放宽等待。</p>
 */
export const READY_TIMEOUT_MS = 45000;

export async function openPage(page, base, hash, readySelector, { attempts = 3, timeout = 120000, readyTimeout = READY_TIMEOUT_MS } = {}) {
  await page.goto(`${base}/#${hash}`, { waitUntil: "domcontentloaded", timeout });
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await page.waitForSelector(readySelector, { state: "attached", timeout: readyTimeout });
      /* 等布局与样式落位：字体/样式没稳定时 getBoundingClientRect 不是最终值 */
      await page.waitForTimeout(900);
      return;
    } catch (e) {
      if (isBrowserGone(e)) throw e;
      console.log(`  [note] ${hash} 第 ${attempt} 次等待渲染超时（${readyTimeout}ms），重载再试`);
      await page.reload({ waitUntil: "domcontentloaded", timeout }).catch(() => {});
    }
  }
  /* 到了这里页面一直没就绪。只说「没渲染出来」没法排查：可能是应用入口崩了、
     可能是路由没匹配、也可能是页面渲染了但 readySelector 选错了 ——
     三者的修法完全不同。所以把现场取回来一起抛。 */
  const diag = await describePage(page, hash, readySelector).catch(() => "(现场信息取不到)");
  throw new Error(`${hash} ${attempts} 次尝试都没就绪（每次等 ${readyTimeout}ms）\n     现场：${diag}`);
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 错误是不是「被测服务本身不可达」（服务被打死 / 没起 / 地址错） */
export function isServiceUnreachable(e) {
  const m = String(e?.message ?? e ?? "");
  return /ERR_CONNECTION_REFUSED|ECONNREFUSED|ERR_EMPTY_RESPONSE|net::ERR_|Failed to fetch|getaddrinfo/i.test(m);
}

/** 探一次被测服务是否活着（用于开跑前的快速失败） */
export async function probeService(page, base, { timeout = 15000 } = {}) {
  const res = await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout })
    .then(() => true)
    .catch(e => { throw new Error(`被测服务不可达（${base}）：${String(e.message || e).replace(/\s+/g, " ").slice(0, 160)}`); });
  return res;
}

/**
 * 取回「页面为什么没就绪」的现场，供失败信息使用。
 *
 * <p>只说「N 次尝试都没渲染出来」等于没查：应用入口崩了 / 路由没匹配 /
 * 页面其实渲染了但 readySelector 写错，三者修法完全不同。
 * 这里把可判定的事实一次取齐：路由 hash、#app 子节点数、body 可见文本量、
 * readySelector 是否命中、以及页面上现存的可点元素数。</p>
 */
export async function describePage(page, hash, readySelector) {
  /* 必须有界。这段是「页面没就绪时」才跑的诊断，而最需要诊断的页面恰恰是
     主线程被占死的页面 —— 无上限的 page.evaluate 在那时永不返回，
     会把整轮验收吊死在「取证」这一步上（实测 ReGraphForce：15 分钟没动静，
     连一条输出都没有）。所以取证给自己设一个短上限，取不到就老实说取不到。 */
  const info = await withTimeout(page.evaluate(sel => {
    const app = document.querySelector("#app");
    const body = document.body;
    return {
      url: location.href,
      hash: location.hash,
      appChildren: app ? app.children.length : -1,
      appHtmlLen: app ? app.innerHTML.length : -1,
      bodyTextLen: (body?.innerText || "").replace(/\s+/g, " ").trim().length,
      bodyTextHead: (body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80),
      readyHit: !!document.querySelector(sel),
    };
  }, readySelector), 8000, "取页面现场").catch(() => null);
  if (!info) return "(现场信息取不到：渲染进程无响应，该页多半已不可用)";
  return [
    `url=${info.url}`,
    `hash=${info.hash || "(空)"}（期望含 ${hash}）`,
    `#app 子节点=${info.appChildren}，innerHTML=${info.appHtmlLen}B`,
    `body 可见文本=${info.bodyTextLen}B${info.bodyTextHead ? `（开头：${info.bodyTextHead}）` : ""}`,
    `readySelector(${readySelector}) 命中=${info.readyHit}`,
  ].join("；");
}

/**
 * 给一个 Promise 加硬超时，超时**拒绝**而不是永远挂着。
 *
 * <p>为什么必需：{@code chromium.launch()} 在浏览器进程被外部杀掉时会返回一个
 * **永不 settle** 的 Promise（实测本机回收会话时命中过一次）。此时事件循环空掉，
 * Node 打印 {@code Warning: Detected unsettled top-level await} 并以
 * <b>退出码 13</b> 直接结束 —— 脚本连「有几页没扫」都没来得及说，验收结果因此
 * 既不是 PASS 也不是 FAIL，而是一片空白。一个会静默死掉的验收脚本不可交付。</p>
 *
 * <p>超时后拒绝，好让上层按「环境问题」重试或如实记 FAIL。</p>
 */
export function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}超时（${ms}ms 未返回）`)), ms);
    /* 这里**绝不能** unref 这个定时器。
       之前为了「不让定时器吊住进程」加了 `.unref()`，结果超时本身失效了：
       unref 的定时器不维持事件循环，当唯一未决的事就是那个永不 settle 的 promise 时，
       事件循环直接空掉 → Node 抢在定时器触发之前以
       「Detected unsettled top-level await」+ **退出码 13** 结束进程，
       整轮验收既没有 PASS 也没有 FAIL（实测 S1 分片 34 页跑完一半就这么死的）。
       我当初正是为了治这个退出码 13 才写的 withTimeout，却又用 unref 把它废掉了。
       正确做法就是让定时器正常维持循环，竞态结束后由 finally 清掉。 */
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * 关浏览器，但**不给自己无限期等下去的机会**。
 *
 * <p>{@code browser.close()} 本身也会挂：被测页把渲染进程主线程占死时，
 * 关闭握手可能永远等不到回应。裸调它会让「收尾」变成新的卡死点 ——
 * 卡在 finally 里比卡在业务逻辑里更隐蔽，因为此时已经没有任何有意义的输出。</p>
 */
export function closeQuietly(browser, ms = 15000) {
  if (!browser) return Promise.resolve();
  return withTimeout(
    browser.close().catch(() => {}),
    ms,
    "关闭浏览器",
  ).catch(() => {});
}

/** 建一个采集函数（绑到某个 page 与标记属性） */
export function makeSweep(page, mark = "data-lab-sweep") {
  const fn = collectFn(mark);
  return (scope = "body") => page.evaluate(`(${fn})(${JSON.stringify(scope)})`);
}

/**
 * 等可点元素数量**连续两次相同**再开始判定。
 *
 * <p>固定 sleep 顶不住「面板还没渲染完」：实测 {@code /debug/ReSelect} 有时只采到
 * 12 个可点元素（square 0 项），有时 24 个 —— 差的就是属性面板那一整块。
 * 数量稳定比等固定时长更贴合真正的前置条件：「页面把控件渲染出来了」。</p>
 */
export async function waitForStable(sweep, scope, { maxMs = 20000, intervalMs = 400 } = {}) {
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

/**
 * 断言一整份清单都合契约。
 *
 * <p>{@code reporter} 是 {@link createReporter} 造出来的计数器，状态在闭包里，
 * 重试时新建一个即可，不会把之前段落的结果抹掉。</p>
 */
export function expectContract(reporter, items, ctx) {
  if (items.length === 0) {
    reporter.check(`${ctx}：扫到了可点元素`, false,
      "一个都没枚举到，说明选择器或作用域失效（或本页确实没有可点元素）");
    return [];
  }
  const bad = violations(items);
  reporter.check(`${ctx}：${items.length} 个可点元素都合契约`, bad.length === 0,
    bad.length ? `${bad.length} 项不合契约\n    - ${bad.join("\n    - ")}` : "");
  return bad;
}

/**
 * 造一个计数器。
 *
 * <p>三种结果分开记：FAIL 判退出码；WARN 是「组件没错但上游令牌有缺口」，
 * 不判失败但必须打印实测值（默默放过等于藏起来）；SKIP 是「按契约不点 /
 * 无前置条件」，必须带原因 —— 静默跳过会让「扫过了」变成空话。</p>
 */
export function createReporter({ verbose = false } = {}) {
  const state = { pass: 0, fail: 0, warned: 0, skip: 0, failures: [], warnings: [], skips: [] };
  const emit = (tag, name, detail) => {
    if (tag !== "info") console.log(`  [${tag}] ${name}${detail ? `  -> ${detail}` : ""}`);
    else console.log(`  [info] ${name}${detail ? `  -> ${detail}` : ""}`);
  };
  return {
    state,
    check(name, ok, detail = "") {
      emit(ok ? "PASS" : "FAIL", name, detail);
      ok ? state.pass++ : state.fail++;
      if (!ok) state.failures.push(`${name}${detail ? `  -> ${detail}` : ""}`);
      return ok;
    },
    warn(name, detail = "") {
      emit("WARN", name, detail);
      state.warned++;
      state.warnings.push(`${name}${detail ? `  -> ${detail}` : ""}`);
    },
    skipAs(name, detail = "") {
      emit("SKIP", name, detail);
      state.skip++;
      state.skips.push(`${name}${detail ? `  -> ${detail}` : ""}`);
    },
    info(name, detail = "") {
      if (verbose) emit("info", name, detail);
    },
    note(msg) {
      console.log(`  [note] ${msg}`);
    },
    /** 打印汇总并返回退出码 */
    summary(title, extra = "") {
      console.log(`\n${title}_PASS=${state.pass} FAIL=${state.fail} WARN=${state.warned} SKIP=${state.skip}${extra}`);
      if (state.warnings.length) {
        console.log("告警明细（非缺陷，根因在上游令牌）：");
        for (const w of state.warnings) console.log(`  - ${w}`);
      }
      if (state.failures.length) {
        console.log("失败明细：");
        for (const f of state.failures) console.log(`  - ${f}`);
      }
      console.log(state.fail === 0 ? `${title}_ALL_PASS` : `${title}_HAS_FAIL`);
      return state.fail === 0 ? 0 : 1;
    },
  };
}

/**
 * 注入一批已知好坏样本，交给**真实采集器 + 真实 violations()**，
 * 证明判据本身能区分好坏。
 *
 * <p>不在这里抄一份简化判据：抄的那份只测自己那几行，采集器的过滤与豁免
 * 逻辑一点没被验证，「折叠线以下」那一档就是这么漏掉的。</p>
 */
export async function runDiscriminativeCheck(page, sweep, report) {
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

  const disc = await sweep("#disc-host");
  const bad = violations(disc);
  const of = n => bad.filter(v => v.includes(`[${n}]`)).join(" / ");

  report.check("判据放过合格样本（好元素零违规）", of("样本A-好元素") === "",
    of("样本A-好元素") || "无违规");
  report.check("判据抓住：纯图标无名",
    of("样本B") !== "" || bad.some(v => v.includes("没有可访问名")),
    bad.filter(v => v.includes("没有可访问名")).join(" | ") || "没抓到");
  report.check("判据抓住：盒子塌陷", of("样本C-塌陷") !== "", of("样本C-塌陷") || "没抓到");
  report.check("判据抓住：svg 没有图元", of("样本D-空图标") !== "", of("样本D-空图标") || "没抓到");
  report.check("判据抓住：被元素盖住点不到", of("样本E-被盖住") !== "", of("样本E-被盖住") || "没抓到");
  report.check("判据放过：完全透明的元素不进清单",
    !disc.some(c => c.name === "样本H-透明"), "透明元素被收进来了");

  /* 白名单边界：按**类名 token** 精确比对，不用子串 ——
     子串匹配会把 el-select__caret2 也算进 el-select__caret，
     于是「放过了」与「抓住了」互相污染，两条断言一起失真。 */
  const hasClass = (c, cls) => c.cls.split(/\s+/).includes(cls);
  const exemptItems = disc.filter(c => hasClass(c, "el-select__caret"));
  const lookItems = disc.filter(c => hasClass(c, "el-select__caret2"));
  report.check("白名单边界样本确实被采集到（否则下面两条是空断言）",
    exemptItems.length === 1 && lookItems.length === 1,
    `caret=${exemptItems.length} caret2=${lookItems.length}`);
  report.check("判据放过：combobox 下拉箭头（装饰字形，名字由外层给）",
    exemptItems.length > 0 && !bad.some(v => v.startsWith(label(exemptItems[0]))),
    bad.filter(v => v.includes("caret")).join(" | ") || "未误报");
  report.check("判据抓住：类名是豁免项前缀扩展的无名图标（白名单必须精确匹配）",
    lookItems.length > 0 && bad.some(v => v.startsWith(label(lookItems[0]))),
    bad.filter(v => v.includes("caret2")).join(" | ") || "没抓到（白名单过于宽松）");

  await page.evaluate(() => document.getElementById("disc-host")?.remove());
}