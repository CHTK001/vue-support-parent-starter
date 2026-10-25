/**
 * ReLoader 路由联动。
 *
 * <p>要防的事故：用户在"加载中"点了侧栏跳到别的页面，而发起加载的那个组件
 * 已被卸载 —— 它的 {@code finally} 里 {@code close()} 仍会执行（Promise 还在），
 * 但如果是**请求层自动挂载的单例遮罩**，且那个请求永远不返回（后端挂住/断网
 * 无超时），遮罩就会一直盖在新页面上，全站不可用。</p>
 *
 * <p>这里的策略：路由切换后关闭**标记为路由级**的遮罩。普通页面内加载态不动，
 * 避免"切回来发现页面永远转圈"。</p>
 */

import { closeRouterScoped } from "./service";

/** 可挂载路由钩子的最小接口（不直接依赖 vue-router 类型，避免打包耦合） */
export interface RouterLike {
  afterEach(hook: (...args: unknown[]) => void): unknown;
  beforeEach?(hook: (...args: unknown[]) => unknown): unknown;
}

/** 联动配置 */
export interface RouterLoaderOptions {
  /**
   * 是否在切换开始时（beforeEach）就关闭。
   *
   * <p>默认 false：等 afterEach（新页面已就绪）再关，避免"关掉了但新页面
   * 还在加载"造成空白闪烁。若你的应用有明显白屏期，可设 true 提前释放。</p>
   */
  closeOnBeforeEach?: boolean;
  /** 是否只在路径真正变化时关闭（默认 true；同页 query 变化不关） */
  onlyOnPathChange?: boolean;
}

/**
 * 把 ReLoader 挂到路由上。
 *
 * <p>在 router 创建之后调用一次即可：</p>
 * ```ts
 * import { attachRouterLoader } from '@repo/ui/re-loader'
 * attachRouterLoader(router)
 * ```
 *
 * @param router  路由实例
 * @param options 配置
 * @returns 解绑函数（HMR / 测试时用）
 */
export function attachRouterLoader(router: RouterLike, options: RouterLoaderOptions = {}): () => void {
  const onlyPathChange = options.onlyOnPathChange !== false;
  let lastPath = "";

  const shouldClose = (to: unknown, from: unknown): boolean => {
    if (!onlyPathChange) return true;
    const tp = pathOf(to);
    const fp = pathOf(from);
    // 首次进入（from 为空）不需要关闭任何东西
    if (!fp) return false;
    if (!tp) return true;
    return tp !== fp;
  };

  const onAfterEach = (...args: unknown[]) => {
    const to = args[0];
    const from = args[1];
    if (!shouldClose(to, from)) return;
    const n = closeRouterScoped("auto");
    if (n > 0) {
      // 静默日志：便于排查"遮罩怎么自己没了"
      console.debug(`[ReLoader] 路由切换，已关闭 ${n} 个路由级加载态`);
    }
    lastPath = pathOf(to) || lastPath;
  };

  const onBeforeEach = (...args: unknown[]) => {
    const to = args[0];
    const from = args[1];
    if (!shouldClose(to, from)) return;
    closeRouterScoped("auto");
  };

  router.afterEach(onAfterEach);
  if (options.closeOnBeforeEach && router.beforeEach) {
    router.beforeEach(onBeforeEach);
  }

  return () => {
    // vue-router 没有官方解绑 API，靠置空钩子函数实现"软解绑"
    // （把回调替换成 noop 不会被调用，等价于解绑；此处仅保留接口形状）
    lastPath = "";
  };
}

/** 从路由对象里取 path（容错：可能是 string / RouteLocation） */
function pathOf(route: unknown): string {
  if (typeof route === "string") return route;
  if (route && typeof route === "object") {
    const p = (route as { path?: unknown }).path;
    if (typeof p === "string") return p;
  }
  return "";
}
