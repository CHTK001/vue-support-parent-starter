/**
 * @pages/datasource 的路由收敛口 —— 数据源管理页只此一份声明。
 *
 * <p><strong>为什么以前会漏</strong>：这些管理页的视图全在 {@code pages/datasource} 里，
 * 但路由声明过去由每个宿主应用在自己的 {@code routes.ts} 里抄一遍。抄了两份就出了事 ——
 * 采集调度应用抄了 9 类里的 8 类，唯独漏了 Prometheus，于是只有 Prometheus 数据源点
 * 「打开管理」会弹「当前应用未注册 /prometheus 管理页」。这类缺项在菜单上看不出来
 * （全是 {@code showLink:false}），只有逐类点过去才会暴露，所以不能靠人工对账，
 * 必须让路由与「类型→路径」映射同出一处。</p>
 *
 * <p><strong>收敛后的形状</strong>：路由表与类型映射都在本文件，宿主只做一件事 ——
 * 把 {@link createDatasourceManageRoutes} 的结果并进自己的路由树，并告诉它
 * 「我的数据源列表在哪」（仅影响侧边栏高亮回指）。宿主不再抄视图路径。</p>
 *
 * <p><strong>为什么不把列表页也收进来</strong>：列表页组件各宿主不同（监控台用
 * ScDataCenterView 注入「数据表」页签，采集台直接用 ScDataSourceView），
 * 路径与 activeMenu 也不统一，强行收进来会让工厂参数膨胀；列表页本就在宿主路由树的
 * 「数据中心」分组里，归属清楚，不属于「抄了会漂」的同类问题。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import type { RouteConfigsTable } from "@repo/core";

/**
 * 数据源类型 → 管理页路由路径。
 *
 * <p>这张表与 {@link createDatasourceManageRoutes} 产出的路径必须一一对应：
 * 「打开管理」按类型查路径，再查本应用有没有注册该路由，两处若不同源就会重现
 * 「某类型永远打不开」的老问题。{@link MANAGER_ROUTE_PATHS} 是这份对应关系的可断言形式。</p>
 */
export const MANAGER_ROUTE_MAP: Record<string, string> = {
  jdbc: "/db-manager",
  redis: "/redis-manage",
  influxdb: "/influxdb",
  neo4j: "/neo4j",
  nacos: "/nacos",
  zookeeper: "/zookeeper",
  nginx: "/nginx",
  etcd: "/etcd",
  prometheus: "/prometheus",
};

/**
 * 按数据源类型取管理页路由路径。
 *
 * <p>只有映射里有的类型才有管理页；没命中的类型提示「该类型的管理页面开发中」，
 * 而不是把路径硬凑一个 —— 硬凑出来的路径必然没注册，点下去又是那句「未注册」。</p>
 *
 * @param type 数据源类型（台账里的 {@code type} 字段）
 * @returns 路由路径；该类型没有管理页时返回 undefined
 */
export function managerRouteFor(type: string): string | undefined {
  return MANAGER_ROUTE_MAP[type];
}

/** {@link createDatasourceManageRoutes} 的可选项 */
export interface DatasourceManageRoutesOptions {
  /**
   * 侧边栏高亮回指的数据源列表路由路径。
   *
   * <p>管理页全部 {@code showLink:false}（不进侧边栏），从列表点进去后侧边栏仍要
   * 停在「数据源」上，靠的就是 {@code activeMenu}。各宿主列表路径不同
   * （监控台 /datasource、采集台 /collect/datasource/list），所以由宿主传入。</p>
   *
   * <p>缺省 {@code /datasource}：与监控台的数据源列表路径一致，
   * 单宿主应用（模板 starter）不传也能高亮到正确位置。</p>
   */
  activeMenu?: string;
}

/**
 * 生成数据源管理页路由树，宿主合并进自己的路由树即可。
 *
 * <p>全部条目挂在顶层隐藏区，不能塞进分组 children：菜单过滤
 * （{@code getShowStaticAndDynamicMenuList}）的「顶层 isVisible=0 剔除」不递归，
 * 挂在分组下时子项的 {@code showLink:false} 拦不住，会被渲染进侧边栏。</p>
 *
 * @param options 可选项，主要是 activeMenu
 * @returns 可直接展开进宿主路由树的数组
 */
export function createDatasourceManageRoutes(
  options: DatasourceManageRoutesOptions = {},
): RouteConfigsTable[] {
  const activeMenu = options.activeMenu || "/datasource";
  const common = { showLink: false, activeMenu } as const;

  return [
    {
      // 数据库管理：数据源中心里点进去的全功能控制台（右键菜单、DDL、文档导出都在里面）
      path: "/db-manager",
      name: "DbManager",
      component: () => import("./views/console/DatabaseManagerView.vue"),
      meta: { title: "数据库管理", icon: "Coin", ...common },
    },
    {
      path: "/redis-manage",
      name: "RedisManage",
      component: () => import("./views/console/RedisManageView.vue"),
      meta: { title: "Redis 管理", icon: "Coin", ...common },
    },
    {
      path: "/influxdb",
      name: "InfluxDB",
      component: () => import("./views/console/InfluxDBManageView.vue"),
      meta: { title: "InfluxDB 管理", icon: "DataAnalysis", ...common },
    },
    {
      path: "/neo4j",
      name: "Neo4j",
      component: () => import("./views/console/Neo4jManageView.vue"),
      meta: { title: "Neo4j 管理", icon: "Share", ...common },
    },
    {
      path: "/nacos",
      name: "Nacos",
      component: () => import("./views/console/NacosManageView.vue"),
      meta: { title: "Nacos 管理", icon: "Setting", ...common },
    },
    {
      path: "/zookeeper",
      name: "Zookeeper",
      component: () => import("./views/console/ZookeeperManageView.vue"),
      meta: { title: "ZooKeeper 管理", icon: "Share", ...common },
    },
    {
      path: "/etcd",
      name: "Etcd",
      component: () => import("./views/console/EtcdManageView.vue"),
      meta: { title: "etcd 管理", icon: "Coin", ...common },
    },
    {
      path: "/nginx",
      name: "Nginx",
      component: () => import("./views/console/NginxManageView.vue"),
      meta: { title: "Nginx 管理", icon: "Connection", ...common },
    },
    {
      // 自定义看板嵌入页：standalone 注册为顶层路由（不套 layout），供其他系统 iframe 嵌入。
      // 免登录靠宿主 app.yaml 的 routeConfig.whiteList 放行（/**/embed/**），本模块不强求。
      path: "/nginx/embed/:token",
      name: "NginxEmbed",
      component: () => import("./views/console/NginxEmbedView.vue"),
      meta: { title: "Nginx 看板", showLink: false, standalone: true },
    },
    {
      path: "/prometheus",
      name: "Prometheus",
      component: () => import("./views/console/PrometheusManageView.vue"),
      meta: { title: "Prometheus 管理", icon: "DataLine", ...common },
    },
    {
      path: "/prometheus/embed/:token",
      name: "PrometheusEmbed",
      component: () => import("./views/console/PrometheusEmbedView.vue"),
      meta: { title: "Prometheus 看板", showLink: false, standalone: true },
    },
  ];
}

/**
 * 管理页路由路径清单（取自上面这份声明，不另写一份常量）。
 *
 * <p>给测试/验收脚本用：断言「宿主注册的管理页覆盖了全部已知类型」时，
 * 拿它与宿主 {@code router.getRoutes()} 对比，而不是把期望路径硬编码在脚本里 ——
 * 否则模块里补了新类型，脚本反而会漏检。</p>
 */
export const MANAGER_ROUTE_PATHS: string[] = Object.values(MANAGER_ROUTE_MAP);
