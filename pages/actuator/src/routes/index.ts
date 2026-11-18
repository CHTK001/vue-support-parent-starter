/**
 * Actuator 独立页面（{@code /actuator}）路由与菜单 —— 只声明一次。
 *
 * <p><strong>一个菜单入口</strong>：{@code /actuator} 是唯一可见项，11 个端点
 * （health / info / metrics / env / loggers / mappings / beans / conditions /
 * threaddump / configprops / scheduledtasks）是它的页签（见 `tabs.ts` 与
 * `views/ActuatorPage.vue`）。这 11 个页签本来是同一件事的不同切面：
 * 排障时先看健康、再翻映射、必要时改日志级别 —— 拆成 11 条侧边栏只会让导航比
 * 内容还长。</p>
 *
 * <p><strong>为什么不再开 11 条叶子路由</strong>：页签切换本来就是「同一页换个
 * 视角」，走路由会重建工作台实例，页签保活、滚动位置、过滤词全部丢失。页签状态
 * 只同步到地址上的 {@code ?tab=}（{@code replaceState}），不新增路由记录。</p>
 *
 * <p>页签与端点的对应关系以 {@code ../endpoints.ts} 的 {@link ACTUATOR_ENDPOINTS}
 * 为唯一事实来源（见 `tabs.ts`），这里只声明宿主挂载点。</p>
 *
 * @since 4.0.0.51
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";
// 页面版式（act- 前缀）必须跟着「路由」一起加载：
// 宿主用的是 `@pages/actuator/src/routes` 这个深路径，包根 index.ts 不会执行，
// 样式写在包根就等于没写（页面会变成一堆没有栅格、没有间距的裸文本）。
import "../styles/actuator.css";

/** 页面路由根前缀：{@code /actuator} */
export const ROUTE_PREFIX = "/actuator";

/** 工作台路由名（keep-alive 的 include 按它登记） */
export const ACTUATOR_WORKBENCH_ROUTE = "ActuatorWorkbench";

/**
 * 路由表：唯一叶子路由，直接 `addRoute("layout", …)` 挂到宿主布局下。
 *
 * <p>组件不经包装器 —— 本包一律用宿主主题变量，没有「样式作用域 / 弹层主题」
 * 要维护，页面组件直接当路由组件即可。</p>
 */
export const actuatorRoutes: RouteConfigsTable[] = [
  {
    path: ROUTE_PREFIX,
    name: ACTUATOR_WORKBENCH_ROUTE,
    component: () => import("../views/ActuatorPage.vue"),
    meta: {
      title: "Actuator 观测",
      icon: "Monitor",
      showLink: true,
      keepAlive: true,
    },
  },
];

/**
 * 静态菜单：「Actuator 观测」一条。
 *
 * <p>宿主把 `actuatorRoutes` 挂到分组下时，分组只剩一个可见子项，侧边栏会把它
 * 折叠成单条菜单（`menu.collapseSingleChild`），不会出现 11 条并列项。</p>
 */
export const actuatorMenus: StaticMenuItem[] = [
  {
    path: ROUTE_PREFIX,
    name: "Actuator",
    meta: { title: "Actuator 观测", icon: "Monitor", isVisible: "1" },
  },
];

export default actuatorRoutes;
