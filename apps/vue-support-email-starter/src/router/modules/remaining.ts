/**
 * 不参与菜单显示的路由配置
 * @author CH
 * @version 1.0.0
 * @since 2026-03-18
 */
import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default [
  {
    path: "/email/:id",
    name: "EmailDetail",
    component: () => import("@/views/detail/index.vue"),
    meta: {
      title: "邮件详情",
      showLink: false,
    },
  },
] satisfies Array<RouteConfigsTable>;
