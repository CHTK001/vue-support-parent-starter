/**
 * vue-support-monitor-starter 单页沉浸式控制台入口
 *
 * 模式：mode=single + koi 单页面安装器（installKoi：ElementPlus/图标/指令/koi 全局样式与圆角令牌），
 * 叠加本应用自研 UI —— 工作台 / 告警 / 资产 / 远控（design.md v2）
 */
import { createContextApp } from "@repo/app";
import type { App as VueApp } from "vue";
import { installKoi } from "@repo/theme/koi/framework";
import "./styles/tokens.css";
import "./styles/pages.css";
import { installUi } from "@repo/ui";
import App from "./App.vue";
import router from "./router";

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
  "ReKit",
];

/**
 * koi 单页面安装：
 * 1. installKoi —— ElementPlus + 图标 + 公共指令 + koi SVG sprite + koi 主题样式
 *    （styles/index.scss：reset / theme-vars / 圆角令牌 radius / element 覆盖等）
 * 2. installUi —— 按需注册本应用用到的 Re* 组件
 *
 * 样式加载顺序（import 提升后）：element css → koi 样式 → 本应用 tokens.css / pages.css，
 * 应用自有令牌在后，冲突时应用层胜出。
 */
async function installKoiSinglePage(app: VueApp): Promise<void> {
  await installKoi(app);
  await installUi(app, { components: MONITOR_RE_COMPONENTS });
}

await createContextApp({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  mode: "single",
  install: installKoiSinglePage,
})
  .app(App)
  .use(router)
  .mount("#app");

/** 预加载弹窗内组件的懒加载布局（ReDialog koi / ReSelect / ReSwitch / ReDrawer），消除首次打开卡顿 */
void import("@repo/ui/components/ReDialog/theme/koi/ReDialog.vue");
void import("@repo/ui/components/ReSelect/layouts/Square.vue");
void import("@repo/ui/components/ReSelect/layouts/Modern.vue");
void import("@repo/ui/components/ReSwitch/layouts/SquareReSwitch.vue");
void import("@repo/ui/components/ReSwitch/layouts/CardReSwitch.vue");
void import("@repo/ui/components/ReDrawer");
