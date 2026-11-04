/**
 * @pages/apm 路由与菜单 —— 只声明一次。
 *
 * <p>结构与 {@code @pages/hotsport} 一致：本文件同时产出</p>
 * <ul>
 *   <li>{@link apmRoutes}：叶子路由，宿主 {@code addRoute("layout", ...)} 挂到布局下；</li>
 *   <li>{@link apmMenus}：静态菜单分组「APM 观测」。</li>
 * </ul>
 *
 * <p><strong>路径前缀</strong>统一 {@code /apm/*}，见 {@code config.ts} 的
 * {@link ROUTE_PREFIX}；页面之间的跳转也引用同一常量，不写死绝对路径。
 * 这样即使老观测栈（{@code /hotsport/*}）与新 APM（{@code /apm/*}）并存，
 * 两套页面的路由也不会互相覆盖。</p>
 *
 * @since 4.0.0.51
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";
import type { AsyncComponentLoader } from "vue";
import { ROUTE_PREFIX } from "../config";

/** 单个页面的声明 */
interface ApmPageDef {
  /** 相对 {@link ROUTE_PREFIX} 的路径，必须以 / 开头 */
  path: string;
  /** 路由名（同时作为包装组件名，keep-alive 依赖它） */
  name: string;
  /** 侧边栏标题 */
  title: string;
  /** Element Plus 图标名 */
  icon: string;
  /** 视图导入 */
  component: AsyncComponentLoader;
  /** 是否进侧边栏；详情页为 false */
  menu: boolean;
}

/**
 * 全部页面。顺序即侧边栏顺序：
 * 先「整体状况」→ 再「服务下钻」→ 再「链路与拓扑 / 3D / 对比」→
 * 再「指标 / 剖析」→ 最后「告警 / 告警分析 / 日志」。
 *
 * <p>「告警」与「告警分析」是两件事：前者是事件流水（谁在什么时候触发了什么），
 * 后者按规则与服务聚合（哪类问题最多、趋势如何）。拆开而不是合并成一个页签，
 * 是因为两者的默认时间窗、筛选维度和使用节奏都不同。</p>
 */
const PAGES: ApmPageDef[] = [
  {
    path: "/overview",
    name: "ApmOverview",
    title: "APM 总览",
    icon: "DataLine",
    component: () => import("../views/Overview.vue"),
    menu: true,
  },
  {
    path: "/services",
    name: "ApmServices",
    title: "服务列表",
    icon: "List",
    component: () => import("../views/Services.vue"),
    menu: true,
  },
  {
    path: "/services/detail",
    name: "ApmServiceDetail",
    title: "服务详情",
    icon: "List",
    component: () => import("../views/ServiceDetail.vue"),
    menu: false,
  },
  {
    path: "/endpoints",
    name: "ApmEndpoints",
    title: "端点分析",
    icon: "Aim",
    component: () => import("../views/Endpoints.vue"),
    menu: true,
  },
  {
    path: "/traces",
    name: "ApmTraces",
    title: "调用链路",
    icon: "Document",
    component: () => import("../views/Traces.vue"),
    menu: true,
  },
  {
    path: "/traces/detail",
    name: "ApmTraceDetail",
    title: "链路详情",
    icon: "Document",
    component: () => import("../views/TraceDetail.vue"),
    menu: false,
  },
  {
    path: "/topology",
    name: "ApmTopology",
    title: "服务拓扑",
    icon: "Share",
    component: () => import("../views/Topology.vue"),
    menu: true,
  },
  {
    path: "/infra-3d",
    name: "ApmInfra3D",
    title: "3D 基础设施",
    icon: "Box",
    component: () => import("../views/Infra3D.vue"),
    menu: true,
  },
  {
    path: "/compare",
    name: "ApmCompare",
    title: "多实体对比",
    icon: "DataAnalysis",
    component: () => import("../views/Compare.vue"),
    menu: true,
  },
  {
    path: "/metrics",
    name: "ApmMetrics",
    title: "指标分析",
    icon: "TrendCharts",
    component: () => import("../views/Metrics.vue"),
    menu: true,
  },
  {
    path: "/profiles",
    name: "ApmProfiles",
    title: "性能剖析",
    icon: "Timer",
    component: () => import("../views/Profiles.vue"),
    menu: true,
  },
  {
    path: "/alarms",
    name: "ApmAlarms",
    title: "告警",
    icon: "Bell",
    component: () => import("../views/Alarms.vue"),
    menu: true,
  },
  {
    path: "/alerts",
    name: "ApmAlerts",
    title: "告警分析",
    icon: "Warning",
    component: () => import("../views/Alerts.vue"),
    menu: true,
  },
  {
    path: "/logs",
    name: "ApmLogs",
    title: "日志",
    icon: "Tickets",
    component: () => import("../views/Logs.vue"),
    menu: true,
  },
];

/**
 * 路由表：叶子路由，直接 {@code addRoute("layout", …)} 挂到宿主布局下。
 *
 * <p>组件不经包装器 —— 与 {@code @pages/hotsport} 不同，本包不做深色工程台主题，
 * 一律用宿主主题变量，因此没有「样式作用域 / 弹层主题」要维护，
 * 页面组件直接当路由组件即可（少一层包装也少一处组件名冲突）。</p>
 */
export const apmRoutes: RouteConfigsTable[] = PAGES.map((page) => ({
  path: `${ROUTE_PREFIX}${page.path}`,
  name: page.name,
  component: page.component,
  meta: {
    title: page.title,
    icon: page.icon,
    showLink: page.menu,
    keepAlive: true,
  },
}));

/**
 * 静态菜单：「APM 观测」分组。
 *
 * <p>宿主可整组挂到任意上级分组下，也可以忽略本导出自行拼装 ——
 * 路由与菜单同源，不会出现「有菜单没路由」的死链。</p>
 */
export const apmMenus: StaticMenuItem[] = [
  {
    path: ROUTE_PREFIX,
    name: "Apm",
    redirect: `${ROUTE_PREFIX}/overview`,
    meta: { title: "APM 观测", icon: "DataLine", isVisible: "1" },
    children: PAGES.filter((page) => page.menu).map((page) => ({
      path: `${ROUTE_PREFIX}${page.path}`,
      name: page.name,
      meta: { title: page.title, icon: page.icon, isVisible: "1" },
    })),
  },
];
