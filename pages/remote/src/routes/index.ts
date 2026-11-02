import type { RouteConfigsTable } from "@repo/core";

export const remoteRoutes: RouteConfigsTable[] = [
  {
    path: "/remote",
    name: "Remote",
    redirect: "/remote/control",
    meta: { title: "远程控制", icon: "Connection", showLink: true },
    children: [
      {
        path: "/remote/control",
        name: "RemoteControl",
        component: () => import("../views/ScRemoteControl.vue"),
        meta: { title: "远程连接", icon: "Connection", showLink: true, keepAlive: true },
      },
    ],
  },
];

/**
 * 给宿主的回迁门（tunnel 包开发期缺包，由 @pages/remote 承接：
 * 监控成熟的隧道页面需要把 `createTunnelRoutes` 的调用者指回本文件）。
 */
export function createTunnelRoutes({ showLink }: { showLink?: boolean } = {}): RouteConfigsTable[] {
  return remoteRoutes.map((r) => ({
    ...r,
    // RouteConfigsTable 的 meta 声明为可选，直接展开 undefined 会抛 TypeError、
    // 取值 r.meta.showLink 则过不了 strict 检查。此处按「无 meta 即视为不显示」处理。
    meta: { ...r.meta, showLink: showLink === undefined ? r.meta?.showLink : showLink },
  }));
}
