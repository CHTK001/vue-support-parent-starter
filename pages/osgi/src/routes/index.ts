/**
 * OSGi 插件管理路由（独立分组）。
 *
 * 放在采集调度系统的「插件中心」分组下：插件是部署级能力，不属于采集或调度任一业务侧，
 * 但当前可部署形态只有这一个控制台，因此由本应用承载。
 */
import type { RouteConfigsTable } from "@repo/core";

/** 插件中心路由树 */
export const osgiRoutes: RouteConfigsTable[] = [
  {
    path: "/grp-plugin",
    name: "GroupPlugin",
    meta: { title: "插件中心", icon: "Box", showLink: true, rank: 3 },
    children: [
      {
        path: "/collect/osgi",
        name: "OsgiManage",
        component: () => import("../views/OsgiView.vue"),
        meta: {
          title: "OSGi 插件",
          icon: "Connection",
          showLink: true,
          keepAlive: true,
          rank: 1,
          isVisible: "1",
        },
      },
    ],
  },
];

export default osgiRoutes;
