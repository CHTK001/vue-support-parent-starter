/**
 * 调试中心路由（@pages/debug）
 *
 * <p>一条叶子路由 {@code /debug}：面板内部用页签区分 Console / Network /
 * DOM / 截屏 / 求值，不需要为了一个页拆成五个路由。</p>
 *
 * <p>宿主把 {@link createCdpRoutes} 产出的数组展开进自己的路由树即可，
 * 菜单项由 {@code buildMenuFromRoutes} 自动推导（侧边栏「运维管理 → 调试中心」）。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import type { RouteConfigsTable } from "@repo/core";

/** {@link createCdpRoutes} 的可选项 */
export interface CdpRoutesOptions {
  /** 是否进侧边栏（默认 true，由「运维管理」分组进入） */
  showLink?: boolean;
  /** 侧边栏高亮回指的路由路径（默认 /debug） */
  activeMenu?: string;
  /** 菜单排序（默认 1，组内唯一） */
  rank?: number;
}

/**
 * 生成 Debug 面板路由。
 *
 * @param options 可选项
 * @returns 可直接展开进宿主路由树的数组
 */
export function createCdpRoutes(options: CdpRoutesOptions = {}): RouteConfigsTable[] {
  const showLink = options.showLink ?? true;
  const rank = options.rank ?? 1;
  return [
    {
      path: "/grp-debug",
      name: "GroupDebug",
      meta: { title: "运维管理", icon: "Monitor", showLink: true, rank: 2 },
      children: [
        {
          path: "/debug",
          name: "Debug",
          component: () => import("../views/DebugCenter.vue"),
          meta: { title: "调试中心", icon: "Tools", showLink, rank },
        },
      ],
    },
  ];
}
