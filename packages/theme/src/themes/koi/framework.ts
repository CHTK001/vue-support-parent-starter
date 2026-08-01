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
 *
 * 本模块顶层会向 @repo/theme 注册「koi → installKoi」安装器，
 * 由 @repo/app createApp 根据 getConfig().other.themeId 自动调用，应用无需手动传递。
 */
import type { App } from "vue";
import { registerThemeInstaller, registerThemeRoutes } from "@repo/theme";
import { installKoi } from "./install";
import type { AppContext } from "@repo/core";
import KoiLayout from "./layouts/index.vue";
import LoginView from "./views/login/index.vue";
import HomeView from "./views/home/index.vue";

// 注册主题安装器：context 为 core createApp 的 AppContext，路由取自 context.router
registerThemeInstaller("koi", (app: App, context: unknown) => {
  const { router } = (context ?? {}) as Partial<AppContext>;
  installKoi(app, { router });
});

// 注册主题基础路由组件：core 按固定格式生成 /login、/、/home 路由
registerThemeRoutes("koi", {
  layout: KoiLayout,
  login: LoginView,
  home: HomeView,
});

export { default as installKoi, default } from "./install";
export type { InstallKoiOptions } from "./install";

export { getRouter as koiRouter } from "@repo/core";
export { initDynamicRouter, forceRelogin, resetRouter } from "./routers/modules/dynamicRouter";
export { staticRouter as staticMenu } from "./config/menus";

export { default as KoiLayout } from "./layouts/index.vue";
export { default as loginView } from "./views/login/index.vue";

export { default as useGlobalStore } from "@repo/pinia/modules/global";
export { default as useUserStore } from "@repo/pinia/modules/user";
export { default as useAuthStore } from "./stores/modules/auth";
export { default as useTabsStore } from "@repo/pinia/modules/tabs";
export { default as useKeepAliveStore } from "@repo/pinia/modules/keepAlive";
export { default as koiPinia } from "@repo/pinia";

export { default as koiI18n } from "@repo/languages";
export { default as koiSettings } from "./settings";
export {
  HOME_URL,
  LOGIN_URL,
  ROUTER_WHITE_LIST,
  CACHE_PREFIX,
  SVG_PREFIX,
} from "@repo/config";

export { useTheme } from "./utils/theme";
export { useScreenStore } from "./hooks/screen/index";
export { default as koi } from "./utils/axios";
export { getEnv } from "@repo/env";


export { default as KoiDirectives } from "./directives/index";

export type { KoiScrollNavHandle } from "./layouts/components/Tabs/useLayoutTabs";

export * from "./utils/storage";
export { msg, msgSuccess, msgError, msgWarning, msgInfo, msgPrimary, notice, noticeSuccess, noticeError, noticeWarning, noticeInfo, msgBox, msgBoxPrompt, msgBoxAlert } from "@repo/core";
