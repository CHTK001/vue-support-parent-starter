/**
 * 标准应用启动器
 * - 用于快速创建"完整功能"的应用实例（指令/组件/路由/插件/字体加密等）
 * - 依赖较多，不建议在轻量应用中从 @repo/core 入口直接引入
 */

import type { App, Directive, DirectiveBinding } from "vue";
import type { Router } from "vue-router";
import type { SocketServiceConfig } from "./config/socketService";

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

import { AppBootstrap } from "./app-bootstrap";

/**
 * 标准应用配置选项
 */
export interface StandardAppOptions {
  // ── 基础功能开关 ──────────────────────────────────────────
  /** 是否启用 WASM，默认 true */
  enableWasm?: boolean;
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

/**
 * 创建标准应用 - 自动注册常用功能
 * 包括：指令、组件、字体加密、路由、插件、主题、socket 等
 *
 * @param options 标准应用选项
 */
export async function createStandardApp(
  options: StandardAppOptions = {},
): Promise<AppBootstrap> {
  const {
    enableWasm = true,
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

  // 1. 初始化 WASM（必须第一个执行）
  if (enableWasm) {
    try {
      const { initializeWasmModule } = await import("@repo/codec-wasm");
      await initializeWasmModule();
    } catch (error) {
      console.warn("[createStandardApp] WASM 模块加载失败:", error);
    }
  }

  // 2. 导入必要依赖
  const { createApp } = await import("vue");
  // @ts-ignore - app-root 无类型声明
  const AppRoot = (await import("@repo/app-root")).default;
  const { getPlatformConfig, injectResponsiveStorage, useI18n } = await import("@repo/config");
  const { router, setupStore, menu, Ripple } = await import("@repo/core");
  const { useElementPlus } = await import("@repo/plugins");
  const { MotionPlugin } = await import("@vueuse/motion");
  const Table = (await import("@pureadmin/table")).default;
  const { FontIcon, IconifyIconOffline, IconifyIconOnline } = await import("@repo/components/ReIcon");
  const { Auth } = await import("@repo/components/ReAuth");
  const {
    ScTable, ScTableColumn, ScButton, ScSelect, ScSwitch,
    ScText, ScDrawer, ScDialog, ScTooltip,
  } = await import("@repo/components");

  // 3. 创建应用实例
  const app = createApp(AppRoot);

  // 4. 获取平台配置
  const config = await getPlatformConfig(app);

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
  const bootstrap = new AppBootstrap(app);

  // 5.1 注册核心指令（默认全开，支持自定义覆盖）
  if (enableCoreDirectives) {
    const coreDir = await import("./directives");
    // 逐个注册，避免把非指令成员混入
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
      // 自定义指令覆盖同名核心指令
      ...directives,
    };
    bootstrap.registerDirectives(builtinDirectives);
  } else if (Object.keys(directives).length > 0) {
    bootstrap.registerDirectives(directives);
  }

  // 5.2 字体加密指令
  if (enableFontEncryption !== false) {
    const { vFontEncryption } = await import("@layout/default");
    // 如果是对象配置，包装指令注入全局默认值
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
  bootstrap
    .registerComponent("IconifyIconOffline", IconifyIconOffline)
    .registerComponent("IconifyIconOnline", IconifyIconOnline)
    .registerComponent("FontIcon", FontIcon)
    .registerComponent("Auth", Auth)
    .registerComponent("ScTable", ScTable)
    .registerComponent("ScTableColumn", ScTableColumn)
    .registerComponent("ScButton", ScButton)
    .registerComponent("ScSelect", ScSelect)
    .registerComponent("ScSwitch", ScSwitch)
    .registerComponent("ScDrawer", ScDrawer)
    .registerComponent("ScDialog", ScDialog)
    .registerComponent("ScTooltip", ScTooltip)
    .registerComponent("ScText", ScText);

  if (Object.keys(components).length > 0) {
    bootstrap.registerGlobalComponents(components);
  }

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

  bootstrap
    .registerStore(setupStore)
    .registerRouter(activeRouter)
    .use(() => injectResponsiveStorage(app, config))
    .registerPlugins([...corePlugins, ...plugins, ...socketPlugins])
    .registerEncryptedFonts();

  // 5.6 全局 Socket 服务初始化
  if (socket) {
    bootstrap.use(async () => {
      try {
        const { initGlobalSocketService } = await import("./config/socketService");
        initGlobalSocketService(socket);
      } catch (error) {
        console.warn("[createStandardApp] 全局 Socket 服务初始化失败:", error);
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

  // 5.9 自定义初始化
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
    await bootstrap.useAsync(async (app) => { await setup(app, config); });
  }

  return bootstrap;
}
