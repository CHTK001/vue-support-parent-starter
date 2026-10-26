/**
 * @pages/hotsport 路由与菜单 —— 15 个页面只在此声明一次。
 *
 * <p>这些页面原先住在独立应用 {@code apps/vue-support-hotspot-starter}，路由表
 * 写在那个应用的 {@code router.ts} 里。迁入本包后由本文件统一产出：
 * 宿主（当前是系统管理应用）把 {@link hotsportRoutes} 合并进自己的路由表，
 * 把 {@link hotsportMenus} 当作「系统指标」菜单组挂到监控分组下。</p>
 *
 * <p><strong>路径前缀</strong>：统一 {@code /hotsport/*}，见 {@code config.ts}
 * 的 {@code ROUTE_PREFIX}；页面之间的跳转也引用同一常量，不写死。</p>
 *
 * <p><strong>为什么没有 i18n key</strong>：这批页面是从独立应用整体迁入的，
 * 标题与正文均为中文硬编码（原应用也没有 i18n 依赖）。若改成 key 而宿主没配
 * 对应文案，侧边栏会显示原始 key，比中文更糟。</p>
 *
 * @since 4.0.0
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";
import type { AsyncComponentLoader } from "vue";
import { ROUTE_PREFIX } from "../config";
import { hotsportPage } from "./scope";

/** 单个页面的声明 */
interface HotsportPageDef {
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

/** 全部页面。顺序即侧边栏顺序：先看整体，再下钻，最后是运维动作。 */
const PAGES: HotsportPageDef[] = [
  {
    path: "/dashboard",
    name: "HotsportDashboard",
    title: "总览看板",
    icon: "DataLine",
    component: () => import("../views/Dashboard.vue"),
    menu: true,
  },
  {
    path: "/traces",
    name: "HotsportTraces",
    title: "调用链路",
    icon: "Document",
    component: () => import("../views/Traces.vue"),
    menu: true,
  },
  {
    path: "/traces/detail",
    name: "HotsportTraceDetail",
    title: "链路瀑布",
    icon: "Document",
    component: () => import("../views/TraceWaterfall.vue"),
    menu: false,
  },
  {
    path: "/dependencies",
    name: "HotsportDependencies",
    title: "依赖拓扑",
    icon: "Share",
    component: () => import("../views/Dependencies.vue"),
    menu: true,
  },
  {
    path: "/topology",
    name: "HotsportTopology",
    title: "系统拓扑",
    icon: "Connection",
    component: () => import("../views/Topology.vue"),
    menu: true,
  },
  {
    path: "/services",
    name: "HotsportServices",
    title: "服务列表",
    icon: "List",
    component: () => import("../views/Services.vue"),
    menu: true,
  },
  {
    path: "/services/detail",
    name: "HotsportServiceDetail",
    title: "服务详情",
    icon: "List",
    component: () => import("../views/ServiceDetail.vue"),
    menu: false,
  },
  {
    path: "/endpoints",
    name: "HotsportEndpoints",
    title: "端点分析",
    icon: "Aim",
    component: () => import("../views/Endpoints.vue"),
    menu: true,
  },
  {
    path: "/errors",
    name: "HotsportErrors",
    title: "错误排行",
    icon: "CircleClose",
    component: () => import("../views/Errors.vue"),
    menu: true,
  },
  {
    path: "/leaks",
    name: "HotsportLeaks",
    title: "资源泄漏",
    icon: "Warning",
    component: () => import("../views/Leaks.vue"),
    menu: true,
  },
  {
    path: "/jvm",
    name: "HotsportJvm",
    title: "JVM 指标",
    icon: "Cpu",
    component: () => import("../views/Jvm.vue"),
    menu: true,
  },
  {
    path: "/logs",
    name: "HotsportLogs",
    title: "日志",
    icon: "Tickets",
    component: () => import("../views/Logs.vue"),
    menu: true,
  },
  {
    path: "/realtime-log",
    name: "HotsportRealtimeLog",
    title: "实时日志",
    icon: "Monitor",
    component: () => import("../views/RealtimeLog.vue"),
    menu: true,
  },
  {
    path: "/alerts",
    name: "HotsportAlerts",
    title: "告警中心",
    icon: "Bell",
    component: () => import("../views/Alerts.vue"),
    menu: true,
  },
  {
    path: "/agent",
    name: "HotsportAgent",
    title: "Agent 中心",
    icon: "Monitor",
    component: () => import("../views/AgentCenter.vue"),
    menu: true,
  },
  {
    path: "/settings",
    name: "HotsportSettings",
    title: "接口设置",
    icon: "Setting",
    component: () => import("../views/Settings.vue"),
    menu: true,
  },
];

/**
 * 路由表：叶子路由，直接 addRoute("layout", …) 挂到宿主布局下。
 *
 * <p>每个组件都经过 {@code hotsportPage} 包装，负责样式作用域与弹层主题；
 * 组件名与路由名一致，宿主 keep-alive 才能按 name 命中缓存。</p>
 */
export const hotsportRoutes: RouteConfigsTable[] = PAGES.map((page) => ({
  path: `${ROUTE_PREFIX}${page.path}`,
  name: page.name,
  component: hotsportPage(page.name, page.component),
  meta: {
    title: page.title,
    icon: page.icon,
    showLink: page.menu,
    keepAlive: true,
  },
}));

/**
 * 静态菜单：「系统指标」分组。
 *
 * <p>宿主可整组挂到任意上级分组下（当前挂在「监控管理」），也可以忽略本导出、
 * 自行拼装 —— 路由与菜单同源，不会出现「有菜单没路由」的死链。</p>
 */
export const hotsportMenus: StaticMenuItem[] = [
  {
    path: ROUTE_PREFIX,
    name: "Hotsport",
    redirect: `${ROUTE_PREFIX}/dashboard`,
    meta: { title: "系统指标", icon: "DataLine", isVisible: "1" },
    children: PAGES.filter((page) => page.menu).map((page) => ({
      path: `${ROUTE_PREFIX}${page.path}`,
      name: page.name,
      meta: { title: page.title, icon: page.icon, isVisible: "1" },
    })),
  },
];