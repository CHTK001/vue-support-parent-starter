/**
 * @pages/job —— 调度管理共享包
 *
 * 承载调度中心（/scheduler/api/v1/job-platform）与调度控制台（/job-console/api）
 * 的页面、API 封装、路由表与静态菜单。
 *
 * 页面组件通过 registerMenuViewModules 以懒加载注册：
 * 后端菜单 component（如 views/job/console/index.vue）自动映射到本地 .vue。
 *
 * 调度能力原内嵌在 @pages/task，现已独立；@pages/task 只保留任务派发。
 */
import { registerMenuViewModules } from "@repo/core";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
registerMenuViewModules({
  "views/job/console/index.vue": () => import("./views/JobConsoleManage.vue"),
});

export { jobRoutes, jobMenus } from "./routes";
export * from "./api/types";
export * from "./api/jobApi";
