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
import type { App as VueApp } from "vue";
import { installKoi } from "@repo/theme/koi/framework";
import "./styles/tokens.css";
import "./styles/pages.css";
import "./styles/telemetry.css";
import { installUi } from "@repo/ui";
import monitorRoutes from "./routes";

/** 本页可能用到的 Re* 组件（ReIcon / ReScrollNav / ReDrawer 已由 installKoi 注册） */
const MONITOR_RE_COMPONENTS = [
  "ReButton",
  "ReIcon",
  "ReTag",
  "ReBadge",
  "ReInput",
  "ReInputNumber",
  "ReSelect",
  "ReDialog",
  "ReDrawer",
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
];

/**
 * koi 单页面安装：
 * 1. installKoi —— ElementPlus + 图标 + 公共指令 + koi SVG sprite + koi 主题样式
 * 2. installUi —— 按需注册本应用用到的 Re* 组件
 */
/**
 * koi 单页面安装：
 * 1. installKoi —— ElementPlus + 图标 + 公共指令 + koi SVG sprite + koi 主题样式
 * 2. installUi —— 按需注册本应用用到的 Re* 组件
 * @param app Vue 应用实例
 * @returns 安装完成
 */
async function installKoiSinglePage(app: VueApp): Promise<void> {
  await installKoi(app);
  await installUi(app, { components: MONITOR_RE_COMPONENTS });
}

await createContextApp({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  mode: "router",
  routerMode: "hash",
  install: installKoiSinglePage,
})
  .routes(monitorRoutes)
  .mount("#app");

/** 预加载弹窗内组件的懒加载布局（ReDialog koi / ReSelect / ReSwitch / ReDrawer），消除首次打开卡顿 */
void import("@repo/ui/components/ReDialog/theme/koi/ReDialog.vue");
void import("@repo/ui/components/ReSelect/layouts/Square.vue");
void import("@repo/ui/components/ReSelect/layouts/Modern.vue");
void import("@repo/ui/components/ReSwitch/layouts/SquareReSwitch.vue");
void import("@repo/ui/components/ReSwitch/layouts/CardReSwitch.vue");
void import("@repo/ui/components/ReDrawer");
