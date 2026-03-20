/**
<<<<<<< HEAD
 * 应用启动器 - 统一的应用初始化注册器
 * 提供链式调用 API，灵活注册各种核心功能；
 * 同时包含 createStandardApp 完整实现（原 standard-app.ts 已合并至此）。
 */

import type { App, Directive, DirectiveBinding } from "vue";
=======
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
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
import type { Router } from "vue-router";
import type { SocketServiceConfig } from "./config/socketService";

// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────

<<<<<<< HEAD
export interface BootstrapOptions {
  app: App;
  router?: Router;
  config?: any;
}

/**
 * 字体加密全局配置（与 vFontEncryption 指令参数对齐）
 */
export interface FontEncryptionOptions {
  /** 是否启用加密字体，默认 true */
  enabled?: boolean;
  /** 是否禁用复制，默认 false */
  disableCopy?: boolean;
  /** OCR 噪点配置，默认 false */
  ocrNoise?: boolean | { level?: "low" | "medium" | "high" };
}

/**
 * WASM 启用模式
 * - 'WASM'：强制使用 WASM（不支持时降级）
 * - 'JS'：禁用 WASM，仅使用 JS 实现
 * - 'AUTO'：自动检测浏览器是否支持 WebAssembly，不支持则跳过
 * - true：等同于 'WASM'
 * - false：等同于 'JS'
 */
export type WasmMode = boolean | "WASM" | "JS" | "AUTO";

/**
 * 标准应用配置选项
 */
export interface StandardAppOptions {
  // ── 基础功能开关 ──────────────────────────────────────────
  /** WASM 启用模式，默认 'AUTO'（自动检测浏览器支持） */
  enableWasm?: WasmMode;
  /** 是否注册 VueTippy，默认 true */
  enableTippy?: boolean;
  /** 是否注册 ElementPlusX，默认 false */
  enableElementPlusX?: boolean;
  /** 是否启用 MotionPlugin，默认 true */
  enableMotion?: boolean;
  /** 是否注册 @pureadmin/table，默认 true */
  enableTable?: boolean;
  /** 是否启用 i18n，默认 true */
  enableI18n?: boolean;
  /**
   * 字体加密指令配置，默认 true（仅启用加密字体）。
   * 传入对象可细分控制：enabled / disableCopy / ocrNoise
   */
  enableFontEncryption?: boolean | FontEncryptionOptions;
  /** 是否启用主题系统（autoRegisterThemePlugins + initThemeSystem），默认 true */
  enableTheme?: boolean;
  /** 是否注册核心指令（v-auth/v-ripple/v-menu 等），默认 true */
  enableCoreDirectives?: boolean;

  // ── 扩展配置 ──────────────────────────────────────────────
  /** 自定义组件 */
  components?: Record<string, any>;
  /** 自定义指令（会与核心指令合并，同名时覆盖核心指令） */
  directives?: Record<string, Directive>;
  /** 自定义插件 */
  plugins?: any[];
  /** Socket 相关 Vue 插件（如 GlobalSocketPlugin），会在路由就绪后自动注册 */
  socketPlugins?: any[];
  /** Socket 路由钩子（如 setupFullscreenSocket），会在路由就绪后自动调用 */
  socketSetup?: (router: Router) => void;
  /**
   * 全局 Socket 服务配置，传入则自动调用 initGlobalSocketService 初始化。
   * 不传则不启用全局 socket 服务。
   */
  socket?: SocketServiceConfig;
  /** 覆盖内置 @repo/core router，使用应用自定义路由 */
  router?: Router;
  /** 自定义初始化函数 */
  setup?: (app: App, config?: any) => void | Promise<void>;
}
=======
// ─── AppBootstrap ────────────────────────────────────────────────────────────
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126

// ─────────────────────────────────────────────
// AppBootstrap 类
// ─────────────────────────────────────────────

export class AppBootstrap {
  private app: App;
  private router?: Router;
  private config?: any;
  private initPromises: Promise<any>[] = [];

  constructor(app: App) {
    this.app = app;
  }

<<<<<<< HEAD
  registerCoreStyles(): this {
    return this;
  }

=======
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
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
<<<<<<< HEAD
      if (existing && existing === component) return;
=======
      if (existing) return; // already registered, don't overwrite
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
      this.app.component(key, component);
    });
    return this;
  }

  registerComponent(name: string, component: any): this {
    const existing = this.app.component(name);
<<<<<<< HEAD
    if (existing && existing === component) return this;
=======
    if (existing) return this; // already registered, don't overwrite
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
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

<<<<<<< HEAD
  registerIconify(components?: Record<string, any>): this {
    if (!components) return this;
    Object.keys(components).forEach((key) => {
      this.app.component(key, components[key]);
    });
    return this;
  }

=======
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
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

<<<<<<< HEAD
  async registerConfig(config: any | (() => Promise<any>)): Promise<this> {
    try {
      this.config = typeof config === "function" ? await config() : config;
    } catch (error) {
      console.error("[AppBootstrap] 配置加载失败:", error);
    }
    return this;
  }

  async registerWasm(initWasm: () => Promise<void>): Promise<this> {
    try {
      await initWasm();
    } catch (error) {
      console.warn("[AppBootstrap] WASM 模块加载失败:", error);
    }
    return this;
  }

=======
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  use(fn: (app: App, config?: any) => void | Promise<void>): this {
    this.initPromises.push(Promise.resolve(fn(this.app, this.config)));
    return this;
  }

  async useAsync(fn: (app: App, config?: any) => Promise<void>): Promise<this> {
    await fn(this.app, this.config);
    return this;
  }

<<<<<<< HEAD
  getApp(): App { return this.app; }
  getRouter(): Router | undefined { return this.router; }
  getConfig(): any { return this.config; }

=======
  getApp(): App {
    return this.app;
  }

  getRouter(): Router | undefined {
    return this.router;
  }

  getConfig(): any {
    return this.config;
  }

>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
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

<<<<<<< HEAD
// ─────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────

export function createAppBootstrap(app: App): AppBootstrap {
  return new AppBootstrap(app);
}

export async function quickBootstrap(
  app: App,
  options: {
    router?: Router;
    directives?: Record<string, Directive>;
    components?: Record<string, any>;
    plugins?: any[];
    setupStore?: (app: App) => void;
    config?: any;
  },
): Promise<void> {
  const bootstrap = createAppBootstrap(app);
  if (options.directives) bootstrap.registerDirectives(options.directives);
  if (options.components) bootstrap.registerGlobalComponents(options.components);
  if (options.setupStore) bootstrap.registerStore(options.setupStore);
  if (options.router) bootstrap.registerRouter(options.router);
  if (options.plugins) bootstrap.registerPlugins(options.plugins);
  await bootstrap.mount("#app");
}

// ─────────────────────────────────────────────
// createStandardApp（原 standard-app.ts）
// ─────────────────────────────────────────────

/** 解析 WasmMode，返回是否应该加载 WASM */
function resolveWasmEnabled(mode: WasmMode): boolean {
  if (mode === "JS" || mode === false) return false;
  if (mode === "AUTO") return typeof WebAssembly !== "undefined";
  return true; // 'WASM' | true
}

=======
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

>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
export async function createStandardApp(
  options: StandardAppOptions = {},
): Promise<AppBootstrap> {
  const {
    enableWasm = "AUTO",
    enableTippy = true,
    enableElementPlusX = false,
<<<<<<< HEAD
    enableMotion = true,
    enableTable = true,
    enableI18n = true,
    enableFontEncryption = true,
    enableTheme = true,
    enableCoreDirectives = true,
=======
    enableWasm = true,
    fontEncryption,
    enableFullscreenSocket = false,
    router: customRouter,
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
    components = {},
    directives = {},
    plugins = [],
    socketPlugins = [],
    socketSetup,
    socket,
    router: customRouter,
    setup,
  } = options;

<<<<<<< HEAD
  // 1. 异步初始化 WASM（不阻塞 app 启动，后台加载）
  if (resolveWasmEnabled(enableWasm)) {
    import("@repo/codec-wasm")
      .then(({ initializeWasmModule }) => initializeWasmModule())
      .catch((error) => console.warn("[createStandardApp] WASM 模块加载失败:", error));
  }

  // 2. 导入必要依赖
  const { createApp } = await import("vue");
  // @ts-ignore - app-root 无类型声明
=======
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
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  const AppRoot = (await import("@repo/app-root")).default;
  const { getPlatformConfig, injectResponsiveStorage, useI18n } = await import("@repo/config");
  const { router, setupStore, menu, Ripple } = await import("@repo/core");
  const { useElementPlus } = await import("@repo/plugins");
  const { MotionPlugin } = await import("@vueuse/motion");
  const Table = (await import("@pureadmin/table")).default;
<<<<<<< HEAD
  const { FontIcon, IconifyIconOffline, IconifyIconOnline } = await import("@repo/components/ReIcon");
  const { Auth } = await import("@repo/components/ReAuth");
  const {
    ScTable, ScTableColumn, ScButton, ScSelect, ScSwitch,
    ScText, ScDrawer, ScDialog, ScTooltip,
=======
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
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  } = await import("@repo/components");

  // 3. 创建应用实例
  const app = createApp(AppRoot);

  // 4. 获取平台配置
  const config = await getPlatformConfig(app);

<<<<<<< HEAD
  // 4.1 初始化加载动画样式
  try {
    const loaderStyleFromConfig = config?.LoadingPageStyle;
    if (loaderStyleFromConfig && !localStorage.getItem("sys-loader-style")) {
=======
  // 根据全局配置初始化加载动画样式
  try {
    const loaderStyleFromConfig = config?.LoadingPageStyle;
    const _localStorage = typeof globalThis !== "undefined" && (globalThis as any).localStorage
      ? (globalThis as any).localStorage : null;
    if (loaderStyleFromConfig && _localStorage && !_localStorage.getItem("sys-loader-style")) {
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
      const mapping: Record<string, string> = {
        spinner: "simple", clock: "default", pixel: "dinoGame",
        cube: "blocks", dots: "default", pulse: "pulse",
        minimal: "simple", space: "rings", servererror: "book",
      };
<<<<<<< HEAD
      localStorage.setItem("sys-loader-style", mapping[String(loaderStyleFromConfig)] || "default");
=======
      _localStorage.setItem("sys-loader-style", mapping[String(loaderStyleFromConfig)] || "default");
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
    }
  } catch (error) {
    console.warn("[createStandardApp] 初始化加载动画样式失败:", error);
  }

<<<<<<< HEAD
  // 5. 创建 bootstrap
  const bootstrap = new AppBootstrap(app);

  // 5.1 注册核心指令
  if (enableCoreDirectives) {
    const coreDir = await import("./directives");
    const builtinDirectives: Record<string, Directive> = {
      auth: coreDir.auth,
      auths: coreDir.auths,
      "auths-all": coreDir.authsAll,
      copy: coreDir.copy,
      longpress: coreDir.longpress,
      optimize: coreDir.optimize,
      ripple: Ripple,
      admin: coreDir.admin,
      role: coreDir.role,
      roles: coreDir.roles,
      screenfull: coreDir.fullscreen,
      menu,
      ...directives,
    };
    bootstrap.registerDirectives(builtinDirectives);
  } else if (Object.keys(directives).length > 0) {
    bootstrap.registerDirectives(directives);
  }

  // 5.2 字体加密指令
  if (enableFontEncryption !== false) {
    const { vFontEncryption } = await import("@layout/default");
    if (typeof enableFontEncryption === "object") {
      const globalFeCfg = enableFontEncryption;
      const objDir = vFontEncryption as import("vue").ObjectDirective;
      const wrappedDirective: Directive = {
        mounted(el, binding: DirectiveBinding) {
          const merged = binding.value == null
            ? globalFeCfg
            : typeof binding.value === "boolean"
              ? { ...globalFeCfg, enabled: binding.value }
              : { ...globalFeCfg, ...binding.value };
          objDir.mounted?.(el, { ...binding, value: merged }, null as any, null as any);
        },
        updated(el, binding: DirectiveBinding) {
          const merged = binding.value == null
            ? globalFeCfg
            : typeof binding.value === "boolean"
              ? { ...globalFeCfg, enabled: binding.value }
              : { ...globalFeCfg, ...binding.value };
          objDir.updated?.(el, { ...binding, value: merged }, null as any, null as any);
        },
        unmounted: objDir.unmounted,
      };
      bootstrap.registerDirective("font-encryption", wrappedDirective);
    } else {
      bootstrap.registerDirective("font-encryption", vFontEncryption);
    }
  }

  // 5.3 注册核心组件
=======
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
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  bootstrap
    .registerComponent("IconifyIconOffline", IconifyIconOffline)
    .registerComponent("IconifyIconOnline", IconifyIconOnline)
    .registerComponent("FontIcon", FontIcon)
<<<<<<< HEAD
    .registerComponent("Auth", Auth)
    .registerComponent("ScTable", ScTable)
    .registerComponent("ScTableColumn", ScTableColumn)
=======
    .registerComponent("Auth", Auth);

  // 所有 Sc 组件
  bootstrap
    .registerComponent("ScTable", ScTable)
    .registerComponent("ScTableColumn", ScTableColumn)
    .registerComponent("ScCard", ScCard)
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
    .registerComponent("ScButton", ScButton)
    .registerComponent("ScSelect", ScSelect)
    .registerComponent("ScSwitch", ScSwitch)
    .registerComponent("ScDrawer", ScDrawer)
    .registerComponent("ScDialog", ScDialog)
    .registerComponent("ScTooltip", ScTooltip)
<<<<<<< HEAD
    .registerComponent("ScText", ScText);

=======
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
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  if (Object.keys(components).length > 0) {
    bootstrap.registerGlobalComponents(components);
  }

<<<<<<< HEAD
  // 5.4 注册第三方插件
  if (enableTippy) {
    const VueTippy = (await import("vue-tippy")).default;
    bootstrap.use(() => { void app.use(VueTippy); });
  }
  if (enableElementPlusX) {
    const ElementPlusX = (await import("vue-element-plus-x")).default;
    bootstrap.use(() => { void app.use(ElementPlusX); });
  }

  // 5.5 注册核心功能
  const activeRouter = customRouter ?? router;
  const corePlugins: any[] = [];
  if (enableMotion) corePlugins.push(MotionPlugin);
  if (enableI18n) corePlugins.push(useI18n);
  corePlugins.push(useElementPlus);
  if (enableTable) corePlugins.push(Table);

=======
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
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
  bootstrap
    .registerStore(setupStore)
    .registerRouter(activeRouter)
    .use(() => injectResponsiveStorage(app, config))
    .registerPlugins([...corePlugins, ...plugins, ...socketPlugins])
    .registerEncryptedFonts();

<<<<<<< HEAD
  // 5.6 全局 Socket 服务初始化
  if (socket) {
    bootstrap.use(async () => {
      try {
        const { initGlobalSocketService } = await import("./config/socketService");
        initGlobalSocketService(socket);
      } catch (error) {
        console.warn("[createStandardApp] 全局 Socket 服务初始化失败:", error);
=======
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
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
      }
    });
  }

  // 5.7 socketSetup 路由钩子
  if (socketSetup) {
    bootstrap.use(() => socketSetup(activeRouter));
  }

  // 5.8 主题系统
  if (enableTheme) {
    bootstrap.use(async () => {
      try {
        const { autoRegisterThemePlugins, initThemeSystem } = await import("@repo/components");
        await autoRegisterThemePlugins(app);
        await initThemeSystem();
      } catch (error) {
        console.warn("[createStandardApp] 主题系统初始化失败:", error);
      }
    });
  }

  // 5.9 设置全局属性和警告处理器（修复 __proxyIdCheat__ 警告）
  (app.config.globalProperties as any).__proxyIdCheat__ = 0;
  app.config.warnHandler = (msg, _instance, trace) => {
    if (typeof msg === "string") {
      if (msg.includes("__proxyIdCheat__") && msg.includes("was accessed during render but is not defined on instance")) return;
      if (msg.includes('Slot "default" invoked outside of the render function')) return;
      if (msg.includes("Runtime directive used on component with non-element root node")) return;
    }
    console.warn(msg, trace);
  };

  // 5.10 自定义初始化
  if (setup) {
    await bootstrap.useAsync(async (app) => { await setup(app, config); });
  }

  return bootstrap;
}
