import type { RouteConfigsTable } from "@repo/core";

/**
 * WebRTC 远程控制（桌面共享 + 键鼠遥控）
 *
 * <p>路由与页面同出本包，宿主（monitor 应用）只做一行展开。</p>
 *
 * @author CH
 * @since 4.0.0.50
 */
export const controlRoutes: RouteConfigsTable[] = [
  {
    path: "/grp-control",
    name: "GroupControl",
    meta: { title: "远程控制", icon: "Connection", showLink: true, rank: 16 },
    children: [
      {
        path: "/control/remote",
        name: "ControlRemote",
        component: () => import("../views/ScControl.vue"),
        meta: { title: "设备远程控制", icon: "Connection", showLink: true, keepAlive: true, rank: 1 },
      },
    ],
  },
];

/**
 * 对 `createTunnelRoutes` 同构的路由创建方法，参数反射回 `meta.showLink`。
 */
export function createControlRoutes({ showLink }: { showLink?: boolean } = {}): RouteConfigsTable[] {
  return controlRoutes.map((r) => ({
    ...r,
    meta: { ...r.meta, showLink: showLink === undefined ? r.meta?.showLink : showLink },
  }));
}
