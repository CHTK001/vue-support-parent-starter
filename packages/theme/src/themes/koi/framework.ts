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
import { registerThemeInstaller, registerThemeRoutes, registerThemeContext } from "@repo/theme";
import { installKoi } from "./install";
import type { AppContext } from "@repo/core";
import { createMenuRouteResolver } from "@repo/core";
import useGlobalStore from "@repo/pinia/modules/global";
import { registerMenuResolver, registerStaticMenu, getStaticMenu } from "@repo/pinia";
import KoiLayout from "./layouts/index.vue";
import LoginView from "./views/login/index.vue";
import HomeView from "./views/home/index.vue";
import MineView from "./views/mine/index.vue";
import Koi403Page from "./views/error/403.vue";
import Koi404Page from "./views/error/404.vue";
import Koi500Page from "./views/error/500.vue";

// 注册主题上下文（向 @repo/theme 主包注入 useGlobalStore，
// 使 useTheme() 不再静态依赖 @repo/pinia）
registerThemeContext({
  useGlobalStore: useGlobalStore as never,
});

// 注册主题安装器：context 为 core createApp 的 AppContext，路由取自 context.router
registerThemeInstaller("koi", async (app: App, context: unknown) => {
  // 默认菜单必须在安装器执行阶段兜底，不能在模块顶层注册：
  // 业务 main.ts 通常会先由 createVueApp 注册自己的静态菜单，提前写入“主控台”会覆盖业务菜单。
  if (!getStaticMenu().length) {
    registerStaticMenu([
      {
        path: "/",
        name: "layout",
        redirect: "/home",
        meta: { title: "menu.home.auth", icon: "koi-home", isVisible: "1" },
        children: [
          { path: "/home", name: "homePage", meta: { title: "menu.home.work.name", icon: "koi-work", isVisible: "1" } },
        ],
      },
    ]);
  }
  const { router } = (context ?? {}) as Partial<AppContext>;
  await installKoi(app, { router });
});

// 注册主题基础路由组件：core 按固定格式生成 /login、/、/home、/403、/404、/500 路由
registerThemeRoutes("koi", {
  layout: KoiLayout,
  login: LoginView,
  home: HomeView,
  mine: MineView,
  error: {
    forbidden: Koi403Page,
    notFound: Koi404Page,
    serverError: Koi500Page,
  },
});

// 注册菜单解析器（koi views glob + koi 布局注入，auth store 通用逻辑在 pinia）
registerMenuResolver(
  createMenuRouteResolver({
    viewModules: import.meta.glob("../views/**/*.vue") as Record<string, () => Promise<unknown>>,
    layoutComponent: KoiLayout,
    notFoundComponent: () => import("@repo/pages/error/404.vue"),
  }),
);

export { default as installKoi, default } from "./install";
export type { InstallKoiOptions } from "./install";

export { getRouter as koiRouter } from "@repo/core";
export { initAuthRouter as initDynamicRouter, forceRelogin, resetRouter } from "@repo/pinia";
export { getStaticMenu } from "@repo/pinia";

export { default as KoiLayout } from "./layouts/index.vue";
export { default as loginView } from "./views/login/index.vue";

export { default as useGlobalStore } from "@repo/pinia/modules/global";
export { default as useUserStore } from "@repo/pinia/modules/user";
export { default as useAuthStore } from "@repo/pinia/modules/auth";
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

export { useTheme } from "@repo/theme";
export { useScreenStore } from "@repo/utils";
export { getApiHttp as koi } from "@repo/core";
export { getEnv } from "@repo/env";


export { setupCommonDirectives } from "@repo/core";

export type { KoiScrollNavHandle } from "./layouts/components/Tabs/useLayoutTabs";


export { msg, msgSuccess, msgError, msgWarning, msgInfo, msgPrimary, notice, noticeSuccess, noticeError, noticeWarning, noticeInfo, msgBox, msgBoxPrompt, msgBoxAlert } from "@repo/core";
