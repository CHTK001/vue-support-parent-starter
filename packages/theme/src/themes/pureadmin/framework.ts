/**
 * PureAdmin 框架聚合入口
 *
 * 业务应用按需从 @repo/theme/pureadmin/framework 引入。
 *
 * 本模块顶层会向 @repo/theme 注册「pureadmin → installPureadmin」安装器，
 * 由 @repo/app createApp 根据 getConfig().other.themeId 自动调用。
 */
import type { App } from "vue";
import { registerThemeInstaller, registerThemeRoutes, registerThemeContext } from "@repo/theme";
import { installPureadmin } from "./install";
import type { AppContext } from "@repo/core";
import useGlobalStore from "@repo/pinia/modules/global";
import KoiLayout from "../koi/layouts/index.vue";
import LoginView from "./views/login/index.vue";
import HomeView from "./views/home/index.vue";
import Pureadmin403Page from "./views/error/403.vue";
import Pureadmin404Page from "./views/error/404.vue";
import Pureadmin500Page from "./views/error/500.vue";

// 注册主题上下文 (向 @repo/theme 主包注入 useGlobalStore)
registerThemeContext({
  useGlobalStore: useGlobalStore as never,
});

// 注册主题安装器
registerThemeInstaller("pureadmin", async (app: App, context: unknown) => {
  const { router } = (context ?? {}) as Partial<AppContext>;
  await installPureadmin(app, { router });
});

// 注册主题基础路由组件
registerThemeRoutes("pureadmin", {
  layout: KoiLayout, // 复用 koi 的布局
  login: LoginView,
  home: HomeView,
  error: {
    forbidden: Pureadmin403Page,
    notFound: Pureadmin404Page,
    serverError: Pureadmin500Page,
  },
});

export { default as installPureadmin, default } from "./install";
export type { InstallPureadminOptions } from "./install";

export { default as PureadminLayout } from "../koi/layouts/index.vue";
export { default as loginView } from "./views/login/index.vue";

export { pureadminTheme } from ".";
