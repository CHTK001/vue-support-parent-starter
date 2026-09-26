/**
 * @pages/task —— 任务派发共享包
 *
 * 只承载任务派发（/v2/taskdistribution）页面与 API。
 * 调度中心与调度控制台已迁至 @pages/job。
 */
import { registerMenuViewModules } from "@repo/core";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
registerMenuViewModules({
  "views/task/dispatch/index.vue": () => import("./views/DispatchManage.vue"),
});

export { taskRoutes, taskMenus } from "./routes";
export * from "./api/types";
export * from "./api/taskApi";
