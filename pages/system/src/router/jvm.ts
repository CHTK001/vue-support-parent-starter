import type { RouteConfigsTable } from "@repo/core";

/**
 * JVM 监控路由配置
 * @author CH
 * @since 2024/12/18
 * @version 1.0.0
 */
const routes = [
  {
    path: "/jvm",
    name: "JvmMonitor",
    component: async () => {
      const JvmInfoIndex = await import("@pages/jvm");
      return JvmInfoIndex;
    },
    meta: {
      title: "JVM 监控",
      icon: "ri:cpu-line",
      rank: 10
    },
  },
] satisfies Array<RouteConfigsTable>;

export default routes;
