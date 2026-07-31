/**
 * koi 框架聚合入口
 *
 * 业务应用按需从 @repo/theme/koi/framework 引入：
 *   - installKoi / default     安装器（ElementPlus / pinia / i18n / 组件 / 指令）
 *   - koiRouter                koi 自带路由（登录 / 布局 / 静态 + 错误页）
 *   - KoiLayout                布局根组件（layouts/index.vue）
 *   - loginView                登录页组件
 *   - stores                   pinia 仓库（user / auth / tabs / keepAlive / global）
 *   - useKoi*                  组合式工具
 *
 * 注意：仅 token 主题请用 @repo/theme/koi；本入口按需懒加载，勿被主题注册表静态引用，
 * 以免将 element-plus / router / axios 等整套框架拉入主题主包。
 */
export { default as installKoi, default } from "./install";
export type { InstallKoiOptions } from "./install";

export { default as koiRouter } from "./routers/index";
export { resetRouter, failFetchModule } from "./routers/index";
export { initDynamicRouter, forceRelogin } from "./routers/modules/dynamicRouter";
export {
  layoutRouter,
  staticRouter,
  errorRouter,
} from "./routers/modules/staticRouter";

export { default as KoiLayout } from "./layouts/index.vue";
export { default as loginView } from "./views/login/index.vue";

export { default as useGlobalStore } from "./stores/modules/global";
export { default as useUserStore } from "./stores/modules/user";
export { default as useAuthStore } from "./stores/modules/auth";
export { default as useTabsStore } from "./stores/modules/tabs";
export { default as useKeepAliveStore } from "./stores/modules/keepAlive";
export { default as koiPinia } from "./stores/index";

export { default as koiI18n } from "./languages/index";
export { default as koiSettings } from "./settings";
export {
  HOME_URL,
  LOGIN_URL,
  ROUTER_WHITE_LIST,
  CACHE_PREFIX,
  SVG_PREFIX,
} from "./config/index";

export { useTheme } from "./utils/theme";
export { useScreenStore } from "./hooks/screen/index";
export { default as koi } from "./utils/axios";
export { getEnv } from "./utils/env";

export { default as KoiComponents } from "./components/index";
export { default as KoiDirectives } from "./directives/index";

export type { KoiScrollNavHandle } from "./layouts/components/Tabs/useLayoutTabs";

export * from "./utils/filterRoute";
export * from "./utils/storage";
export * from "./utils/koi";
