/**
 * @pages/task —— 任务管理共享包
 *
 * 提供任务派发（/v2/taskdistribution）与调度中心（/scheduler/api/v1/job-platform）
 * 两组页面，以及后端 API 封装、路由表、静态菜单。
 *
 * 页面组件通过 registerMenuViewModules 以懒加载注册：
 * 后端菜单 component（如 task/dispatch/index）自动映射到本地 .vue。
 */
import { registerMenuViewModules } from "@repo/core";
import "./styles/task-page.css";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
registerMenuViewModules({
  "views/task/dispatch/index.vue": () => import("./views/DispatchManage.vue"),
  "views/task/scheduler/index.vue": () => import("./views/SchedulerManage.vue"),
});

export { taskRoutes, taskMenus } from "./routes";
export * from "./api/types";
export * from "./api/taskApi";