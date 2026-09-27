/**
 * @pages/job —— 调度模块页面包。
 *
 * 承载调度侧的全部视图、API 与路由树：调度中心分组
 * （调度作业 / 远程节点 / 作业日志）。
 *
 * 后端出口是 job-starter 的治理接口 /v2/scheduler/**（见 ./api/jobApi），
 * 与采集共用 sys_job 台账但接口分面。本包自带私有 HTTP 客户端（./api/http），
 * 与 @pages/collect 各自持有一份，照 pages/datasource 的既有约定，不跨包共享。
 */
import { registerMenuViewModules } from "@repo/core";

// 样式随包走：谁 import 本包谁就得到调度侧样式，宿主不必记得单独引
import "./styles/scheduler.css";

/**
 * 后端 sys_menu.component → 本地页面（懒加载，仅访问时 import）。
 *
 * 宿主（vue-support-system-starter）是 route.mode=remote：菜单与路由全由后端
 * /v2/user/menu 下发，页面组件靠这张表解析。core 拼 moduleKey 的规则是
 * `views/{component}.vue`（见 @repo/core 的 resolveRouteComponent），
 * 因此**后端 component 字段既不带 views/ 前缀也不带 .vue 后缀**，
 * 本表的键必须写成 core 实际查的那个形态，否则回落 404 兜底页。
 *
 * 这段注册原先存在于包内，重构为静态路由树时被删掉，导致 system 宿主
 * `import "@pages/job"` 拿不到任何页面映射，点「调度管理」直接 404。
 */
registerMenuViewModules({
  "views/job/index.vue": () => import("./views/JobOverviewView.vue"),
  "views/job/console/index.vue": () => import("./views/JobView.vue"),
  "views/job/remote/index.vue": () => import("./views/RemoteNodeView.vue"),
  "views/job/log/index.vue": () => import("./views/JobLogView.vue"),
});

export { jobRoutes } from "./routes";
export { default as jobRoutesTree } from "./routes";

export * from "./api/jobApi";
export * from "./types/job";
