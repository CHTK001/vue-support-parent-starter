/**
 * 应用启动器 - 统一的应用初始化注册器
 * 提供链式调用 API，灵活注册各种核心功能；
 * 同时包含 createStandardApp 完整实现（原 standard-app.ts 已合并至此）。
 */

import type { App, Directive, DirectiveBinding } from "vue";
import type { Router } from "vue-router";
import type { SocketServiceConfig } from "./config/socketService";

let coreStylesPromise: Promise<void> | null = null;

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

  registerCoreStyles(): this {
    if (!coreStylesPromise) {
      coreStylesPromise = (async () => {
        try {
          bootDebugLog("registerCoreStyles:start");
          await Promise.all([
            import("element-plus/dist/index.css"),
            import("element-plus/theme-chalk/dark/css-vars.css"),
            import("tippy.js/dist/tippy.css"),
            import("tippy.js/themes/light.css"),
            import("@repo/assets/styles/layout/default/reset.scss"),
            import("@repo/assets/styles/layout/default/tailwind.css"),
            import("@repo/assets/styles/layout/default/index.scss"),
          ]);
          bootDebugLog("registerCoreStyles:done");
        } catch (error) {
          console.error("[AppBootstrap] 核心样式加载失败:", error);
        }
      })();
    }

    this.initPromises.push(coreStylesPromise);
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
        const { registerEncryptedFonts } = await import("@repo/font-encryption");
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
        bootDebugLog("registerRouter:ready", router.currentRoute.value.fullPath);
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
        const pluginList = typeof plugins === "function" ? await plugins() : plugins;
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

  getApp(): App { return this.app; }
  getRouter(): Router | undefined { return this.router; }
  getConfig(): any { return this.config; }

  private hideInitialLoader(): void {
    if (typeof window === "undefined") return;

    const hide = () => {
      try {
        window.hideAppLoader?.();
        const appLoader = document.getElementById("app-loader");
        if (appLoader) {
          appLoader.style.display = "none";
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
      console.log("[AppBootstrap] 应用启动成功");
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

export async function createStandardApp(
  options: StandardAppOptions = {},
): Promise<AppBootstrap> {
  bootDebugLog("createStandardApp:start");
  const {
    enableWasm = "AUTO",
    enableTippy = true,
    enableElementPlusX = false,
    enableMotion = true,
    enableTable = true,
    enableI18n = true,
    enableFontEncryption = true,
    enableTheme = true,
    enableCoreDirectives = true,
    components = {},
    directives = {},
    plugins = [],
    socketPlugins = [],
    socketSetup,
    socket,
    router: customRouter,
    setup,
  } = options;

  // 1. 尽早启动 WASM 初始化，并在 mount 前确保完成
  const wasmInitPromise = resolveWasmEnabled(enableWasm)
    ? import("@repo/codec-wasm")
        .then(async ({ initializeWasmModule }) => {
          bootDebugLog("createStandardApp:wasm-imported");
          const result = await initializeWasmModule();
          if (!result) {
            throw new Error("WASM 模块初始化失败");
          }
        })
    : null;

  // 2. 导入必要依赖
  const { createApp } = await import("vue");
  // @ts-ignore - app-root 无类型声明
  const AppRoot = (await import("@repo/app-root")).default;
  const { getPlatformConfig, injectResponsiveStorage, useI18n } = await import("@repo/config");
  const [{ router }, { setupStore }, { menu }, { Ripple }, { useElementPlus }] = await Promise.all([
    import("./router"),
    import("./store"),
    import("./directives/menu"),
    import("./directives/ripple"),
    import("@repo/plugins"),
  ]);
  const { MotionPlugin } = await import("@vueuse/motion");
  const Table = (await import("@pureadmin/table")).default;
  const { FontIcon, IconifyIconOffline, IconifyIconOnline } = await import("@repo/components/ReIcon");
  const { Auth } = await import("@repo/components/ReAuth");
  const ScTable = (await import("@repo/components/ScTable/index.vue")).default;
  const { ScTableColumn } = await import("@repo/components/ScTableColumn");
  const { ScButton } = await import("@repo/components/ScButton");
  const { ScBacktop } = await import("@repo/components/ScBacktop");
  const { ScCard } = await import("@repo/components/ScCard");
  const { ScCheckbox, ScCheckboxGroup } = await import("@repo/components/ScCheckbox");
  const { ScCol } = await import("@repo/components/ScCol");
  const { ScContainer } = await import("@repo/components/ScContainer");
  const { ScDatePicker } = await import("@repo/components/ScDatePicker");
  const { ScDropdown } = await import("@repo/components/ScDropdown");
  const { ScDropdownItem } = await import("@repo/components/ScDropdownItem");
  const { ScDropdownMenu } = await import("@repo/components/ScDropdownMenu");
  const { ScEmpty } = await import("@repo/components/ScEmpty");
  const { ScForm } = await import("@repo/components/ScForm");
  const { ScFormItem } = await import("@repo/components/ScFormItem");
  const { ScHeader } = await import("@repo/components/ScHeader/index.ts");
  const { ScIcon } = await import("@repo/components/ScIcon");
  const { ScImage } = await import("@repo/components/ScImage/index.ts");
  const { ScInput } = await import("@repo/components/ScInput");
  const { ScInputNumber } = await import("@repo/components/ScInputNumber");
  const { ScMain } = await import("@repo/components/ScMain");
  const { ScMenu } = await import("@repo/components/ScMenu");
  const { ScMenuItem } = await import("@repo/components/ScMenuItem");
  const { ScOption } = await import("@repo/components/ScOption");
  const { ScPagination } = await import("@repo/components/ScPagination");
  const { ScPopover } = await import("@repo/components/ScPopover");
  const { ScPopconfirm } = await import("@repo/components/ScPopconfirm");
  const { ScRow } = await import("@repo/components/ScRow");
  const { ScScrollbar } = await import("@repo/components/ScScrollbar");
  const { ScSelect } = await import("@repo/components/ScSelect");
  const ScSwitch = (await import("@repo/components/ScSwitch/index.vue")).default;
  const { ScTag } = await import("@repo/components/ScTag");
  const { ScText } = await import("@repo/components/ScText");
  const { ScDrawer } = await import("@repo/components/ScDrawer");
  const { ScDialog } = await import("@repo/components/ScDialog");
  const { ScTooltip } = await import("@repo/components/ScTooltip");
  bootDebugLog("createStandardApp:base-imports-ready");

  // 3. 创建应用实例
  const app = createApp(AppRoot);

  // 4. 获取平台配置
  const config = await getPlatformConfig(app);
  bootDebugLog("createStandardApp:config-ready");

  // 4.1 初始化加载动画样式
  try {
    const loaderStyleFromConfig = config?.LoadingPageStyle;
    if (loaderStyleFromConfig && !localStorage.getItem("sys-loader-style")) {
      const mapping: Record<string, string> = {
        spinner: "simple", clock: "default", pixel: "dinoGame",
        cube: "blocks", dots: "default", pulse: "pulse",
        minimal: "simple", space: "rings", servererror: "book",
      };
      localStorage.setItem("sys-loader-style", mapping[String(loaderStyleFromConfig)] || "default");
    }
  } catch (error) {
    console.warn("[createStandardApp] 初始化加载动画样式失败:", error);
  }

  // 5. 创建 bootstrap
  const bootstrap = new AppBootstrap(app).registerCoreStyles();
  bootDebugLog("createStandardApp:bootstrap-created");

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
  bootDebugLog("createStandardApp:directives-ready");

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
  bootDebugLog("createStandardApp:font-directive-ready");

  // 5.3 注册核心组件
  bootstrap
    .registerComponent("IconifyIconOffline", IconifyIconOffline)
    .registerComponent("IconifyIconOnline", IconifyIconOnline)
    .registerComponent("FontIcon", FontIcon)
    .registerComponent("Auth", Auth)
    .registerComponent("ScTable", ScTable)
    .registerComponent("ScTableColumn", ScTableColumn)
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
    .registerComponent("ScTag", ScTag)
    .registerComponent("ScDrawer", ScDrawer)
    .registerComponent("ScDialog", ScDialog)
    .registerComponent("ScTooltip", ScTooltip)
    .registerComponent("ScText", ScText);

  if (Object.keys(components).length > 0) {
    bootstrap.registerGlobalComponents(components);
  }
  bootDebugLog("createStandardApp:components-ready");

  // 5.4 注册第三方插件
  if (enableTippy) {
    const VueTippy = (await import("vue-tippy")).default;
    bootstrap.use(() => { void app.use(VueTippy); });
  }
  if (enableElementPlusX) {
    try {
      const ElementPlusX = (await import("vue-element-plus-x")).default;
      bootstrap.use(() => { void app.use(ElementPlusX); });
    } catch (error) {
      console.warn("[createStandardApp] ElementPlusX 加载失败，跳过注册:", error);
    }
  }

  // 5.5 注册核心功能
  const activeRouter = customRouter ?? router;
  const corePlugins: any[] = [];
  if (enableMotion) corePlugins.push(MotionPlugin);
  if (enableI18n) corePlugins.push(useI18n);
  corePlugins.push(useElementPlus);
  if (enableTable) corePlugins.push(Table);

  bootstrap
    .registerStore(setupStore)
    .registerRouter(activeRouter)
    .use(() => injectResponsiveStorage(app, config))
    .registerPlugins([...corePlugins, ...plugins, ...socketPlugins])
    .registerEncryptedFonts();
  bootDebugLog("createStandardApp:core-bootstrap-registered");

  // 5.6 全局 Socket 服务初始化
  if (socket) {
    bootstrap.use(async () => {
      try {
        bootDebugLog("createStandardApp:socket-service:start");
        const { initGlobalSocketService } = await import("./config/socketService");
        initGlobalSocketService(socket);
        bootDebugLog("createStandardApp:socket-service:done");
      } catch (error) {
        console.warn("[createStandardApp] 全局 Socket 服务初始化失败:", error);
      }
    });
  }

  // 5.7 socketSetup 路由钩子
  if (socketSetup) {
    bootstrap.use(() => socketSetup(activeRouter));
  }
  bootDebugLog("createStandardApp:socket-setup-registered");

  // 5.8 主题系统
  if (enableTheme) {
    bootstrap.use(async () => {
      try {
        bootDebugLog("createStandardApp:theme:start");
        const { autoRegisterThemePlugins, initThemeSystem } = await import("@repo/components/hooks");
        await autoRegisterThemePlugins(app);
        await initThemeSystem();
        bootDebugLog("createStandardApp:theme:done");
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
      if (msg.includes('[Vue Router warn]: No match found for location with path "/home"')) return;
      if (msg.includes('[Vue Router warn]: No match found for location with path "/"')) return;
    }
    console.warn(msg, trace);
  };

  // 5.10 自定义初始化
  if (setup) {
    bootDebugLog("createStandardApp:custom-setup:start");
    await bootstrap.useAsync(async (app) => { await setup(app, config); });
    bootDebugLog("createStandardApp:custom-setup:done");
  }

  bootDebugLog("createStandardApp:ready");
  return bootstrap;
}
