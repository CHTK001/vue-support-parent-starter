import type { RouteConfigsTable } from "@repo/core";

/**
 * 文件管理路由配置
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
const routes = [
  {
    path: "/file",
    name: "FileManagement",
    component: async () => {
      const LayoutDefault = await import("../src/file/FileIndex.vue");
      return LayoutDefault;
    },
    meta: {
      title: "文件管理",
    },
  },
] satisfies Array<RouteConfigsTable>;

export default routes;
