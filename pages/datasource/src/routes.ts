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
  kafka: "/kafka",
  elasticsearch: "/elasticsearch",
  jdbc: "/db-manager",
  // ClickHouse 与 DuckDB 都走 JDBC，打开表/设计表/查询/表结构全部复用数据库管理台，
  // 不另写一套管理面（另写一套必然出现「能连上但功能半通」的分叉）
  clickhouse: "/db-manager",
  duckdb: "/db-manager",
  redis: "/redis-manage",
  influxdb: "/influxdb",
  neo4j: "/neo4j",
  nacos: "/nacos",
  zookeeper: "/zookeeper",
  nginx: "/nginx",
  etcd: "/etcd",
  prometheus: "/prometheus",
  mongodb: "/mongodb",
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

  const routes: RouteConfigsTable[] = [
    {
      path: "/kafka",
      name: "Kafka",
      component: () => import("./views/console/KafkaManageView.vue"),
      meta: { title: "Kafka 管理", icon: "Coin", ...common },
    },
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
      path: "/mongodb",
      name: "MongoDB",
      component: () => import("./views/console/MongoManageView.vue"),
      meta: { title: "MongoDB 管理", icon: "Coin", ...common },
    },
    {
      // 字段可增 / 删 / 改（删改走后端重建索引）；图谱是「集群 → 节点」拓扑。
      // 此前只有视图与后端接口、没有路由，数据源中心点「打开管理」会稳定弹「未注册」
      // —— 正是本文件开头记的那类缺项，所以补上并纳进 MANAGER_ROUTE_MAP。
      // 注意：/elasticsearch 与 name=Elasticsearch 只在此处声明一次，重复声明会被
      // vue-router 静默丢弃后者，且 name 是 registerRoutesUnderLayout 的幂等键。
      path: "/elasticsearch",
      name: "Elasticsearch",
      component: () => import("./views/console/ElasticsearchManageView.vue"),
      meta: { title: "Elasticsearch 管理", icon: "Coin", ...common },
    },
    {
      path: "/prometheus/embed/:token",
      name: "PrometheusEmbed",
      component: () => import("./views/console/PrometheusEmbedView.vue"),
      meta: { title: "Prometheus 看板", showLink: false, standalone: true },
    },
  ];

  // 每个管理页追加一条「/full」全屏变体：数据源中心右键「打开管理（新标签）」的落地页。
  // standalone=true 注册为顶层路由（不套 layout），新标签打开时无顶部/左侧导航，
  // 打开的就是整个控制台本身。embed 看板已是 standalone，不重复生成。
  const managerPaths = new Set(Object.values(MANAGER_ROUTE_MAP));
  const fullVariants: RouteConfigsTable[] = routes
    .filter(r => managerPaths.has(r.path) && !r.meta?.standalone)
    .map(r => ({
      ...r,
      path: `${r.path}/full`,
      name: `${r.name as string}Full`,
      component: r.component,
      meta: {
        ...r.meta,
        title: `${(r.meta as { title?: string }).title ?? "管理"}（全屏）`,
        showLink: false,
        standalone: true,
      },
    }));
  return [...routes, ...fullVariants];
}

/**
 * 管理页路由路径清单（取自上面这份声明，不另写一份常量）。
 *
 * <p>给测试/验收脚本用：断言「宿主注册的管理页覆盖了全部已知类型」时，
 * 拿它与宿主 {@code router.getRoutes()} 对比，而不是把期望路径硬编码在脚本里 ——
 * 否则模块里补了新类型，脚本反而会漏检。</p>
 */
export const MANAGER_ROUTE_PATHS: string[] = Object.values(MANAGER_ROUTE_MAP);

/**
 * 数据同步任务页的叶子路由。
 *
 * <p>数据同步（源 jdbc 按 SQL 读 → 字段映射 → 目标 jdbc 表）的视图与 API 都收进
 * {@code @pages/datasource}（视图 {@code views/sync/SyncTaskView.vue}，API
 * {@code api/syncTaskApi.ts}），路由也由本包声明，宿主只做合并。</p>
 *
 * <p>与 {@link createDatasourceManageRoutes} 不同，这里产出一条<b>顶层叶子</b>
 * {@code showLink:true}（要进侧边栏，宿主可把它并入自己的「数据中心」分组 children，
 * 此前监控台就放在 {@code /grp-data} 下）。本包不声明分组父节点 —— 列表页各宿主不同，
 * 分组归属是宿主的拼装职责（见本文件头注）。</p>
 *
 * @returns 可直接展开进宿主路由树的数组（单叶）
 */
export function createSyncTaskRoutes(): RouteConfigsTable[] {
  return [
    {
      path: "/sync-tasks",
      name: "SyncTasks",
      // 数据同步：源 jdbc 数据源按 SQL 读 → 字段映射 → 目标 jdbc 数据源的表，
      // 执行由后端复用 datasync 引擎完成（源读取 / 字段映射转换 / Sink 契约）。
      component: () => import("./views/sync/SyncTaskView.vue"),
      meta: { title: "数据同步", icon: "Refresh", showLink: true, rank: 2 },
    },
  ];
}

/**
 * 同步日志页的叶子路由。
 *
 * <p>「同步日志」= 跨任务汇总每一次数据同步执行的旅程与过程日志（落库
 * {@code ms_sync_task_run_log}，保留 30 天），视图 {@code views/sync/SyncTaskLogView.vue}，
 * API 与「数据同步」共用 {@code api/syncTaskApi.ts}（{@code fetchSyncRunLogs} /
 * {@code fetchSyncRunLogDetail}），路由由本包声明，宿主只做合并。</p>
 *
 * <p>与 {@link createSyncTaskRoutes} 同构：产出一条<b>顶层叶子</b>{@code showLink:true}，
 * 宿主把它并入「数据中心」分组 children（监控台 {@code /grp-data}）。</p>
 *
 * @returns 可直接展开进宿主路由树的数组（单叶）
 */
export function createSyncTaskLogRoutes(): RouteConfigsTable[] {
  return [
    {
      path: "/sync-task-logs",
      name: "SyncTaskLogs",
      component: () => import("./views/sync/SyncTaskLogView.vue"),
      meta: { title: "同步日志", icon: "Tickets", showLink: true, rank: 3 },
    },
  ];
}
