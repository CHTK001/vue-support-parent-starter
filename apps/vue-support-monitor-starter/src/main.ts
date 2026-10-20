/**
 * vue-support-monitor-starter 路由模式入口
 *
 * 模式：mode=router（默认）+ koi 布局（侧边栏菜单由路由树自动推导）
 * 路由模式：hash（routerMode: "hash"）
 *
 * 与 single 模式的区别：
 *   - 使用 koi 默认布局（AppWithRouter + layout），不再需要自定义 App.vue
 *   - 侧边栏菜单由路由树（RouteConfigsTable[]）自动推导
 *   - 业务路由自动挂到 layout 之下
 * @author CH
 * @since 4.0.0
 */
import { createContextApp } from "@repo/app";
import "./styles/pages.css";
import "./styles/telemetry.css";
import ProcessHost from "./components/ProcessHost.vue";
import monitorRoutes from "./routes";
import { registerMonitorDatasourceSchema } from "@pages/datasource";

/** 本页可能用到的 Re* 组件。
 *  注意：ReIcon / ReScrollNav / ReDrawer 已由 koi 主题安装器（installKoi 内部 installUiComponents）
 *  注册，且先于本清单执行，不要再列入 ——
 *  重复 app.component 会触发 Vue「has already been registered」生产期控制台告警。 */
const MONITOR_RE_COMPONENTS = [
  "ReButton",
  "ReTag",
  "ReBadge",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReDialog",
  "ReTable",
  "RePagination",
  "ReForm",
  "ReEmpty",
  "ReSkeleton",
  "ReCard",
  "ReStatusIndicator",
  "ReStatCard",
  "ReSectionHead",
  "ReSwitch",
  "ReFilter",
  "ReText",
  "ReCountup",
  "ReTrend",
  "ReRemoteSelect",
  "ReLoading",
  "ReScrollbar",
  "ReTagFilter",
  "ReTree",
  "ReEmptyState",
  "ReTab",
  "ReKit",
  "ReProcessTask",
  "ReCommand",
  "ReIconSelect",
  "ReRelationGraph",
];

// 数据源中心「浏览表结构」改走监控后端 /ms/monitor/db/*（不依赖采集平台）
// 实现已收敛进 @pages/datasource，宿主只需启动时调一次。
registerMonitorDatasourceSchema();

// 数据源台账接口前缀：沿用 @pages/datasource 的默认 /ms/datasource。
//
// 曾经在这里覆盖成 /ms/monitor/datasource，理由是「未部署 hub 模块」。
// 该前提已不成立：监控后端的 fat jar 里带了 spring-support-datasource-hub-starter，
// /ms/datasource/list 实测 HTTP 200 且能返回真实台账；
// 而 /ms/monitor/datasource/list 实测 HTTP 404「资源不存在」——
// 监控后端里根本没有 datasource 的 Controller，这条覆盖只会让整个数据源中心恒为空。
// 故删掉覆盖，回到共享包默认值。

// createContextApp 一站式装配：主题/菜单/路由由框架处理，Re* 组件按需安装交给
// ui()，全局过程任务浮层宿主交给 host()，宿主路径不再需要 main.ts 手写
// installUi / createVNode / render / appendChild。
await createContextApp({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  mode: "router",
  routerMode: "hash",
  /**
   * 本应用的代码级默认配置（优先级最低的一层）。
   *
   * <p>这里声明「默认走分组导航」：</p>
   * <ul>
   *   <li>{@code collapseSingleChild: true} —— 只有一个子项的分组也渲染成可展开的
   *       二级菜单，而不是被压平；{@code flattenSingleRoot: false} —— 分组不因
   *       「单根」被自动提升为顶层项，保证「监控管理 / 数据中心 / 资产管理 /
   *       发布管理 / 系统管理」五个分组始终存在。</li>
   * </ul>
   *
   * <p>app.example.yaml / app.yaml / app.{env}.yaml / 远程配置 / 环境变量仍能覆盖它
   * （例如运维临时在 app.yaml 里关掉分组），符合「代码给默认、配置可覆盖」。</p>
   */
  defaults: {
    menu: {
      collapseSingleChild: true,
      flattenSingleRoot: false,
    },
  },
})
  .ui({ components: MONITOR_RE_COMPONENTS })
  .host(ProcessHost)
  .routes(monitorRoutes)
  .mount("#app");

/** 预加载弹窗内组件的懒加载布局（ReDialog koi / ReSelect / ReSwitch / ReDrawer），消除首次打开卡顿 */
void import("@repo/ui/components/ReDialog/theme/koi/ReDialog.vue");
void import("@repo/ui/components/ReSelect/layouts/Square.vue");
void import("@repo/ui/components/ReSelect/layouts/Modern.vue");
void import("@repo/ui/components/ReSwitch/layouts/SquareReSwitch.vue");
void import("@repo/ui/components/ReSwitch/layouts/CardReSwitch.vue");
void import("@repo/ui/components/ReDrawer");
