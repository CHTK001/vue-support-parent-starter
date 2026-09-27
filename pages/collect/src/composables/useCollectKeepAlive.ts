/**
 * 采集控制台页面的 keep-alive 登记。
 *
 * 布局的 `<keep-alive :include="keepAliveStore.keepAliveName">` 只认路由 name，而 name 是
 * 由标签页流程登记进来的：`useLayoutTabs.addTab()` 在标签已存在时会提前 return，标签列表又是
 * 持久化的，刷新后首次访问就可能不再登记。这里直接按路由树一次性登记全部 keepAlive 页面，
 * 让缓存命中与「激活即重载」的语义不依赖标签状态。
 *
 * include 只是白名单，没访问过的页面不会被缓存，所以全量登记没有副作用。
 */
// 从 @repo/pinia 直接取：keep-alive store 的归属地就在这里。
// 不要写 @repo/theme/koi —— 虽然它 re-export 了同一个 store，但 vue-tsc 解析
// `@repo/theme/koi` 的 exports 时拿不到该成员（TS2305），会卡住整个构建门禁。
import { useKeepAliveStore } from "@repo/pinia";
import { collectRoutes } from "../routes";
import type { RouteConfigsTable } from "@repo/core";

/** 登记路由树里所有声明 keepAlive 的页面（按路由 name） */
export function registerCollectKeepAlive(): void {
  const keepAliveStore = useKeepAliveStore();
  const walk = (list: readonly RouteConfigsTable[]): void => {
    for (const item of list) {
      const name = item.name as string | undefined;
      if (name && item.meta?.keepAlive) {
        void keepAliveStore.addKeepAliveName(name);
      }
      const children = item.children as RouteConfigsTable[] | undefined;
      if (children?.length) walk(children);
    }
  };
  walk(collectRoutes);
}
