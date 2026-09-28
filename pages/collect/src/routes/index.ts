/**
 * 采集模块路由树（@pages/collect）。
 *
 * 只保留采集侧：数据采集分组 + 顶级的数据源。平台总览与 /home 重定向属跨系统视图，
 * 放在宿主 app；调度中心分组在 @pages/job。三者由采集调度系统在 app 入口处拼装。
 *
 * 路由模式：hash（见 app 的 main.ts）。
 *
 * 菜单结构：采集侧只贡献「一个分组 + 一个顶级项」。
 *
 *   平台总览                （宿主层 @repo/app 入口）
 *   数据采集  ▸ 采集器管理 / 运行记录 / 采集结果
 *   数据源                    ← 顶级，不进「数据采集」组
 *   调度中心  ▸ 调度作业 / 远程节点 / 作业日志   （@pages/job）
 *
 * 为什么数据源提到顶级：它是数据源中心的台账，别的模块（采集、调度）都要用，
 * 挂在「数据采集」底下会让人以为它只服务于采集，跨模块引用时也找不到入口。
 * 顶级项的排序取决于 main.ts 的数组拼接顺序，不是 meta.rank。
 *
 * 采集器管理是核心门面（流程设计做成弹窗、变量/函数/通知做成配置弹窗），
 * 运行记录、采集结果是它的下游。
 *
 * 旧路径保留为 showLink:false 的别名：菜单里不再出现，但旧书签 / 其它系统的深链
 * 打过来不会 404。别名页面靠 query 决定初始落点：
 *   /collect/design?flowId=3     直接打开该采集器的流程设计弹窗
 *   /collect/variable?panel=variable  打开采集器管理的「变量」配置页签
 */
import type { RouteConfigsTable } from "@repo/core";

/** 采集侧路由树（数据采集分组 + 顶级数据源 + 旧路径别名） */
export const collectRoutes: RouteConfigsTable[] = [
  {
    path: "/grp-collect",
    name: "GroupCollect",
    meta: { title: "数据采集", icon: "Download", showLink: true, rank: 1 },
    children: [
      {
        path: "/collect/collector",
        name: "CollectCollector",
        component: () => import("../views/CollectorView.vue"),
        meta: { title: "采集器管理", icon: "Coin", showLink: true, keepAlive: true, rank: 1, isVisible: "1" },
      },
      {
        // 运行记录就是原来的任务监控：一次运行 = 一个运行ID（collect_task_no），
        // 列表里能回放这次运行，也能跳到这次的采集结果。
        path: "/collect/run",
        name: "CollectRun",
        component: () => import("../views/TaskView.vue"),
        meta: { title: "运行记录", icon: "Timer", showLink: true, keepAlive: true, rank: 2, isVisible: "1" },
      },
      {
        path: "/collect/record",
        name: "CollectRecord",
        component: () => import("../views/RecordView.vue"),
        meta: { title: "采集结果", icon: "Files", showLink: true, keepAlive: true, rank: 3, isVisible: "1" },
      },
    ],
  },

  /* -------------------------------- 数据源（顶级） -------------------------------- */
  {
    // 数据源台账只有一份实现：@pages/datasource（对接数据源中心 /ms/datasource）
    //
    // 挂顶级而不是塞进「数据采集」分组：它服务采集、调度等多个域，
    // 放进采集组会让人误判它的归属（详见文件头注释）。
    //
    // 深导入必须带 src/。本应用 vite.config 的 alias 把 @pages/datasource 指向
    // 包根目录（pages/datasource），alias 优先于包 exports，所以：
    //   "@pages/datasource/views/X.vue"     -> pages/datasource/views/X.vue      ✗ 不存在
    //   "@pages/datasource/src/views/X.vue" -> pages/datasource/src/views/X.vue  ✓
    // 实测（dev server）：不带 src/ 时本模块 500、routes 桶文件连带失败、引用本包的
    // 页面全部白屏；生产构建走包 exports 能解析，所以只跑 vue-tsc / vite build 发现不了。
    //
    // 顶级项不会被子菜单展平逻辑处理：侧边栏把无 children 的顶级项渲染成 menu-item，
    // 与「平台总览」同级（实测 .el-menu 下有 2 个 el-sub-menu + 2 个 el-menu-item）。
    path: "/collect/datasource/list",
    name: "CollectDatasourceList",
    component: () => import("@pages/datasource/src/views/ScDataSourceView.vue"),
    meta: { title: "数据源", icon: "Coin", showLink: true, keepAlive: true, rank: 2, isVisible: "1" },
  },

  /* -------------------------------- 旧路径别名 -------------------------------- */
  // 必须挂在顶级、不能放进上面的菜单分组：
  //   侧边栏过滤（@repo/utils 的 getShowStaticAndDynamicMenuList）只对顶级数组做 filter，
  //   不递归子级；放进分组 children 的隐藏项会原样出现在菜单里（实测）。
  // 顶级项走同一条过滤：toMenuNode 把 showLink:false 换算成 isVisible=0 → 正确隐藏。
  // 别名页靠 query 决定落点：?flowId=3 进设计弹窗，?panel=notice 进对应配置页签。
  {
    path: "/collect/design",
    name: "CollectDesignAlias",
    component: () => import("../views/CollectorView.vue"),
    meta: { title: "流程设计", showLink: false, keepAlive: true, rank: 90 },
  },
  {
    path: "/collect/task",
    name: "CollectTaskAlias",
    component: () => import("../views/TaskView.vue"),
    meta: { title: "任务监控", showLink: false, keepAlive: true, rank: 91 },
  },
  {
    path: "/collect/variable",
    name: "CollectVariableAlias",
    component: () => import("../views/CollectorView.vue"),
    meta: { title: "变量管理", showLink: false, keepAlive: true, rank: 92 },
  },
  {
    path: "/collect/function",
    name: "CollectFunctionAlias",
    component: () => import("../views/CollectorView.vue"),
    meta: { title: "函数库", showLink: false, keepAlive: true, rank: 93 },
  },
  {
    path: "/collect/notice",
    name: "CollectNoticeAlias",
    component: () => import("../views/CollectorView.vue"),
    meta: { title: "执行通知", showLink: false, keepAlive: true, rank: 94 },
  },
];

export default collectRoutes;
