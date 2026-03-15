/**
 * 应用启动器
 * - AppBootstrap: 通用注册器，提供链式 API
 * - createStandardApp: 预设工厂，自动注册项目所需的全部依赖
 */

// 公共样式（所有标准应用共享）
import "element-plus/dist/index.css";
import "@repo/assets/fonts/iconfont.css";
import "@layout/default/styles/layout/index.scss";
import "@layout/default/styles/layout/reset.scss";
import "@layout/default/styles/layout/tailwind.css";
import "@layout/default/styles/font-encryption.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import type { App, Directive } from "vue";
import type { Router } from "vue-router";

// ─── AppBootstrap ────────────────────────────────────────────────────────────

export class AppBootstrap {
  private app: App;
  private router?: Router;
  private config?: any;
  private initPromises: Promise<any>[] = [];

  constructor(app: App) {
    this.app = app;
  }

  registerDirectives(directives?: Record<string, Directive>): this {
    if (!directives) return this;
    Object.keys(directives).forEach((key) => {
      this.app.directive(key, directives[key]);
    });
    return this;
  }

  registerDirective(name: string, directive: Directive): this {
    const existing = this.app.directive(name);
    if (existing && existing === directive) return this;
    this.app.directive(name, directive);
    return this;
  }

  registerGlobalComponents(components?: Record<string, any>): this {
    if (!components) return this;
    Object.keys(components).forEach((key) => {
      const component = components[key];
      const existing = this.app.component(key);
      if (existing && existing === component) return;
      this.app.component(key, component);
    });
    return this;
  }

  registerComponent(name: string, component: any): this {
    const existing = this.app.component(name);
    if (existing && existing === component) return this;
    this.app.component(name, component);
    return this;
  }

  registerEncryptedFonts(): this {
    const promise = (async () => {
      try {
        const { registerEncryptedFonts } = await import("@repo/font-encryption");
        await registerEncryptedFonts();
      } catch (error) {
        console.warn("[AppBootstrap] 字体加密模块加载失败:", error);
      }
    })();
    this.initPromises.push(promise);
    return this;
  }

  registerRouter(router: Router): this {
    this.router = router;
    this.app.use(router);
    this.initPromises.push(router.isReady());
    return this;
  }

  registerPlugins(plugins?: any[] | (() => Promise<any[]>)): this {
    if (!plugins) return this;
    const promise = (async () => {
      try {
        const pluginList = typeof plugins === "function" ? await plugins() : plugins;
        for (const plugin of pluginList) {
          if (plugin) this.app.use(plugin);
        }
      } catch (error) {
        console.error("[AppBootstrap] 插件注册失败:", error);
      }
    })();
    this.initPromises.push(promise);
    return this;
  }

  registerStore(setupStore: (app: App) => void): this {
    setupStore(this.app);
    return this;
  }

  use(fn: (app: App, config?: any) => void | Promise<void>): this {
    this.initPromises.push(Promise.resolve(fn(this.app, this.config)));
    return this;
  }

  async useAsync(fn: (app: App, config?: any) => Promise<void>): Promise<this> {
    await fn(this.app, this.config);
    return this;
  }

  getApp(): App {
    return this.app;
  }

  getRouter(): Router | undefined {
    return this.router;
  }

  getConfig(): any {
    return this.config;
  }

  async mount(selector: string): Promise<void> {
    try {
      await Promise.all(this.initPromises);
      this.app.mount(selector);
      console.log("[AppBootstrap] 应用启动成功");
    } catch (error) {
      console.error("[AppBootstrap] 应用启动失败:", error);
      this.app.mount(selector);
    }
  }

  mountSync(selector: string): void {
    this.app.mount(selector);
  }
}

// ─── createStandardApp ───────────────────────────────────────────────────────

export interface FontEncryptionOptions {
  enabled: boolean;
  applyGlobal?: boolean;
  ocrNoise?: boolean | { level?: "low" | "medium" | "high" };
  selectors?: string[];
}

export interface StandardAppOptions {
  /** 是否注册 VueTippy */
  enableTippy?: boolean;
  /** 是否注册 ElementPlusX */
  enableElementPlusX?: boolean;
  /** 是否启用 WASM */
  enableWasm?: boolean;
  /** 字体加密配置，设置后自动初始化 */
  fontEncryption?: FontEncryptionOptions;
  /** 是否启用 fullScreen 路由自动连接 GlobalSocket（默认 false） */
  enableFullscreenSocket?: boolean;
  /** 自定义路由（不传则使用 @repo/core 默认路由） */
  router?: Router;
  /** 自定义组件 */
  components?: Record<string, any>;
  /** 自定义指令 */
  directives?: Record<string, Directive>;
  /** 自定义插件 */
  plugins?: any[];
  /** 自定义初始化函数 */
  setup?: (app: App, config?: any) => void | Promise<void>;
}

export async function createStandardApp(
  options: StandardAppOptions = {},
): Promise<AppBootstrap> {
  const {
    enableTippy = true,
    enableElementPlusX = false,
    enableWasm = true,
    fontEncryption,
    enableFullscreenSocket = false,
    router: customRouter,
    components = {},
    directives = {},
    plugins = [],
    setup,
  } = options;

  // 1. 初始化 WASM（必须第一个执行）
  if (enableWasm) {
    try {
      const { initializeWasmModule } = await import("@repo/codec-wasm");
      await initializeWasmModule();
    } catch (error) {
      console.warn("[createStandardApp] WASM 模块加载失败:", error);
    }
  }

  // 2. 导入依赖
  const { createApp } = await import("vue");
  // @ts-ignore - @repo/app-root exists at runtime
  const AppRoot = (await import("@repo/app-root")).default;
  const { getPlatformConfig, injectResponsiveStorage, useI18n } = await import("@repo/config");
  const { router, setupStore, menu, Ripple } = await import("@repo/core");
  const { useElementPlus } = await import("@repo/plugins");
  const { MotionPlugin } = await import("@vueuse/motion");
  const Table = (await import("@pureadmin/table")).default;
  const { auth, auths, authsAll, copy, longpress, optimize, admin, role, roles, fullscreen } = await import("@repo/core");
  const coreDirectives: Record<string, any> = { auth, auths, authsAll, copy, longpress, optimize, admin, role, roles, fullscreen };
  const { vFontEncryption } = await import("@layout/default");
  const { FontIcon, IconifyIconOffline, IconifyIconOnline } = await import("@repo/components/ReIcon");
  const { Auth } = await import("@repo/components/ReAuth");
  const {
    ScTable, ScTableColumn, ScCard,
    ScButton, ScSelect, ScSwitch, ScText,
    ScDrawer, ScDialog, ScTooltip,
    ScMenu, ScMenuItem, ScSubMenu,
    ScScrollbar, ScBreadcrumb,
    ScIcon, ScEmpty, ScPagination,
    ScBacktop, ScAside, ScMain,
    ScDropdown, ScDropdownMenu, ScDropdownItem,
    ScTag, ScBadge, ScAlert, ScLink,
    ScDivider, ScAvatar,
    ScInput, ScInputNumber, ScRate, ScColorPicker,
    ScRadio, ScRadioGroup,
    ScCheckbox, ScCheckboxGroup,
    ScTimePicker, ScDatePicker, ScCascader, ScAutocomplete,
    ScPopover, ScPopconfirm,
    ScForm, ScFormItem, ScRow, ScCol,
    ScTabs, ScTabPane,
    ScSteps, ScOption,
    ScSlider, ScProgress, ScRibbon,
    ScImage, ScNumber, ScDictSelect,
    ScPanel, ScContainer, ScFilterBar,
    ScMessageDialog, ScMessageComponent,
    ScRouteLoading, ScAnimationFrame, ScDebugConsole,
  } = await import("@repo/components");

  // 3. 创建应用实例
  const app = createApp(AppRoot);

  // 4. 获取平台配置
  const config = await getPlatformConfig(app);

  // 根据全局配置初始化加载动画样式
  try {
    const loaderStyleFromConfig = config?.LoadingPageStyle;
    const _localStorage = typeof globalThis !== "undefined" && (globalThis as any).localStorage
      ? (globalThis as any).localStorage : null;
    if (loaderStyleFromConfig && _localStorage && !_localStorage.getItem("sys-loader-style")) {
      const mapping: Record<string, string> = {
        spinner: "simple", clock: "default", pixel: "dinoGame",
        cube: "blocks", dots: "default", pulse: "pulse",
        minimal: "simple", space: "rings", servererror: "book",
      };
      _localStorage.setItem("sys-loader-style", mapping[String(loaderStyleFromConfig)] || "default");
    }
  } catch (error) {
    console.warn("[createStandardApp] 初始化加载动画样式失败:", error);
  }

  // 5. 创建 bootstrap 并注册所有功能
  const bootstrap = new AppBootstrap(app);

  // 指令
  bootstrap
    .registerDirectives(coreDirectives)
    .registerDirective("menu", menu)
    .registerDirective("ripple", Ripple)
    .registerDirective("font-encryption", vFontEncryption);

  if (Object.keys(directives).length > 0) {
    bootstrap.registerDirectives(directives);
  }

  // 核心组件
  bootstrap
    .registerComponent("IconifyIconOffline", IconifyIconOffline)
    .registerComponent("IconifyIconOnline", IconifyIconOnline)
    .registerComponent("FontIcon", FontIcon)
    .registerComponent("Auth", Auth);

  // 所有 Sc 组件
  bootstrap
    .registerComponent("ScTable", ScTable)
    .registerComponent("ScTableColumn", ScTableColumn)
    .registerComponent("ScCard", ScCard)
    .registerComponent("ScButton", ScButton)
    .registerComponent("ScSelect", ScSelect)
    .registerComponent("ScSwitch", ScSwitch)
    .registerComponent("ScDrawer", ScDrawer)
    .registerComponent("ScDialog", ScDialog)
    .registerComponent("ScTooltip", ScTooltip)
    .registerComponent("ScText", ScText)
    .registerComponent("ScMenu", ScMenu)
    .registerComponent("ScMenuItem", ScMenuItem)
    .registerComponent("ScSubMenu", ScSubMenu)
    .registerComponent("ScScrollbar", ScScrollbar)
    .registerComponent("ScBreadcrumb", ScBreadcrumb)
    .registerComponent("ScIcon", ScIcon)
    .registerComponent("ScEmpty", ScEmpty)
    .registerComponent("ScPagination", ScPagination)
    .registerComponent("ScBacktop", ScBacktop)
    .registerComponent("ScAside", ScAside)
    .registerComponent("ScMain", ScMain)
    .registerComponent("ScDropdown", ScDropdown)
    .registerComponent("ScDropdownMenu", ScDropdownMenu)
    .registerComponent("ScDropdownItem", ScDropdownItem)
    .registerComponent("ScTag", ScTag)
    .registerComponent("ScBadge", ScBadge)
    .registerComponent("ScAlert", ScAlert)
    .registerComponent("ScLink", ScLink)
    .registerComponent("ScDivider", ScDivider)
    .registerComponent("ScAvatar", ScAvatar)
    .registerComponent("ScInput", ScInput)
    .registerComponent("ScInputNumber", ScInputNumber)
    .registerComponent("ScRate", ScRate)
    .registerComponent("ScColorPicker", ScColorPicker)
    .registerComponent("ScRadio", ScRadio)
    .registerComponent("ScRadioGroup", ScRadioGroup)
    .registerComponent("ScCheckbox", ScCheckbox)
    .registerComponent("ScCheckboxGroup", ScCheckboxGroup)
    .registerComponent("ScTimePicker", ScTimePicker)
    .registerComponent("ScDatePicker", ScDatePicker)
    .registerComponent("ScCascader", ScCascader)
    .registerComponent("ScAutocomplete", ScAutocomplete)
    .registerComponent("ScPopover", ScPopover)
    .registerComponent("ScPopconfirm", ScPopconfirm)
    .registerComponent("ScForm", ScForm)
    .registerComponent("ScFormItem", ScFormItem)
    .registerComponent("ScRow", ScRow)
    .registerComponent("ScCol", ScCol)
    .registerComponent("ScTabs", ScTabs)
    .registerComponent("ScTabPane", ScTabPane)
    .registerComponent("ScSteps", ScSteps)
    .registerComponent("ScOption", ScOption)
    .registerComponent("ScSlider", ScSlider)
    .registerComponent("ScProgress", ScProgress)
    .registerComponent("ScRibbon", ScRibbon)
    .registerComponent("ScImage", ScImage)
    .registerComponent("ScNumber", ScNumber)
    .registerComponent("ScDictSelect", ScDictSelect)
    .registerComponent("ScPanel", ScPanel)
    .registerComponent("ScContainer", ScContainer)
    .registerComponent("ScFilterBar", ScFilterBar)
    .registerComponent("ScMessageDialog", ScMessageDialog)
    .registerComponent("ScMessageComponent", ScMessageComponent)
    .registerComponent("ScRouteLoading", ScRouteLoading)
    .registerComponent("ScAnimationFrame", ScAnimationFrame)
    .registerComponent("ScDebugConsole", ScDebugConsole);

  // 自定义组件
  if (Object.keys(components).length > 0) {
    bootstrap.registerGlobalComponents(components);
  }

  // 第三方插件
  if (enableTippy) {
    const VueTippy = (await import("vue-tippy")).default;
    bootstrap.use(() => { app.use(VueTippy); });
  }
  if (enableElementPlusX) {
    const ElementPlusX = (await import("vue-element-plus-x")).default;
    bootstrap.use(() => { app.use(ElementPlusX); });
  }

  // 核心功能
  const activeRouter = customRouter ?? router;
  bootstrap
    .registerStore(setupStore)
    .registerRouter(activeRouter)
    .use(() => injectResponsiveStorage(app, config))
    .registerPlugins([MotionPlugin, useI18n, useElementPlus, Table, ...plugins])
    .registerEncryptedFonts();

  // fullScreen socket
  if (enableFullscreenSocket) {
    bootstrap.use(async () => {
      const { getGlobalSocket } = await import("./global-socket");
      activeRouter.afterEach(async (to) => {
        if (to?.meta && (to.meta as any).fullScreen) {
          await getGlobalSocket().connect();
        }
      });
    });
  }

  // 主题系统
  bootstrap.use(async () => {
    try {
      const { autoRegisterThemePlugins, initThemeSystem } = await import("@repo/components");
      await autoRegisterThemePlugins(app);
      await initThemeSystem();
    } catch (error) {
      console.warn("[createStandardApp] 主题系统初始化失败:", error);
    }
  });

  // 字体加密
  if (fontEncryption?.enabled) {
    bootstrap.use(async () => {
      try {
        const { initFontEncryption } = await import("@layout/default");
        initFontEncryption({
          enabled: true,
          applyGlobal: fontEncryption.applyGlobal ?? true,
          ocrNoise: fontEncryption.ocrNoise,
          selectors: fontEncryption.selectors,
        });
      } catch (error) {
        console.warn("[createStandardApp] 字体加密初始化失败:", error);
      }
    });
  }

  // 自定义初始化
  if (setup) {
    (app.config.globalProperties as any).__proxyIdCheat__ = 0;
    app.config.warnHandler = (msg, _instance, trace) => {
      if (typeof msg === "string") {
        if (msg.includes("__proxyIdCheat__") && msg.includes("was accessed during render but is not defined on instance")) return;
        if (msg.includes('Slot "default" invoked outside of the render function')) return;
        if (msg.includes("Runtime directive used on component with non-element root node")) return;
      }
      console.warn(msg, trace);
    };
    await bootstrap.useAsync(async (app) => {
      await setup(app, config);
    });
  }

  return bootstrap;
}
