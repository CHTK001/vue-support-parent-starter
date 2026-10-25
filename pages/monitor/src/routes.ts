/**
 * @pages/monitor 的路由收敛口 —— 监控侧能力只此一份声明。
 *
 * <p><strong>为什么要有这一层</strong>：宿主应用（{@code apps/vue-support-monitor-starter}）
 * 此前在自己的 {@code routes.ts} 里逐条抄视图路径。抄两份必然漂 ——
 * 「服务管理」页从 {@code @pages/server} 迁到本包时，宿主那份抄件就成了死链，
 * 症状是侧边栏点「服务管理」白屏，而编译与构建都是绿的。</p>
 *
 * <p><strong>收敛后的形状</strong>：路由表由本包声明，宿主只做合并 ——
 * {@link createMonitorRoutes} 产出分组路由，{@link createMonitorManageRoutes} 产出
 * 各类管理页（隐藏路由，由列表页「打开管理」进入）。</p>
 *
 * <p><strong>边界</strong>：本包只管「监控侧」的能力（服务管理 / 在线节点 / 抓包 / 告警 /
 * 指标 / Redis 等）。主机资产、远控、ACME 属于 {@code @pages/server}；
 * 数据源台账与管理页属于 {@code @pages/datasource}。各归各家，宿主只做拼装。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import type { RouteConfigsTable } from "@repo/core";

/** {@link createMonitorRoutes} 的可选项 */
export interface MonitorRoutesOptions {
  /**
   * 侧边栏高亮回指的路由路径。
   *
   * <p>管理页全部 {@code showLink:false}（不进侧边栏），从列表点进去后侧边栏仍要
   * 停在所属分组上，靠的就是 {@code activeMenu}。各宿主的前缀不同
   * （监控台用 {@code /services}，单宿主应用可省略），所以由宿主传入。</p>
   */
  activeMenu?: string;
}

/**
 * 生成监控侧的业务路由树（分组结构），宿主合并进自己的路由树即可。
 *
 * <p>分组父节点没有 component 也没有 redirect，只是侧边栏的分组标题；
 * 真正注册成路由的是带 component 的叶子节点（框架会平铺挂到 layout 之下）。</p>
 *
 * @param options 可选项，主要是 activeMenu
 * @returns 可直接展开进宿主路由树的数组
 */
export function createMonitorRoutes(options: MonitorRoutesOptions = {}): RouteConfigsTable[] {
  const activeMenu = options.activeMenu || "/services";

  return [
    // ==================== 指标看板 ====================
    // 单台服务器的实时指标大盘：CPU / 内存 / 磁盘 / 网络 / JVM + 3D 可视化，
    // 下方挂「软件识别结果」表（SoftwareMetricTable，按 monitorId 聚合已安装软件指标）。
    // 此前该视图一直没进路由表，属于「编译绿、页面打不开」的死页，故在此显式声明。
    {
      path: "/grp-metrics",
      name: "GroupMetrics",
      meta: { title: "指标看板", icon: "DataLine", showLink: true, rank: 16 },
      children: [
        {
          path: "/server-dashboard",
          name: "ServerDashboard",
          component: () => import("./views/dashboard/ScServerDashboard.vue"),
          meta: { title: "服务器指标", icon: "Monitor", showLink: true, rank: 16 },
        },
      ],
    },

    // ==================== 服务管理 ====================
    // 协议服务器节点（Server 接口 + ServerFilter 编排）的增删改查、启停与热更新。
    // 视图与 API 都在本包，宿主只挂路由。
    {
      path: "/grp-service",
      name: "GroupService",
      meta: { title: "服务管理", icon: "Operation", showLink: true, rank: 15 },
      children: [
        {
          path: "/services",
          name: "Services",
          component: () => import("./views/ScServiceManage.vue"),
          meta: { title: "服务管理", icon: "Link", showLink: true, rank: 15 },
        },
      ],
    },

    // ==================== 隐藏路由（不进菜单，仍可访问） ====================
    {
      // 服务发现：协议服务器上挂载的发现插件实例列表。
      // 归监控侧（数据源是服务端发现的实时实例，不是台账），故挂本包。
      path: "/discovery",
      name: "Discovery",
      component: () => import("./views/DiscoveryView.vue"),
      meta: { title: "服务发现", icon: "Connection", showLink: false, activeMenu },
    },
  ];
}

/**
 * 生成监控侧管理页的隐藏路由（不进侧边栏，由列表页「打开管理」进入）。
 *
 * <p>全部条目挂在顶层隐藏区，不能塞进分组 children：菜单过滤
 * （{@code getShowStaticAndDynamicMenuList}）的「顶层 isVisible=0 剔除」不递归，
 * 挂在分组下时子项的 {@code showLink:false} 拦不住，会被渲染进侧边栏。</p>
 *
 * @param options 可选项，主要是 activeMenu
 * @returns 可直接展开进宿主路由树的数组
 */
export function createMonitorManageRoutes(options: MonitorRoutesOptions = {}): RouteConfigsTable[] {
  const activeMenu = options.activeMenu || "/services";

  return [
    {
      path: "/online-nodes",
      name: "OnlineNodes",
      component: () => import("./views/OnlineNodesView.vue"),
      meta: { title: "在线节点", icon: "Connection", showLink: false, activeMenu },
    },
  ];
}
