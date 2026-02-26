/**
 * 应用启动器 - 统一的应用初始化注册器
 * 提供链式调用API，灵活注册各种核心功能
 *
 * @example
 * ```ts
 * import { createStandardApp } from "@repo/core";
 *
 * createStandardApp()
 *   .registerCustomComponents({ MyComponent })
 *   .mount("#app");
 * ```
 */

import type { App, Directive } from "vue";
import type { Router } from "vue-router";

export interface BootstrapOptions {
  /** 应用实例 */
  app: App;
  /** 路由实例 */
  router?: Router;
  /** 配置对象 */
  config?: any;
}

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

export class AppBootstrap {
  private app: App;
  private router?: Router;
  private config?: any;
  private initPromises: Promise<any>[] = [];

  constructor(app: App) {
    this.app = app;
  }

  /**
   * 注册核心样式
   * 包括：reset.scss, tailwind.css, element-plus, iconfont等
   */
  registerCoreStyles(): this {
    // 样式通过 main.ts 中的 import 语句加载
    // 这里只是占位，实际样式加载在 main.ts 顶部
    return this;
  }

  /**
   * 注册全局指令
   * @param directives 指令对象集合
   */
  registerDirectives(directives?: Record<string, Directive>): this {
    if (!directives) return this;

    Object.keys(directives).forEach((key) => {
      this.app.directive(key, directives[key]);
    });

    return this;
  }

  /**
   * 注册单个指令
   * @param name 指令名称
   * @param directive 指令定义
   */
  registerDirective(name: string, directive: Directive): this {
    this.app.directive(name, directive);
    return this;
  }

  /**
   * 注册全局组件
   * @param components 组件对象集合
   */
  registerGlobalComponents(components?: Record<string, any>): this {
    if (!components) return this;

    Object.keys(components).forEach((key) => {
      this.app.component(key, components[key]);
    });

    return this;
  }

  /**
   * 注册单个全局组件
   * @param name 组件名称
   * @param component 组件定义
   */
  registerComponent(name: string, component: any): this {
    this.app.component(name, component);
    return this;
  }

  /**
   * 注册加密字体
   * 异步加载字体加密模块
   */
  registerEncryptedFonts(): this {
    const promise = (async () => {
      try {
        const { registerEncryptedFonts } =
          await import("@repo/font-encryption");
        await registerEncryptedFonts();
      } catch (error) {
        console.warn("[AppBootstrap] 字体加密模块加载失败:", error);
      }
    })();

    this.initPromises.push(promise);
    return this;
  }

  /**
   * 注册路由
   * @param router 路由实例
   */
  registerRouter(router: Router): this {
    this.router = router;
    this.app.use(router);

    const promise = router.isReady();
    this.initPromises.push(promise);

    return this;
  }

  /**
   * 注册 Iconify 图标组件
   * @param components Iconify 组件集合
   */
  registerIconify(components?: Record<string, any>): this {
    if (!components) return this;

    Object.keys(components).forEach((key) => {
      this.app.component(key, components[key]);
    });

    return this;
  }

  /**
   * 注册第三方插件
   * 支持同步和异步插件
   * @param plugins 插件数组或异步加载函数
   */
  registerPlugins(plugins?: any[] | (() => Promise<any[]>)): this {
    if (!plugins) return this;

    const promise = (async () => {
      try {
        const pluginList =
          typeof plugins === "function" ? await plugins() : plugins;

        for (const plugin of pluginList) {
          if (plugin && typeof plugin.install === "function") {
            this.app.use(plugin);
          } else if (plugin) {
            this.app.use(plugin);
          }
        }
      } catch (error) {
        console.error("[AppBootstrap] 插件注册失败:", error);
      }
    })();

    this.initPromises.push(promise);
    return this;
  }

  /**
   * 注册状态管理
   * @param setupStore 状态管理设置函数
   */
  registerStore(setupStore: (app: App) => void): this {
    setupStore(this.app);
    return this;
  }

  /**
   * 注册配置
   * @param config 配置对象或异步加载函数
   */
  async registerConfig(config: any | (() => Promise<any>)): Promise<this> {
    try {
      this.config = typeof config === "function" ? await config() : config;
    } catch (error) {
      console.error("[AppBootstrap] 配置加载失败:", error);
    }
    return this;
  }

  /**
   * 注册 WASM 模块
   * @param initWasm WASM 初始化函数
   */
  async registerWasm(initWasm: () => Promise<void>): Promise<this> {
    try {
      await initWasm();
    } catch (error) {
      console.warn("[AppBootstrap] WASM 模块加载失败:", error);
    }
    return this;
  }

  /**
   * 自定义初始化函数
   * @param fn 初始化函数
   */
  use(fn: (app: App, config?: any) => void | Promise<void>): this {
    const promise = Promise.resolve(fn(this.app, this.config));
    this.initPromises.push(promise);
    return this;
  }

  /**
   * 异步自定义初始化
   * @param fn 异步初始化函数
   */
  async useAsync(fn: (app: App, config?: any) => Promise<void>): Promise<this> {
    await fn(this.app, this.config);
    return this;
  }

  /**
   * 获取应用实例
   */
  getApp(): App {
    return this.app;
  }

  /**
   * 获取路由实例
   */
  getRouter(): Router | undefined {
    return this.router;
  }

  /**
   * 获取配置对象
   */
  getConfig(): any {
    return this.config;
  }

  /**
   * 挂载应用
   * 等待所有异步初始化完成后挂载
   * @param selector 挂载选择器
   */
  async mount(selector: string): Promise<void> {
    try {
      // 等待所有初始化完成
      await Promise.all(this.initPromises);

      // 挂载应用
      this.app.mount(selector);

      console.log("[AppBootstrap] 应用启动成功");
    } catch (error) {
      console.error("[AppBootstrap] 应用启动失败:", error);
      // 即使出错也尝试挂载
      this.app.mount(selector);
    }
  }

  /**
   * 同步挂载（不等待异步初始化）
   * @param selector 挂载选择器
   */
  mountSync(selector: string): void {
    this.app.mount(selector);
  }
}

/**
 * 创建应用启动器
 * @param app Vue 应用实例
 */
export function createAppBootstrap(app: App): AppBootstrap {
  return new AppBootstrap(app);
}

/**
 * 快速启动助手 - 使用默认配置
 * @param app Vue 应用实例
 * @param options 启动选项
 */
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

  if (options.directives) {
    bootstrap.registerDirectives(options.directives);
  }

  if (options.components) {
    bootstrap.registerGlobalComponents(options.components);
  }

  if (options.setupStore) {
    bootstrap.registerStore(options.setupStore);
  }

  if (options.router) {
    bootstrap.registerRouter(options.router);
  }

  if (options.plugins) {
    bootstrap.registerPlugins(options.plugins);
  }

  await bootstrap.mount("#app");
}

/**
 * 创建标准应用 - 自动注册常用功能
 * 包括：样式、指令、组件、字体加密、路由、插件等
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
      const { initializeWasmModule } = await import("@repo/codec-wasm");
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
  const ScTable = (await import("@repo/components/ScTable/index.vue")).default;
  const ScDialog = (await import("@repo/components/ScDialog/src/index.vue"))
    .default;
  const ScDrawer = (await import("@repo/components/ScDrawer/index.vue"))
    .default;

  // 3. 创建应用实例
  const app = createApp(AppRoot);

  // 4. 获取平台配置（异步）
  const config = await getPlatformConfig(app);

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
    .registerComponent("Auth", Auth)
    .registerComponent("ScTable", ScTable)
    .registerComponent("ScDialog", ScDialog)
    .registerComponent("ScDrawer", ScDrawer);

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

  // 自定义初始化
  if (setup) {
    await bootstrap.useAsync(async (app) => {
      await setup(app, config);
    });
  }

  return bootstrap;
}
