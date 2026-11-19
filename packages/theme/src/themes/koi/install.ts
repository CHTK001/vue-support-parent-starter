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
 *   - 注册 ElementPlus 按需样式基线（反馈类命令式 API + koi 覆盖到的组件）与 v-loading 指令
 *   - 注册全部图标
 *   - 注册 koi 业务组件 / 指令
 *   - 注入 koi SVG sprite
 *   - provide 公共 App 需要的 UI 上下文（语言 / 尺寸），供 @repo/app 的 App.vue 读取
 *
 * ElementPlus 组件本体不再全量注册（app.use(ElementPlus) 已移除）：模板里的 <el-*>
 * 由 createVite 的 unplugin-vue-components + ElementPlusResolver 在编译期按需导入
 * （含组件样式）；locale 交给 @repo/app 的 el-config-provider 统一提供。
 */
import type { App } from "vue";
import { storeToRefs } from "pinia";
import type { Router } from "vue-router";
import { ElLoadingDirective } from "element-plus";
import "element-plus/theme-chalk/dark/css-vars.css";
// 反馈类命令式 API（ElMessage / ElMessageBox / ElNotification / ElLoading.service）不经
// 模板编译，unplugin-vue-components 无法注入其样式 → 必须显式引入（会级联带上 base 变量）。
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/notification/style/css";
import "element-plus/es/components/loading/style/css";
// koi 主题样式覆盖了下列组件的类名与局部变量（element.scss / index.scss / radius.scss /
// popover.scss / wallpaper.scss）。这些组件的按需样式若只被懒加载页面引用，其 CSS 会落在
// 懒加载 chunk，运行时插入 <head> 的顺序晚于本文件引入的 koi 覆盖层，同权重选择器会被
// EP 基线反超（主题色 / 圆角 / 表格等失效）。因此在入口先统一引入，固化
// 「EP 基线在前、koi 覆盖在后」的层叠顺序。
import "element-plus/es/components/container/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/card/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/empty/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/menu/style/css";
import "element-plus/es/components/pagination/style/css";
import "element-plus/es/components/popover/style/css";
import "element-plus/es/components/table/style/css";
import "element-plus/es/components/tooltip/style/css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "animate.css";
// koi 主题样式：覆盖 ElPlus CSS 变量（菜单/header/布局主题色等），必须在 element-plus 样式之后引入
import "./styles/index.scss";
import { setupCommonDirectives } from "@repo/core";
import { setupSvgSprite as setupKoiSvgSprite } from "@repo/assets";
import { AppUiContextKey } from "@repo/theme";
import useGlobalStore from "@repo/pinia/modules/global";
import { setRouter } from "@repo/core";
import { onConfigChange } from "@repo/config";
import { setDocumentTitle, setDocumentFavicon } from "@repo/theme/koi/layouts/useLayoutTitle";
// 布局使用 ReXxx（koi 主题实现），注册为全局组件
import { install as installReIcon } from "@repo/ui/re-icon";
import { install as installReScrollNav } from "@repo/ui/re-scroll-nav";
import { install as installReDrawer } from "@repo/ui/re-drawer";
import { install as installReDialog } from "@repo/ui/re-dialog";
import { installForcedLogin } from "./forcedLogin";

export interface InstallKoiOptions {
  /** 应用路由实例（由调用方创建，注入以配合业务路由） */
  router?: Router;
  /** 是否注册 ElementPlus 的 v-loading 指令（默认 true；组件本体已改为编译期按需解析） */
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
    // v-loading 是本仓唯一以指令形式使用的 EP 能力；unplugin-vue-components 不解析指令，
    // 必须在应用上显式注册（组件本体走编译期按需导入，locale 由 el-config-provider 提供）。
    app.directive("loading", ElLoadingDirective);
  }

  if (elementIcons) {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
  }

  // 注册布局使用的 ReXxx 组件（koi 主题实现），等待完成避免组件未注册
  await installUiComponents(app);

  // 强制登录兜底弹窗服务（核心 401/403 交互入口），注册到 window：
  // 核心 @repo/core 不依赖 @repo/ui（没有该依赖），通过 window.__reForcedLogin.show
  // 拉起 ReDialog + ReLoginForm 组合的强制登录弹窗。
  // 必须放在 ReDialog 注册为全局组件之后（弹窗内使用 ReDialog）
  installForcedLogin(app);

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

    // 配置热更（远程设置下发 / 环境级 app.yaml 覆盖）后应用名可能变化，
    // 标题后缀立刻重放一次当前路由；否则「标题只在导航时重写」会让后缀停在旧值，
    // 下一次跳转才纠正 —— 表现为同一次会话里标题前后不一致（见发布管理验收 D2）。
    // 订阅生命周期与 router 一致（koi 每个应用只安装一次），文档标题非关键资源，不额外解绑。
    onConfigChange(() => {
      const current = router.currentRoute.value;
      if (!current?.path) return;
      setDocumentTitle(
        current.path,
        current.meta?.title as string,
        current.meta?.activeMenu as string | undefined
      );
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
    installReDialog.install(app),
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
