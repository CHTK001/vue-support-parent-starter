/**
 * 应用启动器 - 统一的应用初始化注册器
 * 提供链式调用 API，灵活注册各种核心功能；
 * 同时包含 createStandardApp 完整实现（原 standard-app.ts 已合并至此）。
 */

import type { App, Component, Directive, DirectiveBinding } from "vue";
import type { Router, RouteRecordRaw } from "vue-router";
import type { SocketServiceConfig } from "./config/socketService";
import { getLoaderStorageKey } from "@repo/components/ScRouteLoading/loader-manager";

let coreStylesPromise: Promise<void> | null = null;
let consoleWarnFilterInstalled = false;

function getCurrentHashPath(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.hash.replace(/^#/, "").split("?")[0];
}

function shouldIgnoreMissingRouteWarning(message: string): boolean {
  const missingRouteMatch = message.match(
    /\[Vue Router warn\]: No match found for location with path "([^"]+)"/,
  );
  if (!missingRouteMatch) {
    return false;
  }

  const missingPath = missingRouteMatch[1];
  if (missingPath === "/home" || missingPath === "/") {
    return true;
  }

  const currentHashPath = getCurrentHashPath();
  return (
    !!currentHashPath &&
    missingPath === currentHashPath &&
    missingPath.startsWith("/manage/")
  );
}

function installConsoleWarnFilter(): void {
  if (consoleWarnFilterInstalled || typeof window === "undefined") {
    return;
  }

  const rawConsoleWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      shouldIgnoreMissingRouteWarning(args[0])
    ) {
      return;
    }
    rawConsoleWarn(...args);
  };
  consoleWarnFilterInstalled = true;
}

function isBootDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    return (
      params.has("__bootDebug") ||
      window.localStorage?.getItem("sys-boot-debug") === "true"
    );
  } catch {
    return false;
  }
}

function bootDebugLog(message: string, detail?: unknown): void {
  if (!isBootDebugEnabled()) {
    return;
  }

  try {
    const payload = {
      message,
      detail,
      time: Date.now(),
    };
    const target = window as typeof window & {
      __APP_BOOT_TRACE__?: Array<typeof payload>;
      __APP_BOOT_LAST__?: typeof payload;
    };
    target.__APP_BOOT_TRACE__ = target.__APP_BOOT_TRACE__ || [];
    target.__APP_BOOT_TRACE__.push(payload);
    target.__APP_BOOT_LAST__ = payload;
  } catch {
    // ignore debug trace persistence failures
  }

  if (detail === undefined) {
    console.info(`[AppBootstrap] ${message}`);
    return;
  }

  console.info(`[AppBootstrap] ${message}`, detail);
}

// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────

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
  /** 是否注册 @pureadmin/table，默认 false */
  enableTable?: boolean;
  /** 是否注册 Sc* 系列组件（ScTable/ScButton/ScSelect 等），默认 true */
  enableScComponents?: boolean;
  /** 是否启用 i18n，默认 true */
  enableI18n?: boolean;
  /**
   * 字体加密指令配置，默认 true（仅启用加密字体）。
   * 传入对象可细分控制：enabled / disableCopy / ocrNoise
   */
  enableFontEncryption?: boolean | FontEncryptionOptions;
  /** 是否启用主题系统（autoRegisterThemePlugins + initThemeSystem），默认 true */
  enableTheme?: boolean;
  /**
   * 是否启用 TechUI。
   * - false: 不启用
   * - true: 使用默认配置启用
   * - object: 使用自定义配置启用
   */
  enableTech?: boolean | StandardAppTechOptions;
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
  /**
   * 路由配置：
   * - 传入 Router：覆盖内置 @repo/core router
   * - 传入 false：创建无路由应用
   */
  router?: Router | false;
  /**
   * 显式注册的应用路由模块。
   * 替代旧的 import.meta.glob 自动发现机制，应用需要显式导入并传递路由。
   */
  appRoutes?: RouteRecordRaw[];
  /**
   * 无路由模式下的首页组件。
   * 当 router=false 时必须提供，用于直接渲染主页面。
   */
  homeComponent?: Component;
  /** 自定义初始化函数 */
  setup?: (app: App, config?: any) => void | Promise<void>;
}

export interface StandardAppTechOptions {
  license?: string | null;
  features?: {
    echarts?: boolean;
    advanced?: boolean;
  };
  debug?: boolean;
}

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

  registerCoreStyles(standalone?: boolean): this {
    if (!standalone && coreStylesPromise) {
      this.initPromises.push(coreStylesPromise);
      return this;
    }

    const promise = (async () => {
      try {
        bootDebugLog("registerCoreStyles:start");
        const imports: Promise<any>[] = [
          import("element-plus/dist/index.css"),
          import("element-plus/theme-chalk/dark/css-vars.css"),
          import("tippy.js/dist/tippy.css"),
          import("tippy.js/themes/light.css"),
          import("@repo/assets/styles/base/index.scss"),
        ];
        if (!standalone) {
          imports.push(import("@repo/assets/styles/theme/index.scss"));
        }
        await Promise.all(imports);
        bootDebugLog("registerCoreStyles:done");
      } catch (error) {
        console.error("[AppBootstrap] 核心样式加载失败:", error);
      }
    })();

    if (!standalone) {
      coreStylesPromise = promise;
    }
    this.initPromises.push(promise);
    return this;
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
        bootDebugLog("registerEncryptedFonts:start");
        const { registerEncryptedFonts } =
          await import("@repo/font-encryption");
        await registerEncryptedFonts();
        bootDebugLog("registerEncryptedFonts:done");
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
    bootDebugLog("registerRouter:wait", router.currentRoute.value.fullPath);
    this.initPromises.push(
      router.isReady().then(() => {
        bootDebugLog(
          "registerRouter:ready",
          router.currentRoute.value.fullPath,
        );
      }),
    );
    return this;
  }

  registerIconify(components?: Record<string, any>): this {
    if (!components) return this;
    Object.keys(components).forEach((key) => {
      this.app.component(key, components[key]);
    });
    return this;
  }

  registerPlugins(plugins?: any[] | (() => Promise<any[]>)): this {
    if (!plugins) return this;
    const promise = (async () => {
      try {
        const pluginList =
          typeof plugins === "function" ? await plugins() : plugins;
        bootDebugLog("registerPlugins:start", pluginList?.length || 0);
        for (const plugin of pluginList) {
          if (plugin) this.app.use(plugin);
        }
        bootDebugLog("registerPlugins:done", pluginList?.length || 0);
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
      bootDebugLog("registerWasm:start");
      await initWasm();
      bootDebugLog("registerWasm:done");
    } catch (error) {
      console.warn("[AppBootstrap] WASM 模块加载失败:", error);
    }
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

  private hideInitialLoader(): void {
    if (typeof window === "undefined") return;

    const hide = () => {
      try {
        window.hideAppLoader?.();
        const appLoader = document.getElementById("app-loader");
        if (appLoader?.parentNode) {
          appLoader.parentNode.removeChild(appLoader);
        }
      } catch (error) {
        console.warn("[AppBootstrap] 隐藏首屏加载动画失败:", error);
      }
    };

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => window.requestAnimationFrame(hide));
      return;
    }

    window.setTimeout(hide, 0);
  }

  async mount(selector: string): Promise<void> {
    try {
      bootDebugLog("mount:await-initPromises", this.initPromises.length);
      await Promise.all(this.initPromises);
      bootDebugLog("mount:initPromises-resolved", selector);
      this.app.mount(selector);
      this.hideInitialLoader();
      bootDebugLog("mount:success", selector);
    } catch (error) {
      console.error("[AppBootstrap] 应用启动失败:", error);
      this.app.mount(selector);
      this.hideInitialLoader();
    }
  }

  mountSync(selector: string): void {
    this.app.mount(selector);
  }
}

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
  if (options.components)
    bootstrap.registerGlobalComponents(options.components);
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

function normalizeTechOptions(
  enableTech: StandardAppOptions["enableTech"],
): StandardAppTechOptions | null {
  if (!enableTech) {
    return null;
  }
  if (enableTech === true) {
    return {};
  }
  return enableTech;
}

export async function createStandardAppWithoutTech(
  options: StandardAppOptions = {},
): Promise<AppBootstrap> {
  bootDebugLog("createStandardAppWithoutTech:start");
  const {
    enableWasm = "AUTO",
    enableTippy = true,
    enableElementPlusX = false,
    enableMotion = true,
    enableTable = false,
    enableScComponents = true,
    enableI18n = true,
    enableFontEncryption = true,
    enableTheme = true,
    enableCoreDirectives = true,
    enableTech: _enableTech = false,
    components = {},
    directives = {},
    plugins = [],
    socketPlugins = [],
    socketSetup,
    socket,
    router: customRouter,
    homeComponent,
    appRoutes,
    setup,
  } = options;
  const useCustomRouter = Boolean(customRouter && customRouter !== false);
  const useHomeRouter =
    !useCustomRouter && customRouter !== false && Boolean(homeComponent);
  const useBuiltinRouter =
    !useCustomRouter && !useHomeRouter && customRouter !== false;
  const routerEnabled = useCustomRouter || useHomeRouter || useBuiltinRouter;

  // 1. 尽早启动 WASM 初始化，并在 mount 前确保完成
  const wasmInitPromise = resolveWasmEnabled(enableWasm)
    ? import("@repo/codec-wasm").then(async ({ initializeWasmModule }) => {
        bootDebugLog("createStandardAppWithoutTech:wasm-imported");
        const result = await initializeWasmModule();
        if (!result) {
          console.warn(
            "[SystemBootstrap] WASM 模块初始化失败，已降级到 JS 实现",
          );
        }
      })
    : null;

  // 2. 导入必要依赖
  const { createApp, defineComponent, h } = await import("vue");
  const {
    getInitialConfig,
    getPlatformConfig,
    getFrontendSystemConfig,
    isThemeSkinFeatureVisible,
    injectResponsiveStorage,
    useI18n,
  } = await import("@repo/config");
  const [
    routerModule,
    { setupStore },
    { menu },
    { Ripple },
    { useElementPlus },
    { ReDialog },
    { ElConfigProvider },
  ] = await Promise.all([
    useBuiltinRouter
      ? import("./router")
      : Promise.resolve({ router: undefined, routerReady: Promise.resolve() }),
    import("./store"),
    import("./directives/menu"),
    import("./directives/ripple"),
    import("@repo/plugins"),
    import("@repo/components/ReDialog"),
    import("element-plus"),
  ]);
  const { elementPlusLocale } = await import("@repo/config");
  let router = routerModule.router;
  let routerReady = routerModule.routerReady;

  // 显式注册应用路由（替代 import.meta.glob 自动发现）
  if (useBuiltinRouter && routerModule.addAppRoutes && appRoutes?.length) {
    routerModule.addAppRoutes(appRoutes);
  }
  // 完成路由初始化（首页路由 + 状态刷新 + 路由注册）
  if (useBuiltinRouter && routerModule.finalizeRoutes) {
    routerModule.finalizeRoutes();
  }

  if (useHomeRouter && homeComponent) {
    const { createRouter, createWebHashHistory } = await import("vue-router");
    router = createRouter({
      history: createWebHashHistory(),
      routes: [
        {
          path: "/",
          name: "Home",
          component: homeComponent,
        },
        {
          path: "/:pathMatch(.*)*",
          redirect: "/",
        },
      ],
    });
    routerReady = Promise.resolve();
  }
  const { getFrontendFontEncryptionOptions, syncFrontendSystemRuntime } =
    await import("./runtime/frontend-system");
  let motionEnabled = enableMotion;
  let MotionPlugin: any = null;
  if (motionEnabled) {
    try {
      ({ MotionPlugin } = await import("@vueuse/motion"));
    } catch (error) {
      motionEnabled = false;
      console.warn(
        "[AppBootstrap] MotionPlugin 加载失败，已跳过动画插件注册:",
        error,
      );
    }
  }
  let Table = null;
  if (enableTable) {
    Table = (await import("@pureadmin/table")).default;
  }
  const { FontIcon, IconifyIconOffline, IconifyIconOnline } =
    await import("@repo/components/ReIcon");
  const { Auth } = await import("@repo/components/ReAuth");
  let ScTable: any = null;
  let ScTableColumn: any = null;
  let ScAvatar: any = null;
  let ScBadge: any = null;
  let ScButton: any = null;
  let ScBacktop: any = null;
  let ScCard: any = null;
  let ScTimeText: any = null;
  let ScCheckbox: any = null;
  let ScCheckboxGroup: any = null;
  let ScCol: any = null;
  let ScContainer: any = null;
  let ScDatePicker: any = null;
  let ScDropdown: any = null;
  let ScDropdownItem: any = null;
  let ScDropdownMenu: any = null;
  let ScEmpty: any = null;
  let ScForm: any = null;
  let ScFormItem: any = null;
  let ScHeader: any = null;
  let ScIcon: any = null;
  let ScImage: any = null;
  let ScInput: any = null;
  let ScInputNumber: any = null;
  let ScMain: any = null;
  let ScMenu: any = null;
  let ScMenuItem: any = null;
  let ScOption: any = null;
  let ScPagination: any = null;
  let ScPopover: any = null;
  let ScPopconfirm: any = null;
  let ScRow: any = null;
  let ScScrollbar: any = null;
  let ScSelect: any = null;
  let ScSwitch: any = null;
  let ScTabs: any = null;
  let ScTabPane: any = null;
  let ScTag: any = null;
  let ScText: any = null;
  let ScDrawer: any = null;
  let ScOverlayPage: any = null;
  let ScVolumeControl: any = null;
  let ScDialog: any = null;
  let ScTooltip: any = null;

  if (enableScComponents) {
    ScTable = (await import("@repo/components/ScTable/index.vue")).default;
    ScTableColumn = (await import("@repo/components/ScTableColumn")).default;
    ScAvatar = (await import("@repo/components/ScAvatar")).default;
    ScBadge = (await import("@repo/components/ScBadge")).default;
    ScButton = (await import("@repo/components/ScButton")).default;
    ScBacktop = (await import("@repo/components/ScBacktop")).default;
    ScCard = (await import("@repo/components/ScCard")).default;
    ScTimeText = (await import("@repo/components/ScTimeText")).default;
    ScCheckbox = (await import("@repo/components/ScCheckbox")).ScCheckbox;
    ScCheckboxGroup = (await import("@repo/components/ScCheckbox")).ScCheckboxGroup;
    ScCol = (await import("@repo/components/ScCol")).default;
    ScContainer = (await import("@repo/components/ScContainer")).default;
    ScDatePicker = (await import("@repo/components/ScDatePicker")).default;
    ScDropdown = (await import("@repo/components/ScDropdown")).default;
    ScDropdownItem = (await import("@repo/components/ScDropdownItem")).default;
    ScDropdownMenu = (await import("@repo/components/ScDropdownMenu")).default;
    ScEmpty = (await import("@repo/components/ScEmpty")).default;
    ScForm = (await import("@repo/components/ScForm")).default;
    ScFormItem = (await import("@repo/components/ScFormItem")).default;
    ScHeader = (await import("@repo/components/ScHeader")).default;
    ScIcon = (await import("@repo/components/ScIcon")).default;
    ScImage = (await import("@repo/components/ScImage")).default;
    ScInput = (await import("@repo/components/ScInput")).default;
    ScInputNumber = (await import("@repo/components/ScInputNumber")).default;
    ScMain = (await import("@repo/components/ScMain")).default;
    ScMenu = (await import("@repo/components/ScMenu")).default;
    ScMenuItem = (await import("@repo/components/ScMenuItem")).default;
    ScOption = (await import("@repo/components/ScOption")).default;
    ScPagination = (await import("@repo/components/ScPagination")).default;
    ScPopover = (await import("@repo/components/ScPopover")).default;
    ScPopconfirm = (await import("@repo/components/ScPopconfirm")).default;
    ScRow = (await import("@repo/components/ScRow")).default;
    ScScrollbar = (await import("@repo/components/ScScrollbar")).default;
    ScSelect = (await import("@repo/components/ScSelect")).default;
    ScSwitch = (await import("@repo/components/ScSwitch/index.vue")).default;
    ScTabs = (await import("@repo/components/ScTabs")).ScTabs;
    ScTabPane = (await import("@repo/components/ScTabs")).ScTabPane;
    ScTag = (await import("@repo/components/ScTag")).default;
    ScText = (await import("@repo/components/ScText")).default;
    ScDrawer = (await import("@repo/components/ScDrawer")).default;
    ScOverlayPage = (await import("@repo/components/ScOverlayPage")).default;
    ScVolumeControl = (await import("@repo/components/ScVolumeControl")).default;
    ScDialog = (await import("@repo/components/ScDialog")).ScDialog;
    ScTooltip = (await import("@repo/components/ScTooltip")).default;
  }
  bootDebugLog("createStandardAppWithoutTech:base-imports-ready");

  // 3. 创建应用实例
  const rootComponent = routerEnabled
    ? // @ts-ignore - app-root 无类型声明
      (await import("@repo/app-root")).default
    : (() => {
        if (!homeComponent) {
          throw new Error(
            "[createStandardAppWithoutTech] router=false 时必须提供 homeComponent",
          );
        }
        return defineComponent({
          name: "StandaloneAppRoot",
          setup() {
            return () =>
              h(
                ElConfigProvider,
                { locale: elementPlusLocale },
                {
                  default: () => [h(homeComponent), h(ReDialog)],
                },
              );
          },
        });
      })();
  const app = createApp(rootComponent);

  // 4. 获取平台配置
  const config = await getPlatformConfig(app);
  const initialConfig = getInitialConfig();
  const frontendSystemConfig = getFrontendSystemConfig(initialConfig);
  bootDebugLog("createStandardAppWithoutTech:config-ready");
  if (routerEnabled) {
    await routerReady;
    bootDebugLog("createStandardAppWithoutTech:router-ready");
  }
  await syncFrontendSystemRuntime(initialConfig, !routerEnabled || enableFontEncryption === false);
  bootDebugLog("createStandardAppWithoutTech:frontend-system-runtime-ready");

  // 4.1 初始化加载动画样式
  try {
    const loaderStyleFromConfig = config?.LoadingPageStyle;
    const loaderStorageKey = getLoaderStorageKey(
      String(config?.SystemCode || "").trim(),
    );
    if (loaderStyleFromConfig) {
      const mapping: Record<string, string> = {
        spinner: "simple",
        clock: "default",
        pixel: "dinoGame",
        cube: "blocks",
        dots: "default",
        pulse: "pulse",
        minimal: "none",
        space: "rings",
        servererror: "book",
      };
      const loaderSyncKey = `${loaderStorageKey}:config-sync`;
      const currentStoredStyle = localStorage.getItem(loaderStorageKey);
      const currentSyncedConfig = localStorage.getItem(loaderSyncKey);
      const nextStyle = mapping[String(loaderStyleFromConfig)] || "none";

      // 配置首次生效或配置值发生变更时，同步一次首屏 loader 样式；
      // 之后用户在设置面板里的手动切换仍然保留，不会在每次启动时被强制覆盖。
      if (
        !currentStoredStyle ||
        currentSyncedConfig !== String(loaderStyleFromConfig)
      ) {
        localStorage.setItem(loaderStorageKey, nextStyle);
        localStorage.setItem(loaderSyncKey, String(loaderStyleFromConfig));
      }
    }
  } catch (error) {
      console.warn("[createStandardAppWithoutTech] 初始化加载动画样式失败:", error);
  }

  // 5. 创建 bootstrap
  const bootstrap = new AppBootstrap(app).registerCoreStyles(!routerEnabled);
  bootDebugLog("createStandardAppWithoutTech:bootstrap-created");

  if (wasmInitPromise) {
    await bootstrap.registerWasm(() => wasmInitPromise);
  }

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
  bootDebugLog("createStandardAppWithoutTech:directives-ready");

  // 5.2 字体加密指令
  if (routerEnabled && enableFontEncryption !== false) {
    const { vFontEncryption } = await import("@layout/default");
    const objDir = vFontEncryption as import("vue").ObjectDirective;
    const wrappedDirective: Directive = {
      mounted(el, binding: DirectiveBinding) {
        const globalFeCfg = {
          ...getFrontendFontEncryptionOptions(initialConfig),
          ...(typeof enableFontEncryption === "object"
            ? enableFontEncryption
            : {}),
        };
        const merged =
          binding.value == null
            ? globalFeCfg
            : typeof binding.value === "boolean"
              ? { ...globalFeCfg, enabled: binding.value }
              : { ...globalFeCfg, ...binding.value };
        objDir.mounted?.(
          el,
          { ...binding, value: merged },
          null as any,
          null as any,
        );
      },
      updated(el, binding: DirectiveBinding) {
        const globalFeCfg = {
          ...getFrontendFontEncryptionOptions(initialConfig),
          ...(typeof enableFontEncryption === "object"
            ? enableFontEncryption
            : {}),
        };
        const merged =
          binding.value == null
            ? globalFeCfg
            : typeof binding.value === "boolean"
              ? { ...globalFeCfg, enabled: binding.value }
              : { ...globalFeCfg, ...binding.value };
        objDir.updated?.(
          el,
          { ...binding, value: merged },
          null as any,
          null as any,
        );
      },
      unmounted: objDir.unmounted,
    };
    bootstrap.registerDirective("font-encryption", wrappedDirective);
  }
  bootDebugLog("createStandardAppWithoutTech:font-directive-ready");

  // 5.3 注册核心组件
  bootstrap
    .registerComponent("IconifyIconOffline", IconifyIconOffline)
    .registerComponent("IconifyIconOnline", IconifyIconOnline)
    .registerComponent("FontIcon", FontIcon)
    .registerComponent("Auth", Auth);

  if (enableScComponents) {
    bootstrap
      .registerComponent("ScTimeText", ScTimeText)
      .registerComponent("ScTable", ScTable)
      .registerComponent("ScTableColumn", ScTableColumn)
      .registerComponent("ScAvatar", ScAvatar)
      .registerComponent("ScBadge", ScBadge)
      .registerComponent("ScBacktop", ScBacktop)
      .registerComponent("ScButton", ScButton)
      .registerComponent("ScCard", ScCard)
      .registerComponent("ScCheckbox", ScCheckbox)
      .registerComponent("ScCheckboxGroup", ScCheckboxGroup)
      .registerComponent("ScCol", ScCol)
      .registerComponent("ScContainer", ScContainer)
      .registerComponent("ScDatePicker", ScDatePicker)
      .registerComponent("ScDropdown", ScDropdown)
      .registerComponent("ScDropdownItem", ScDropdownItem)
      .registerComponent("ScDropdownMenu", ScDropdownMenu)
      .registerComponent("ScEmpty", ScEmpty)
      .registerComponent("ScForm", ScForm)
      .registerComponent("ScFormItem", ScFormItem)
      .registerComponent("ScHeader", ScHeader)
      .registerComponent("ScIcon", ScIcon)
      .registerComponent("ScImage", ScImage)
      .registerComponent("ScInput", ScInput)
      .registerComponent("ScInputNumber", ScInputNumber)
      .registerComponent("ScMain", ScMain)
      .registerComponent("ScSelect", ScSelect)
      .registerComponent("ScMenu", ScMenu)
      .registerComponent("ScMenuItem", ScMenuItem)
      .registerComponent("ScOption", ScOption)
      .registerComponent("ScPagination", ScPagination)
      .registerComponent("ScPopover", ScPopover)
      .registerComponent("ScPopconfirm", ScPopconfirm)
      .registerComponent("ScRow", ScRow)
      .registerComponent("ScScrollbar", ScScrollbar)
      .registerComponent("ScSwitch", ScSwitch)
      .registerComponent("ScTabs", ScTabs)
      .registerComponent("ScTabPane", ScTabPane)
      .registerComponent("ScTag", ScTag)
      .registerComponent("ScDrawer", ScDrawer)
      .registerComponent("ScOverlayPage", ScOverlayPage)
      .registerComponent("ScVolumeControl", ScVolumeControl)
      .registerComponent("ScDialog", ScDialog)
      .registerComponent("ScTooltip", ScTooltip)
      .registerComponent("ScText", ScText);
  }

  if (Object.keys(components).length > 0) {
    bootstrap.registerGlobalComponents(components);
  }
  bootDebugLog("createStandardAppWithoutTech:components-ready");

  // 5.4 注册第三方插件
  if (enableTippy) {
    const VueTippy = (await import("vue-tippy")).default;
    bootstrap.use(() => {
      void app.use(VueTippy);
    });
  }
  if (enableElementPlusX) {
    try {
      const ElementPlusX = (await import("vue-element-plus-x")).default;
      bootstrap.use(() => {
        void app.use(ElementPlusX);
      });
    } catch (error) {
      console.warn(
        "[createStandardAppWithoutTech] ElementPlusX 加载失败，跳过注册:",
        error,
      );
    }
  }

  // 5.5 注册核心功能
  const activeRouter =
    customRouter && customRouter !== false ? customRouter : router;
  const corePlugins: any[] = [];
  if (motionEnabled && MotionPlugin) corePlugins.push(MotionPlugin);
  if (enableI18n) corePlugins.push(useI18n);
  corePlugins.push(useElementPlus);
  if (enableTable) corePlugins.push(Table);
  installConsoleWarnFilter();

  bootstrap
    .registerStore(setupStore)
    .use(() => injectResponsiveStorage(app, config))
    .registerPlugins([...corePlugins, ...plugins, ...socketPlugins])
    .registerEncryptedFonts();
  if (activeRouter) {
    bootstrap.registerRouter(activeRouter);
  }
  bootDebugLog("createStandardAppWithoutTech:core-bootstrap-registered");

  // 5.6 全局 Socket 服务初始化
  if (socket) {
    bootstrap.use(async () => {
      try {
        bootDebugLog("createStandardAppWithoutTech:socket-service:start");
        const { initGlobalSocketService } =
          await import("./config/socketService");
        initGlobalSocketService(socket);
        bootDebugLog("createStandardAppWithoutTech:socket-service:done");
      } catch (error) {
        console.warn("[createStandardAppWithoutTech] 全局 Socket 服务初始化失败:", error);
      }
    });
  }

  // 5.7 socketSetup 路由钩子
  if (socketSetup && activeRouter) {
    bootstrap.use(() => socketSetup(activeRouter));
  }
  bootDebugLog("createStandardAppWithoutTech:socket-setup-registered");

  // 5.8 主题系统
  if (routerEnabled && enableTheme) {
    bootstrap.use(async () => {
      try {
        bootDebugLog("createStandardAppWithoutTech:theme:start");
        if (!isThemeSkinFeatureVisible(frontendSystemConfig)) {
          bootDebugLog("createStandardAppWithoutTech:theme:skipped");
          return;
        }
        const { autoRegisterThemePlugins, initThemeSystem } =
          await import("@repo/components/hooks");
        await autoRegisterThemePlugins(app);
        await initThemeSystem();
        bootDebugLog("createStandardAppWithoutTech:theme:done");
      } catch (error) {
        console.warn("[createStandardAppWithoutTech] 主题系统初始化失败:", error);
      }
    });
  }

  // 5.9 设置全局属性和警告处理器（修复 __proxyIdCheat__ 警告）
  (app.config.globalProperties as any).__proxyIdCheat__ = 0;
  app.config.warnHandler = (msg, _instance, trace) => {
    if (typeof msg === "string") {
      if (
        msg.includes("__proxyIdCheat__") &&
        msg.includes(
          "was accessed during render but is not defined on instance",
        )
      )
        return;
      if (msg.includes('Slot "default" invoked outside of the render function'))
        return;
      if (
        msg.includes(
          "Runtime directive used on component with non-element root node",
        )
      )
        return;
      if (shouldIgnoreMissingRouteWarning(msg)) return;
    }
    console.warn(msg, trace);
  };

  // 5.10 自定义初始化
  if (setup) {
    bootDebugLog("createStandardAppWithoutTech:custom-setup:start");
    await bootstrap.useAsync(async (app) => {
      await setup(app, config);
    });
    bootDebugLog("createStandardAppWithoutTech:custom-setup:done");
  }

  bootDebugLog("createStandardAppWithoutTech:ready");
  return bootstrap;
}

export async function createStandardApp(
  options: StandardAppOptions = {},
): Promise<AppBootstrap> {
  bootDebugLog("createStandardApp:start");
  const { enableTech = false, setup, ...rest } = options;
  const techOptions = normalizeTechOptions(enableTech);

  if (!techOptions) {
    return createStandardAppWithoutTech(options);
  }

  return createStandardAppWithoutTech({
    ...rest,
    enableTech,
    setup: async (app, config) => {
      bootDebugLog("createStandardApp:tech:start", techOptions);
      try {
        await import("@techui/scifi/dist/index.css");
        const { default: techuiScifiInit } = await import("@techui/scifi");
        await techuiScifiInit({
          app,
          license: techOptions.license ?? null,
          features: techOptions.features ?? {},
          debug: techOptions.debug ?? false,
        });
        bootDebugLog("createStandardApp:tech:done");
      } catch (error) {
        console.warn(
          "[createStandardApp] TechUIInit 初始化失败，已降级继续启动:",
          error,
        );
      }

      if (setup) {
        await setup(app, config);
      }
    },
  });
}
