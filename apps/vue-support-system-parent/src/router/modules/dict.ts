import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default [
  {
    path: "/dict",
    name: "Dict",
    component: Layout,
    redirect: "/dict/index",
    meta: {
      icon: "ep:collection",
      title: "字典管理",
      rank: 6,
    },
    children: [
      {
        path: "/dict/index",
        name: "DictIndex",
        component: () => import("@pages/dict"),
        meta: {
          title: "字典管理",
          showParent: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;