/**
 * @pages/hotsport 入口。
 *
 * <p>本包是一套完整的 APM 观测台页面（总览 / 链路 / 依赖 / 服务 / JVM / 日志 / 告警 /
 * Agent / 注入器等 15 个视图），原为独立应用 {@code vue-support-hotspot-starter} 的
 * 全部界面，现整体迁入以便被任意宿主复用。</p>
 *
 * <p>样式在这里统一引入：{@code tokens.css} 只定义 {@code --apm-*} 令牌与
 * {@code .hotsport-scope} 作用域内的 Element 映射，{@code layout.css} 的通用类名
 * 全部带作用域前缀，因此不会污染宿主。作用域由 {@code routes/scope.ts} 的包装
 * 组件在渲染时挂上，页面本身无需关心。</p>
 *
 * @since 4.0.0
 */
import { registerMenuViewModules } from "@repo/core";
import "./styles/tokens.css";
import "./styles/layout.css";

/**
 * 远端菜单的组件路径 → 本地视图。
 *
 * <p>后端菜单表里存的是形如 {@code views/hotsport/dashboard/index.vue} 的路径，
 * 这里建立映射，避免新增页面时还要改后端数据。</p>
 */
registerMenuViewModules({
  "views/hotsport/dashboard/index.vue": () => import("./views/Dashboard.vue"),
  "views/hotsport/traces/index.vue": () => import("./views/Traces.vue"),
  "views/hotsport/dependencies/index.vue": () => import("./views/Dependencies.vue"),
  "views/hotsport/leaks/index.vue": () => import("./views/Leaks.vue"),
  "views/hotsport/endpoints/index.vue": () => import("./views/Endpoints.vue"),
  "views/hotsport/errors/index.vue": () => import("./views/Errors.vue"),
  "views/hotsport/services/index.vue": () => import("./views/Services.vue"),
  "views/hotsport/jvm/index.vue": () => import("./views/Jvm.vue"),
  "views/hotsport/topology/index.vue": () => import("./views/Topology.vue"),
  "views/hotsport/logs/index.vue": () => import("./views/Logs.vue"),
  "views/hotsport/alerts/index.vue": () => import("./views/Alerts.vue"),
  "views/hotsport/agent/index.vue": () => import("./views/AgentCenter.vue"),
  "views/hotsport/injector/index.vue": () => import("./views/Injector.vue"),
});

export { hotsportRoutes, hotsportMenus } from "./routes";
export { hotsportPage, HOTSPORT_BODY_CLASS, HOTSPORT_SCOPE_CLASS } from "./routes/scope";
export * from "./config";
export * from "./api/apmApi";