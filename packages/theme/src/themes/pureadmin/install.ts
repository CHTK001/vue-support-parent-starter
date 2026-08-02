/**
 * PureAdmin 框架安装器 —— 把 PureAdmin 的整体能力注册到应用
 */
import type { App } from "vue";
import { storeToRefs } from "pinia";
import type { Router } from "vue-router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
// pureadmin 主题样式：覆盖 ElPlus CSS 变量
import "./styles/index.scss";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite as setupPureadminSvgSprite } from "@repo/assets";
import { AppUiContextKey } from "@repo/theme";
import useGlobalStore from "@repo/pinia/modules/global";
import { setRouter } from "@repo/core";
// 布局使用 ReXxx(pureadmin 主题实现),注册为全局组件
import { install as installReIcon } from "@repo/ui/re-icon";
import { install as installReScrollNav } from "@repo/ui/re-scroll-nav";
import { install as installReDrawer } from "@repo/ui/re-drawer";

export interface InstallPureadminOptions {
  router?: Router;
  elementPlus?: boolean;
  elementIcons?: boolean;
}

export async function installPureadmin(app: App, options: InstallPureadminOptions = {}): Promise<App> {
  const { router, elementPlus = true, elementIcons = true } = options;

  // pureadmin 图标依赖全局 SVG sprite，先注入
  setupPureadminSvgSprite();

  if (elementPlus) {
    app.use(ElementPlus);
  }

  if (elementIcons) {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
  }

  // 注册布局使用的 ReXxx 组件
  await installUiComponents(app);

  setupCommonDirectives(app);

  if (router) {
    setRouter(router);
    app.use(router);
  }

  // provide 公共 UI 上下文
  provideAppUiContextWithStore(app);

  return app;
}

async function installUiComponents(app: App): Promise<void> {
  await Promise.allSettled([
    installReIcon.install(app),
    installReScrollNav.install(app),
    installReDrawer.install(app),
  ]);
}

function provideAppUiContextWithStore(app: App): void {
  const globalStore = useGlobalStore();
  const { language, dimension } = storeToRefs(globalStore);
  app.provide(AppUiContextKey, { language, dimension });
}

export default installPureadmin;
