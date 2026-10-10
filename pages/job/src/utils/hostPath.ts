/**
 * 跨宿主路径解析。
 *
 * <p>同一份 pages/job 被两个宿主复用，而页面挂在不同路径下：</p>
 * <ul>
 *   <li>采集调度宿主（vue-support-collect-scheduler-starter，route.mode=router）
 *       用本地静态路由树，路径是 {@code /collect/**}；</li>
 *   <li>系统管理宿主（vue-support-system-starter，route.mode=remote）
 *       用后端菜单下发，路径是 {@code /job/**}。</li>
 * </ul>
 *
 * <p>包内页面之间的跳转若直接 push {@code /collect/**}，在系统宿主里查无此路由会落 404。
 * 所以统一走 {@link resolveHostPath}：目标路径在当前路由表里就用它，否则退回该宿主的菜单路径。</p>
 *
 * <p>注意系统宿主的 {@code /job/log} 是靠一条**隐藏菜单**（sys_menu_hidden=1）注册的：
 * 它是「任务详情 → 查看日志」的下钻页，不进侧边栏，但没有那条菜单就查无此路由。</p>
 */

/** 静态宿主口径路径 → 系统宿主菜单路径 */
export const HOST_PATH_FALLBACK: Record<string, string> = {
  "/collect/job": "/job/console",
  "/collect/job-log": "/job/log",
  "/collect/remote-node": "/job/remote",
  // 调度概览：后端菜单 component 是 job/index（见 ./index.ts 的 registerMenuViewModules），
  // 按同组另三项的命名规律（console / remote / log）推为 /job/index。
  // 若系统宿主实际注册的不是这个路径，这里会原样回落到 /collect/job-overview 并在该宿主 404 ——
  // 与不加这条的效果相同，但静态宿主（采集调度平台）下两者都能正常跳。
  "/collect/job-overview": "/job/index",
};

/** 只需 getRoutes / push 两个能力，避免为测试或换宿主导入整个 Router 类型 */
export interface HostPathRouter {
  getRoutes: () => Array<{ path: string }>;
}

/**
 * 按当前宿主解析出可达的目标路径。
 *
 * @param router 当前路由实例
 * @param path   目标路由（静态宿主口径）
 * @returns 当前宿主实际注册的路径；两边都没有时原样返回，便于暴露配置缺失
 */
export function resolveHostPath(router: HostPathRouter, path: string): string {
  if (router.getRoutes().some((route) => route.path === path)) {
    return path;
  }
  return HOST_PATH_FALLBACK[path] ?? path;
}
