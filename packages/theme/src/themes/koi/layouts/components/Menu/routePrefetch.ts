/**
 * 路由组件预取（菜单 hover 预热 + 挂载后全量空闲预热）。
 *
 * <p>要解决的事故：路由页全部是懒加载（{@code () => import(...)}），点菜单那一刻才开始
 * 下载/编译页面 chunk —— 页面越大（表格/图表/编辑器），"点了没反应"的空白期越长。
 * 用户看到的是"菜单卡了"，而不是"网络慢"。</p>
 *
 * <p>两级预热：</p>
 * <ul>
 *   <li><b>hover 预取</b>（{@link prefetchRoute}）：鼠标移到菜单项上（真正点击前通常有
 *       100~300ms 悬停）就提前触发该路由匹配链上所有懒加载组件的 {@code import()}；</li>
 *   <li><b>空闲预取</b>（{@link prefetchRoutesIdle}）：应用挂载后，在浏览器空闲时
 *       按并发上限逐条把页面 chunk 取回来，用户第一次点任意菜单都不再等编译。
 *       默认取全部叶子路由；开发态 Vite 的每条 {@code import()} 都要现场编译，
 *       全量预取会把 CPU 打满、反而拖慢当前页面，因此改走
 *       {@link prefetchRecentlyVisited} —— 只回填「最近访问过的页面」
 *       （访问记录落在 localStorage，刷新后仍在，不必每次重新扫全站）。</li>
 * </ul>
 *
 * <p>模块系统自带缓存，真正点击时直接命中，不会再发第二次请求；预取失败也不影响后续
 * 正常导航（错误在这里被吞掉，交给点击时的路由加载去暴露）。</p>
 *
 * <p>为什么放在 theme 层而不是各 app：菜单渲染在 theme 的 ReAsideSubMenu 里，
 * 只有这里能拿到"用户即将点哪个 path"这个信号；各 app 无需改一行代码即可受益。</p>
 */
import type { Router } from "vue-router";

/** 已发起过的预取任务：同一路由不重复触发（模块缓存之外的第二层去重） */
const inflight = new Map<string, Promise<unknown>>();

/**
 * 不参与空闲预热的路由。
 *
 * <p>登录页 / 错误页都不是菜单导航链路的一部分，提前取它们只会占带宽；动态参数路由
 * （{@code /host/:id} 等）没有确定的落地地址，{@code resolve} 也拿不到真实页面，
 * 一并排除。</p>
 */
const SKIP_PATHS = new Set(["/login", "/404", "/403"]);

/**
 * 预取单个路径对应路由链上的懒加载组件。
 *
 * @param router 路由实例
 * @param path   目标路径（支持 hash 路由的 path 写法）
 * @returns 本次预取等待的 chunk 加载任务；没有可预取的组件（外链 / 未注册 / 已加载）
 *          时返回 undefined。调用方可以忽略返回值，空闲全量预热用它做并发控制。
 */
export function prefetchRoute(router: Router, path: unknown): Promise<unknown> | undefined {
  if (typeof path !== "string" || !path) return;
  // 外链不是路由，直接跳过
  if (/^(https?:)?\/\//.test(path)) return;

  let resolved: ReturnType<Router["resolve"]>;
  try {
    resolved = router.resolve(path);
  } catch {
    // 路径尚未注册（动态路由未下发）等情况：静默跳过，点击时再走正常流程
    return;
  }

  const tasks: Promise<unknown>[] = [];
  for (const record of resolved.matched) {
    const components = record.components as Record<string, unknown> | undefined;
    const loader = components?.default;
    if (typeof loader !== "function") continue;

    const key = `${String(record.path || path)}::${record.name ? String(record.name) : ""}`;
    let task = inflight.get(key);
    if (!task) {
      // 用 Promise.resolve().then 包一层：即使 loader 同步抛错也不会冒泡到事件处理器
      task = Promise.resolve()
        .then(() => (loader as () => unknown)())
        .catch(() => undefined);
      inflight.set(key, task);
    }
    tasks.push(task);
  }

  if (!tasks.length) return undefined;
  // 等待匹配链上所有 chunk 就绪（含错误吞掉），供空闲预取控制并发
  return Promise.allSettled(tasks).then(() => undefined);
}

/**
 * 收集全部可预取的叶子路由路径。
 *
 * <p>vue-router 的 {@code getRoutes()} 返回已注册路由的扁平视图，本应用的业务页由
 * {@code registerRoutesUnderLayout} 以 {@code addRoute("layout", ...)} 平铺注册，
 * 因此每条业务路由都带完整 path 与懒加载 component。</p>
 *
 * <p>过滤规则：</p>
 * <ul>
 *   <li>只收懒加载组件（{@code components.default} 为函数）—— 同步组件没有"取 chunk"
 *       这一步，预取没有意义；</li>
 *   <li>跳过登录/错误页、动态参数/通配路由（{@code path} 含 {@code :} 或 {@code *}）；</li>
 *   <li>跳过 {@code meta.standalone / meta.remind} 的整屏页（远控、卡片等脱离壳的页面，
 *       不属于菜单导航链路），以及配了外链 {@code meta.linkUrl} 的路由；</li>
 *   <li>跳过当前路径；同一 path 去重（同名路由可能被重复注册）。</li>
 * </ul>
 *
 * @param router   路由实例
 * @param skipPath 额外要跳过的路径（通常是当前所在页，已经加载过）
 * @returns 叶子路由路径列表
 */
export function collectLeafRoutePaths(router: Router, skipPath = ""): string[] {
  const paths = new Set<string>();
  for (const record of router.getRoutes()) {
    const components = record.components as Record<string, unknown> | undefined;
    if (typeof components?.default !== "function") continue;

    const path = record.path;
    if (!path || path === skipPath || SKIP_PATHS.has(path)) continue;
    // 动态参数 / 通配路由没有确定的落地地址，预取只会命中兜底或错误页
    if (path.includes(":") || path.includes("*")) continue;

    const meta = record.meta as Record<string, unknown> | undefined;
    // standalone / remind 是脱离壳的整屏页（远控、卡片等），不属于菜单导航链路
    if (meta?.standalone || meta?.remind) continue;
    if (meta?.linkUrl) continue;

    paths.add(path);
  }
  return [...paths];
}

/** 「最近访问页面」的本地记录键（带版本号：格式一旦变化，旧数据整体作废而不是解析出错） */
const VISIT_STORAGE_KEY = "koi:recent-route-paths:v1";

/** 最多记住多少个最近访问页面（既是回填上限，也是存储上限） */
const MAX_RECENT_PATHS = 8;

/**
 * 读取最近访问过的路由路径（最近的排最前）。
 *
 * <p>存储在 localStorage 而不是内存：开发态刷新页面是常态，记录要跨刷新保留，
 * 否则「最近访问页面预热」每次都退化成「没有记录、什么都不预热」。</p>
 *
 * <p>隐私模式 / 配额已满 / 历史数据损坏时一律返回空数组 —— 预热是纯优化，
 * 读不到记录只会少预热几个页面，绝不能让启动流程失败。</p>
 *
 * @param limit 最多返回多少条
 * @returns 路由路径列表（最近的在前）
 */
export function readRecentRoutePaths(limit = MAX_RECENT_PATHS): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VISIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter((path): path is string => typeof path === "string" && Boolean(path));
    return [...new Set(valid)].slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * 记录一次路由访问：把路径提到队首，超出上限的淘汰。
 *
 * <p>只记录可复用的普通路径：外链（{@code http...}）、动态参数路由（含 {@code :}）
 * 没有稳定的落地地址，记下来也预热不到东西，还占存储。</p>
 */
function rememberRouteVisit(path: string, limit: number): void {
  if (typeof window === "undefined" || !path) return;
  if (path.startsWith("http") || path.includes(":")) return;
  try {
    const next = [path, ...readRecentRoutePaths(limit).filter((item) => item !== path)].slice(0, limit);
    window.localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 隐私模式 / 配额已满：记录失败不影响任何功能
  }
}

/**
 * 让路由变化自动写入「最近访问」记录（同时把当前所在页记一次）。
 *
 * <p>调用时机：应用挂载之后一次即可。返回取消监听的函数，通常无需调用。</p>
 *
 * <p>为什么由 app 入口调用而不是在 theme 里自动挂：theme 的菜单组件只在「按路由推导
 * 菜单」的应用里存在，但记录本身与菜单无关；挂在入口更直白，也不会因为菜单组件被
 * 卸载（切到 standalone 整屏页）而断掉记录。</p>
 *
 * @param router 路由实例
 * @returns 取消监听的函数
 */
export function rememberRouteVisits(router: Router): () => void {
  rememberRouteVisit(router.currentRoute.value.path, MAX_RECENT_PATHS);
  return router.afterEach((to) => {
    rememberRouteVisit(to.path, MAX_RECENT_PATHS);
  });
}

/** 空闲预取的默认并发上限：同时最多加载 2 个页面的 chunk */
const IDLE_CONCURRENCY = 2;

/** 空闲预取的调度参数 */
export interface IdlePrefetchOptions {
  /** 并发上限，默认 2；开发态建议传 1，避免和当前页面的即时编译抢 CPU */
  concurrency?: number;
  /** 首次调度前额外等待的毫秒数，默认 0；开发态建议给首屏让出 1~2s */
  delayMs?: number;
}

/**
 * 空闲时预热路由 chunk。
 *
 * <p>不传 {@code paths} 时自动收集全部叶子路由（{@link collectLeafRoutePaths}），
 * 这是**生产构建**下应用入口的默认用法：挂载完成后把整个菜单的页面外壳都提前取回来。
 * 开发态请改用 {@link prefetchRecentlyVisited}，原因见其注释。</p>
 *
 * <p>为什么不是一次性 {@code forEach} 全部 import：</p>
 * <ul>
 *   <li>开发态每条 {@code import()} 都要 Vite 即时编译，几十个页面同时开工会把
 *       编译器和网络打成拥塞，反而拖慢当前正在看的页面；</li>
 *   <li>这里按 {@code requestIdleCallback} 调度、并发上限 2，上一批 chunk 就绪后再取下一批，
 *       既能在用户点菜单前完成预热，又不和首屏抢资源。生产环境 chunk 已是预构建文件，
 *       逐条加载同样很快，不会造成额外等待。</li>
 * </ul>
 *
 * <p>注意：只预取页面外壳代码，不触发页面里的接口请求；数据仍由各页 onMounted 异步加载。</p>
 *
 * @param router  路由实例
 * @param paths   指定要预取的路径（可选；不传则收集全部叶子路由）
 * @param options 调度参数（并发上限 / 首次延迟），见 {@link IdlePrefetchOptions}
 */
export function prefetchRoutesIdle(
  router: Router,
  paths?: string[],
  options: IdlePrefetchOptions = {},
): void {
  const queue = paths?.length
    ? [...new Set(paths)]
    : collectLeafRoutePaths(router, router.currentRoute.value.path);
  if (!queue.length) return;

  const concurrency = Math.max(1, options.concurrency ?? IDLE_CONCURRENCY);
  /** 只有第一次调度吃延迟，后续批次恢复正常的空闲调度节奏 */
  let firstDelay = Math.max(0, options.delayMs ?? 0);

  let cursor = 0;
  let running = 0;
  let scheduled = false;

  /** 申请下一个空闲时段继续取（已排过队 / 队列已取完则跳过，避免重复回调） */
  const schedule = (): void => {
    if (scheduled || cursor >= queue.length) return;
    scheduled = true;
    const run = (): void => {
      scheduled = false;
      pump();
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts: { timeout: number }) => number })
      .requestIdleCallback;
    const submit = (): void => {
      if (typeof ric === "function") {
        ric(run, { timeout: 1500 });
      } else {
        setTimeout(run, 300);
      }
    };
    const delay = firstDelay;
    firstDelay = 0;
    if (delay > 0) setTimeout(submit, delay);
    else submit();
  };

  /** 在并发上限内启动下一条；每条结束（成功或失败）后再申请下一个空闲时段 */
  const pump = (): void => {
    while (running < concurrency && cursor < queue.length) {
      const task = prefetchRoute(router, queue[cursor++]);
      if (!task) continue;
      running += 1;
      void task.finally(() => {
        running -= 1;
        schedule();
      });
    }
  };

  schedule();
}

/**
 * 开发态预热：只回填「最近访问过的页面」。
 *
 * <p>为什么不直接 {@link prefetchRoutesIdle} 扫全量叶子路由：开发态每条
 * {@code import()} 都要 Vite 现场编译，几十个页面排队编译会把 CPU 占满，用户当前
 * 正在看的页面反而更慢（实测全量预取期间点新页面仍在 30s 量级）。开发时真正会反复
 * 打开的就是那几页，把最近访问的 8 个页面预取回来，收益几乎等于全量、成本只有零头。</p>
 *
 * <p>记录来自 localStorage（见 {@link rememberRouteVisits}），所以刷新后仍然有效；
 * 并发固定为 1、首次延迟 1.5s，把首屏编译让出来。没有访问记录时直接返回 —— 此时
 * 完全依赖菜单 hover 预取（{@link prefetchRoute}），不做任何后台编译。</p>
 *
 * @param router 路由实例
 * @param limit  最多回填多少个页面
 */
export function prefetchRecentlyVisited(router: Router, limit = MAX_RECENT_PATHS): void {
  const recent = readRecentRoutePaths(limit).filter((path) => path !== router.currentRoute.value.path);
  if (!recent.length) return;
  prefetchRoutesIdle(router, recent, { concurrency: 1, delayMs: 1500 });
}
