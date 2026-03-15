/**
 * 标准应用启动器
 * - 用于快速创建“完整功能”的应用实例（指令/组件/路由/插件/字体加密等）
 * - 依赖较多，不建议在轻量应用中从 @repo/core 入口直接引入
 */

import type { App, Directive } from "vue";

import { AppBootstrap } from "./app-bootstrap";

/**
 * 标准应用配置选项
 */
export interface StandardAppOptions {
  /** 是否注册 VueTippy */
  enableTippy?: boolean;
  /** 是否注册 ElementPlusX */
  enableElementPlusX?: boolean;
  /** 是否启用 WASM */
  enableWasm?: boolean;
  /** 自定义组件 */
  components?: Record<string, any>;
  /** 自定义指令 */
  directives?: Record<string, Directive>;
  /** 自定义插件 */
  plugins?: any[];
  /** 自定义初始化函数 */
  setup?: (app: App, config?: any) => void | Promise<void>;
}

/**
 * 创建标准应用 - 自动注册常用功能
 * 包括：指令、组件、字体加密、路由、插件等
 *
 * 注意：该方法会按需动态导入多个模块，请确保对应依赖在应用侧已安装/可解析。
 *
 * @param options 标准应用选项
 */
export async function createStandardApp(
  options: StandardAppOptions = {},
): Promise<AppBootstrap> {
  const {
    enableTippy = true,
    enableElementPlusX = false,
    enableWasm = true,
    components = {},
    directives = {},
    plugins = [],
    setup,
  } = options;

  // 1. 首先初始化 WASM（必须第一个执行）
  if (enableWasm) {
    try {
      const { initializeWasmModule, setCodecMode, CodecMode } = await import("@repo/codec-wasm");
      // 根据环境决定模式：开发环境默认 auto（WASM 不存在时自动降级），生产环境同样 auto
      // 如需强制 JS 模式可设置 setCodecMode(CodecMode.JS)
      setCodecMode(CodecMode.AUTO);
      await initializeWasmModule();
    } catch (error) {
      console.warn("[createStandardApp] WASM 模块加载失败:", error);
    }
  }

  // 2. 导入必要的依赖
  const { createApp } = await import("vue");
  const AppRoot = (await import("@repo/app-root")).default;
  const { getPlatformConfig, injectResponsiveStorage, useI18n } =
    await import("@repo/config");
  const { router, setupStore, menu, Ripple } = await import("@repo/core");
  const { useElementPlus } = await import("@repo/plugins");
  const { MotionPlugin } = await import("@vueuse/motion");
  const Table = (await import("@pureadmin/table")).default;
  const coreDirectives = await import("@repo/core");
  const { vFontEncryption } = await import("@layout/default");
  const { FontIcon, IconifyIconOffline, IconifyIconOnline } =
    await import("@repo/components/ReIcon");
  const { Auth } = await import("@repo/components/ReAuth");

  // 导入基础 Sc 组件（只保留核心表格、选择和弹出类组件）
  const {
    ScTable,
    ScTableColumn,
    ScButton,
    ScSelect,
    ScSwitch,
    ScText,
    ScDrawer,
    ScDialog,
    ScTooltip,
  } = await import("@repo/components");

  // 3. 创建应用实例
  const app = createApp(AppRoot);

  // 4. 获取平台配置（异步）
  const config = await getPlatformConfig(app);

  // 4.1 根据全局配置初始化加载动画样式（仅在本地未选择样式时生效）
  try {
    const loaderStyleFromConfig = config?.LoadingPageStyle;
    if (loaderStyleFromConfig && !localStorage.getItem("sys-loader-style")) {
      const mapping: Record<string, string> = {
        spinner: "simple",
        clock: "default",
        pixel: "dinoGame",
        cube: "blocks",
        dots: "default",
        pulse: "pulse",
        minimal: "simple",
        space: "rings",
        servererror: "book",
      };
      const internalKey = mapping[String(loaderStyleFromConfig)] || "default";
      localStorage.setItem("sys-loader-style", internalKey);
    }
  } catch (error) {
    // 初始化失败不影响主流程，记录日志方便排查
    // eslint-disable-next-line no-console
    console.warn("[createStandardApp] 初始化加载动画样式失败:", error);
  }

  // 5. 创建 bootstrap 并注册所有功能
  const bootstrap = new AppBootstrap(app);

  // 注册核心指令
  bootstrap
    .registerDirectives(coreDirectives)
    .registerDirective("menu", menu)
    .registerDirective("ripple", Ripple)
    .registerDirective("font-encryption", vFontEncryption);

  // 注册自定义指令
  if (Object.keys(directives).length > 0) {
    bootstrap.registerDirectives(directives);
  }

  // 注册核心组件
  bootstrap
    .registerComponent("IconifyIconOffline", IconifyIconOffline)
    .registerComponent("IconifyIconOnline", IconifyIconOnline)
    .registerComponent("FontIcon", FontIcon)
    .registerComponent("Auth", Auth);

  // 注册基础 Sc 组件（其余组件按需在业务侧手动注册）
  bootstrap
    .registerComponent("ScTable", ScTable)
    .registerComponent("ScTableColumn", ScTableColumn)
    .registerComponent("ScButton", ScButton)
    .registerComponent("ScSelect", ScSelect)
    .registerComponent("ScSwitch", ScSwitch)
    .registerComponent("ScDrawer", ScDrawer)
    .registerComponent("ScDialog", ScDialog)
    .registerComponent("ScTooltip", ScTooltip)
    .registerComponent("ScText", ScText);

  // 注册自定义组件
  if (Object.keys(components).length > 0) {
    bootstrap.registerGlobalComponents(components);
  }

  // 注册第三方插件
  if (enableTippy) {
    const VueTippy = (await import("vue-tippy")).default;
    bootstrap.use(() => app.use(VueTippy));
  }

  if (enableElementPlusX) {
    const ElementPlusX = (await import("vue-element-plus-x")).default;
    bootstrap.use(() => app.use(ElementPlusX));
  }

  // 注册核心功能
  bootstrap
    .registerStore(setupStore)
    .registerRouter(router)
    .use(() => injectResponsiveStorage(app, config))
    .registerPlugins([MotionPlugin, useI18n, useElementPlus, Table, ...plugins])
    .registerEncryptedFonts();

  // 自动注册主题插件和初始化主题系统
  bootstrap.use(async () => {
    try {
      const { autoRegisterThemePlugins, initThemeSystem } =
        await import("@repo/components");
      await autoRegisterThemePlugins(app);
      await initThemeSystem();
    } catch (error) {
      console.warn("[createStandardApp] 主题系统初始化失败:", error);
    }
  });

  // 自定义初始化
  if (setup) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app.config.globalProperties as any).__proxyIdCheat__ = 0;

    app.config.warnHandler = (msg, instance, trace) => {
      if (typeof msg === "string") {
        if (
          msg.includes("__proxyIdCheat__") &&
          msg.includes(
            "was accessed during render but is not defined on instance",
          )
        ) {
          return;
        }
        if (
          msg.includes('Slot "default" invoked outside of the render function')
        ) {
          return;
        }
        if (
          msg.includes(
            "Runtime directive used on component with non-element root node",
          )
        ) {
          return;
        }
      }
      console.warn(msg, trace);
    };

    await bootstrap.useAsync(async (app) => {
      await setup(app, config);
    });
  }

  return bootstrap;
}
