/**
 * @pages/apm 路由与菜单 —— 只声明一次。
 *
 * <p><strong>一个菜单入口</strong>：`/apm` 是唯一可见项，12 个视图是它的页签
 * （见 `tabs.ts` 与 `views/Workbench.vue`）。把 12 条菜单收成一条，是因为它们
 * 属于同一条使用动线（总览 → 服务 → 链路 → 告警），拆开只会让导航比内容还长。</p>
 *
 * <p><strong>旧地址仍然可用</strong>：`/apm/services`、`/apm/alarms` 这些曾经
 * 直接可点的路径全部 301 式重定向到 `/apm?tab=<name>`。视图内部还按旧路径跳
 * （例如日志页跳链路详情），保留重定向就不必去改 12 个页面里的每一处
 * `router.push`。详情页（服务详情 / 链路详情）例外 —— 它们本来就是要能被分享、
 * 被浏览器后退的独立地址，因此保留自己的路由。</p>
 *
 * @since 4.0.0.51
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";
import { ROUTE_PREFIX } from "../config";
import { APM_TABS } from "../tabs";
// 页面版式（apm- 前缀）必须跟着「路由」一起加载：
// 宿主用的是 `@pages/apm/src/routes` 这个深路径，包根 index.ts 不会执行，
// 样式写在包根就等于没写（页面会变成一堆没有栅格、没有间距的裸文本）。
import "../styles/apm.css";

/** 工作台路由名（keep-alive 的 include 按它登记） */
export const APM_WORKBENCH_ROUTE = "ApmWorkbench";

/**
 * 保留独立地址的两个详情页。
 *
 * <p>为什么不塞进页签：详情是「从列表点进去看一条」的下钻结果，地址要能单独
 * 发给人、要能后退回来；做成页签反而会让页签条里出现一堆「某条链路」。</p>
 */
const DETAIL_ROUTES: RouteConfigsTable[] = [
  {
    path: `${ROUTE_PREFIX}/services/detail`,
    name: "ApmServiceDetail",
    component: () => import("../views/ServiceDetail.vue"),
    meta: {
      title: "服务详情",
      icon: "List",
      showLink: false,
      keepAlive: true,
      activeMenu: ROUTE_PREFIX,
    },
  },
  {
    path: `${ROUTE_PREFIX}/traces/detail`,
    name: "ApmTraceDetail",
    component: () => import("../views/TraceDetail.vue"),
    meta: {
      title: "链路详情",
      icon: "Document",
      showLink: false,
      keepAlive: true,
      activeMenu: ROUTE_PREFIX,
    },
  },
];

/**
 * 旧地址 → 页签的重定向。
 *
 * <p>页签名与旧路径的最后一段完全一致（`overview` ↔ `/apm/overview`），
 * 所以这里直接从页签表派生，不再手抄一份映射 —— 少一处会忘记同步的表。</p>
 *
 * <p>`to.query` 原样保留：`/apm/profiles?service=xxx` 重定向后依然带着 service，
 * 剖析页才能在进来时直接选中该服务。</p>
 */
const LEGACY_ROUTES: RouteConfigsTable[] = APM_TABS.map(tab => ({
  path: `${ROUTE_PREFIX}/${tab.name}`,
  redirect: to => ({
    path: ROUTE_PREFIX,
    query: { ...to.query, tab: tab.name },
  }),
  meta: {
    title: tab.label,
    icon: tab.icon,
    showLink: false,
    activeMenu: ROUTE_PREFIX,
  },
}));

/**
 * 路由表：叶子路由，直接 `addRoute("layout", …)` 挂到宿主布局下。
 *
 * <p>组件不经包装器 —— 本包一律用宿主主题变量，没有「样式作用域 / 弹层主题」
 * 要维护，页面组件直接当路由组件即可（少一层包装也少一处组件名冲突）。</p>
 */
export const apmRoutes: RouteConfigsTable[] = [
  {
    path: ROUTE_PREFIX,
    name: APM_WORKBENCH_ROUTE,
    component: () => import("../views/Workbench.vue"),
    meta: {
      title: "APM 观测",
      icon: "DataLine",
      showLink: true,
      keepAlive: true,
    },
  },
  ...DETAIL_ROUTES,
  ...LEGACY_ROUTES,
];

/**
 * 静态菜单：「APM 观测」一条。
 *
 * <p>宿主把 `apmRoutes` 挂到分组下时，分组只剩一个可见子项，侧边栏会把它
 * 折叠成单条菜单（`menu.collapseSingleChild`），不会再出现 12 条并列项。</p>
 */
export const apmMenus: StaticMenuItem[] = [
  {
    path: ROUTE_PREFIX,
    name: "Apm",
    meta: { title: "APM 观测", icon: "DataLine", isVisible: "1" },
  },
];
