/**
 * 路由组件预取（菜单 hover 预热）。
 *
 * <p>要解决的事故：路由页全部是懒加载（{@code () => import(...)}），点菜单那一刻才开始
 * 下载页面 chunk —— 页面越大（表格/图表/编辑器），"点了没反应"的空白期越长。用户看到的是
 * "菜单卡了"，而不是"网络慢"。</p>
 *
 * <p>做法：鼠标移到菜单项上（用户真正点击前通常有 100~300ms 的悬停）就提前触发该路由
 * 匹配链上所有懒加载组件的 {@code import()}。模块系统自带缓存，真正点击时直接命中，
 * 不会再发第二次请求；预取失败也不影响后续正常导航（错误在这里被吞掉，交给点击时的
 * 路由加载去暴露）。</p>
 *
 * <p>为什么放在 theme 层而不是各 app：菜单渲染在 theme 的 ReAsideSubMenu 里，
 * 只有这里能拿到"用户即将点哪个 path"这个信号；各 app 无需改一行代码即可受益。</p>
 */
import type { Router } from "vue-router";

/** 已发起过的预取任务：同一路由不重复触发（模块缓存之外的第二层去重） */
const inflight = new Map<string, Promise<unknown>>();

/** 预取单个路径对应路由链上的懒加载组件 */
export function prefetchRoute(router: Router, path: unknown): void {
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

  for (const record of resolved.matched) {
    const components = record.components as Record<string, unknown> | undefined;
    const loader = components?.default;
    if (typeof loader !== "function") continue;

    const key = `${String(record.path || path)}::${record.name ? String(record.name) : ""}`;
    if (inflight.has(key)) continue;

    // 用 Promise.resolve().then 包一层：即使 loader 同步抛错也不会冒泡到事件处理器
    const task = Promise.resolve()
      .then(() => (loader as () => unknown)())
      .catch(() => undefined);
    inflight.set(key, task);
  }
}

/** 空闲时预取一批路径（可选：应用可在首屏就绪后调用，进一步缩短首次点击等待） */
export function prefetchRoutesIdle(router: Router, paths: string[]): void {
  const run = () => paths.forEach((p) => prefetchRoute(router, p));
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback;
  if (typeof ric === "function") {
    ric(run, { timeout: 3000 });
  } else {
    setTimeout(run, 1200);
  }
}
