/**
 * koi 框架安装器 —— 把 koi 的整体能力注册到应用
 *
 * 用法（与 @repo/app 配合，统一由 @repo/app 注册 pinia / i18n / router）：
 *   import { mountApp } from "@repo/app";
 *   import { installKoi } from "@repo/theme/koi/framework";
 *
 *   mountApp({
 *     appName: "xxx",
 *     install: (app, ctx) => installKoi(app, { router: ctx.router }),
 *   });
 *
 * 本安装器职责：
 *   - 注册 ElementPlus + 全部图标
 *   - 注册 koi 业务组件 / 指令
 *   - 注入 koi SVG sprite
 *   - provide 公共 App 需要的 UI 上下文（语言 / 尺寸），供 @repo/app 的 App.vue 读取
 */
import type { App } from "vue";
import { storeToRefs } from "pinia";
import type { Router } from "vue-router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "animate.css";
// koi 主题样式：覆盖 ElPlus CSS 变量（菜单/header/布局主题色等），必须在 element-plus 样式之后引入
import "./styles/index.scss";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite as setupKoiSvgSprite } from "@repo/assets";
import { AppUiContextKey } from "@repo/theme";
import useGlobalStore from "@repo/pinia/modules/global";
import { setRouter } from "@repo/core";
import { setDocumentTitle, setDocumentFavicon } from "@repo/theme/koi/layouts/useLayoutTitle";
// 布局使用 ReXxx（koi 主题实现），注册为全局组件
import { install as installReIcon } from "@repo/ui/re-icon";
import { install as installReScrollNav } from "@repo/ui/re-scroll-nav";
import { install as installReDrawer } from "@repo/ui/re-drawer";

export interface InstallKoiOptions {
  /** 应用路由实例（由调用方创建，注入以配合业务路由） */
  router?: Router;
  /** 是否自动注册 ElementPlus（默认 true） */
  elementPlus?: boolean;
  /** 是否注册 ElementPlus 全部图标为全局组件（默认 true） */
  elementIcons?: boolean;
}

export async function installKoi(app: App, options: InstallKoiOptions = {}): Promise<App> {
  const { router, elementPlus = true, elementIcons = true } = options;

  // koi 图标（#icon-koi-*）依赖全局 SVG sprite。在 SSR / 依赖预构建阶段
  // document.body 可能不存在 → 注入空 sprite + 置 injected=true，
  // 导致所有 #icon-koi-* 引用失效。由 createVueApp 的 mount 钩子在 app.mount() 后
  // 再补一次兜底（见 packages/assets/src/svgSprite.ts 中 injected=true 的幂等保护）。
  // 框架侧保持原样，业务 main.ts 请务必在 mount 后调用一次 setupSvgSprite。

  if (elementPlus) {
    app.use(ElementPlus, { locale: zhCn });
  }

  if (elementIcons) {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
  }

  // 注册布局使用的 ReXxx 组件（koi 主题实现），等待完成避免组件未注册
  await installUiComponents(app);

  setupCommonDirectives(app);

  if (router) {
    // 注意：router 已由 @repo/app createContextApp 内部 vueApp.use(router) 注册，
    // 这里只做「注入守卫」需要的 setRouter，不再重复 app.use，避免 "Plugin has already been applied" 告警
    setRouter(router);
    // 在 core 守卫 beforeEach 之后运行，覆盖其原始 meta.title（如占位 "home"），
    // 用菜单树翻译标题提前设置 document.title，避免页面渲染后才修正导致闪烁
    router.beforeEach((to) => {
      setDocumentTitle(to.path, to.meta?.title as string, to.meta?.activeMenu as string | undefined);
      // 同步浏览器标签页图标（跟随 app.yaml loginConfig.logoUrl）
      setDocumentFavicon();
    });
  }

  // 公共 App.vue 依赖的 UI 上下文：语言 / 尺寸来自 koi globalStore
  provideAppUiContextWithStore(app);

  return app;
}

/** 异步注册 ReXxx 主题化组件（避免阻塞 installKoi 同步流程） */
async function installUiComponents(app: App): Promise<void> {
  await Promise.allSettled([
    installReIcon.install(app),
    installReScrollNav.install(app),
    installReDrawer.install(app),
  ]);
}

/**
 * 把 koi globalStore 的语言 / 尺寸（响应式 ref）注入公共 App。
 * 注意：必须在 app.use(pinia) 之后调用（@repo/app createApp 已注册 pinia）。
 */
function provideAppUiContextWithStore(app: App): void {
  const globalStore = useGlobalStore();
  const { language, dimension } = storeToRefs(globalStore);
  app.provide(AppUiContextKey, { language, dimension });
}

export default installKoi;
