/**
 * @repo/app —— Vue 实现：createVueApp
 *
 * 从原 createContextApp 迁移而来，仅保留 Vue 渲染层；
 * core 装配 / 菜单推导 / 标题覆盖等框架无关逻辑复用 shared.ts。
 */
import { createApp as createVueRootApp, createVNode, render, type App as VueApp, type Plugin, type Component } from "vue";
import { Icon as IconifyIcon } from "@iconify/vue";
import { registerBuiltinIcons } from "./icons/builtinIcons";
import type { Pinia } from "pinia";
import type { I18n } from "vue-i18n";
import koiI18n from "@repo/languages";
import koiPinia, { getStaticMenu, registerStaticMenu, type StaticMenuItem } from "@repo/pinia";
import {
  waitForBaseRoutes,
  registerDynamicRoutes,
  shouldSeedMenuAtStartup,
  type AppContext,
  type RouteConfigsTable,
} from "@repo/core";
import { getConfig } from "@repo/config";
import { getAccessToken, log } from "@repo/utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { resolveThemeInstaller } from "@repo/theme";
import { getGlobalSocketService, provideGlobalSocketService } from "@repo/core";
import useAuthStore from "@repo/pinia/modules/auth";
import useGlobalStore from "@repo/pinia/modules/global";
import { assembleCore, applyTitle, buildMenuFromRoutes, kickOffFingerprint, hideAppLoader, applyLoaderDeployPolicy } from "./shared";
import AppWithRouter from "./AppWithRouter.vue";
import SingleApp from "./SingleApp.vue";
import type { AppInstance, CreateAppOptions } from "./types";
import type { AppContribution } from "./contributions";

/** 主题安装器：由具体主题实现，负责注册 element-plus / 组件 / 指令 / provide UI 上下文 */
export type AppInstaller = (
  app: VueApp,
  context: AppContext
) => void | Promise<void>;

/** Vue 实现特有的启动选项 */
export interface CreateVueAppOptions extends CreateAppOptions {
  /** 主题安装器（可选；缺省按 getConfig().other.themeId 自动解析） */
  install?: AppInstaller;
  /**
   * 应用扩展安装器（可选）：在主题安装器执行完成后运行，语义为「追加」而非替换。
   *
   * <p>典型用法：应用只声明自身增量（按需注册 Re* 组件、挂载应用特有宿主等），
   * 主题交给 {@link install} 的缺省自动解析——既不用在 main.ts 引主题安装器，
   * 也不会因替换掉自动安装器而丢失其自带行为（router 守卫、菜单兜底）。</p>
   */
  extend?: AppInstaller;
  /**
   * 需要按需安装的 Re* 组件清单（可选）。
   *
   * <p>交给内部 {@code installUi} 安装，宿主无需在 main.ts 引 {@code @repo/ui}：
   * {@code createContextApp({ ui: { components: ["ReButton", ...] } }).mount("#app")}。
   * 注意 ReIcon / ReScrollNav / ReDrawer 已由 koi 主题安装器先注册，不要再列入。</p>
   *
   * <p>更推荐用 {@link preset} 声明成组的组件清单 —— 清单由组件库内部维护，
   * 宿主只写预设名。</p>
   */
  ui?: { components?: string[]; plugins?: Plugin[]; preset?: string };
  /**
   * 全局浮层宿主组件（可选）：挂载到 {@code <body>} 下，共享主 app 的 context。
   *
   * <p>用于如「全局过程任务浮层」这类独立于布局的宿主。链式写法：
   * {@code createContextApp({..., host: ProcessHost}).mount("#app")}，
   * 宿主不再需要自己 {@code createVNode + render + document.body.appendChild}。</p>
   */
  host?: Component | Array<Component | { component: Component; [key: string]: unknown }>;
  /** 兼容旧名的别名：{@link host} 的同义词（复数形式） */
  hosts?: Component | Array<Component | { component: Component; [key: string]: unknown }>;
  /** 自定义 pinia 实例（默认使用 @repo/pinia 持久化实例） */
  pinia?: Pinia;
  /** 自定义 i18n 实例（默认使用 @repo/languages） */
  i18n?: I18n<any>;
}

/** Vue 实现挂载完成后的完整实例 */
export interface VueAppInstance extends AppInstance {
  /** Vue 应用实例 */
  vueApp: VueApp;
  /** pinia 实例 */
  pinia: Pinia;
  /** i18n 实例 */
  i18n: I18n<any>;
}

/** 默认挂载节点 */
const DEFAULT_MOUNT_EL = "#app";

/** Vue 应用构建器：收集 routes / app / plugins / components / css，统一装配挂载 */
export class VueAppBuilder {
  private routesTree: RouteConfigsTable[] = [];
  private appComponent?: Component;
  private plugins: Plugin[] = [];
  private contributions: AppContribution[] = [];
  private components: Array<[string, Component]> = [];
  private cssUrls: string[] = [];
  private uiOptions?: { components?: string[]; plugins?: Plugin[]; preset?: string };
  private hostDescs: Array<Component | { component: Component; [key: string]: unknown }> = [];

  constructor(private options: CreateVueAppOptions = {}) {}

  /** 注册路由树（同时作为侧边栏菜单数据源） */
  routes(tree: RouteConfigsTable[]): this {
    this.routesTree.push(...tree);
    return this;
  }

  /** 设置单页面根组件（仅 mode="single" 时生效） */
  app(component: Component): this {
    this.appComponent = component;
    return this;
  }

  /** 追加 Vue 插件 */
  use(plugin: Plugin | Plugin[]): this {
    const list = Array.isArray(plugin) ? plugin : [plugin];
    this.plugins.push(...list);
    return this;
  }

  /**
   * 登记扩展点贡献（当前用途：各 pages 模块贡献 home widget 目录）。
   *
   * <p>与 {@link routes} 同构 —— 多次调用会累加，在 {@link mount} 中按调用顺序各执行一次
   * {@code register()}。执行时机早于主题安装与 {@code app.mount()}，因此注册的 widget
   * 在首页首次渲染前就已就位（贡献方无需关心加载竞态）。</p>
   *
   * <p>示例：</p>
   * <pre>{@code
   * .widgets([defineWidgetContribution(collectWidgets)])
   * }</pre>
   *
   * <p>单个贡献的 register() 抛错不会中断启动：某个模块的 widget 登记失败不该让
   * 整个 app 起不来（该模块的 widget 会退化成占位卡片，其余功能不受影响）。</p>
   *
   * @param list 贡献列表
   * @returns this
   */
  widgets(list: readonly AppContribution[]): this {
    this.contributions.push(...list);
    return this;
  }

  /** 注册全局组件 */
  component(name: string, component: Component): this {
    this.components.push([name, component]);
    return this;
  }

  /** 引入样式 */
  css(url: string | string[]): this {
    const list = Array.isArray(url) ? url : [url];
    this.cssUrls.push(...list);
    return this;
  }

  /**
   * 按需安装 Re* 组件（链式，内部调 {@code @repo/ui} 的 installUi）。
   *
   * <pre>{@code
   * createContextApp({...}).ui({ components: ["ReButton", "ReTable"] }).routes(...).mount("#app")
   * }</pre>
   *
   * @param options {@link @repo/ui} 的安装选项（components / plugins / preset）
   * @returns this
   */
  ui(options: { components?: string[]; plugins?: Plugin[]; preset?: string } = {}): this {
    this.uiOptions = { ...this.uiOptions, ...options };
    return this;
  }

  /**
   * 挂载全局浮层宿主组件到 {@code <body>}（共享主 app context）。
   *
   * <pre>{@code
   * createContextApp({...}).host(ProcessHost).mount("#app")
   * }</pre>
   *
   * @param host 单个组件，或组件 / { component, ...props } 条目组成的数组
   * @returns this
   */
  host(
    host:
      | Component
      | Array<Component | { component: Component; [key: string]: unknown }>
  ): this {
    const list = Array.isArray(host) ? host : [host];
    this.hostDescs.push(...list);
    return this;
  }

  /** 启动：装配 core → 注册路由/菜单 → 安装主题与扩展 → 挂载 Vue */
  async mount(mountEl: string = DEFAULT_MOUNT_EL): Promise<VueAppInstance> {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
    const {
      appName = env.VITE_APP_NAME,
      configUrl,
      title,
      mode = "router",
      install,
      extend,
      ui,
      host,
      hosts,
      pinia,
      i18n,
      ...coreOptions
    } = this.options;

    // ① core 装配基础上下文
    const { context } = await assembleCore({ appName, configUrl, ...coreOptions });

    // ①.5 页面标题覆盖
    applyTitle(context, title);

    // ①.55 加载动画的部署侧接管（app.yaml other.loaderConfig）：
    // 此刻 getConfig() 已是最终合并结果（默认值 + app.yaml + 远程 + 环境变量）。
    // 锁定态把动画/尺寸/主色写进 localStorage —— 首屏脚本跑在拉配置之前，
    // 当次首屏来不及改，下次刷新才能一致；本次会话内的遮罩与预览立即跟随。
    applyLoaderDeployPolicy();

    // ①.6 路由树 → 侧边栏菜单
    // 业务 main.ts 可在 mount 前注册带 isRemoteFallback 的兜底菜单；已注册时不要覆盖。
    if (mode === "router" && !getStaticMenu().length) {
      // remote 模式：菜单以后端为准，业务路由只注册 URL、不显示为菜单（仅保留首页入口）
      const hideBusiness = context.config.route.mode === "remote";
      registerStaticMenu(
        buildMenuFromRoutes(this.routesTree, context.config.route.homePath || "/home", hideBusiness) as StaticMenuItem[]
      );
    }

    // ② 按 mode 选择根组件
    const RootComponent = mode === "single" ? SingleApp : AppWithRouter;

    // ③ 创建 Vue 实例 + 注册基础插件
    const vueApp = createVueRootApp(RootComponent, {
      ...(mode === "single" ? { page: this.appComponent } : {}),
    });
    const appPinia = pinia ?? koiPinia;
    const appI18n = i18n ?? koiI18n;
    vueApp.use(appPinia);
    vueApp.use(appI18n);

    // ③.2 服务端状态缓存：安装 @tanstack/vue-query。
    // 必须早于任何组件渲染 —— 业务侧 http.get(...).useQuery([...]) 在 setup() 里就要
    // 拿到 QueryClient，缺了它 useQuery 会直接抛「No QueryClient set」。
    // defaultOptions 只给保守的全局默认：staleTime=0（进页面即取最新，与改造前的
    // 「每次进页面都请求」行为一致，避免引入缓存后用户看到旧数据却不知道原因）；
    // 业务要缓存就在各自的 useQuery 里显式传 staleTime。
    // retry=0：重试策略归 @repo/utils 的 http 拦截器管（它按方法白名单 + app.yaml 的
    // retryCount 决策），这里再叠一层会让失败请求被重试两次、耗时翻倍。
    vueApp.use(VueQueryPlugin, {
      queryClient: new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            retry: 0,
            refetchOnWindowFocus: false,
          },
        },
      }),
    });

    // 注册全局 Iconify 渲染器
    const win = (typeof window !== "undefined" ? window : (globalThis as unknown as Window)) as unknown as {
      __reIcon?: { iconify?: Component };
    };
    if (win) {
      const reg = win.__reIcon ?? {};
      reg.iconify = IconifyIcon;
      win.__reIcon = reg;
    }
    // 开关默认两态图标离线内置（不依赖 Iconify 在线接口，见 icons/builtinIcons.ts）
    registerBuiltinIcons();

    // ③.0 同步持久化语言到 i18n locale
    const globalStore = useGlobalStore(appPinia);
    if (globalStore.language) {
      (appI18n.global.locale as any).value = globalStore.language;
    }

    // ③.1 provide 全局 Socket 服务
    const globalSocket = getGlobalSocketService();
    if (globalSocket) {
      provideGlobalSocketService(vueApp, globalSocket);
    }

    // ④ 解析主题安装器
    const installer = install ?? (await resolveThemeInstaller(context.config.other.themeId));

    // ④.2 应用扩展点贡献：必须早于主题安装与 app.mount()，

    // ④.2 应用扩展点贡献：必须早于主题安装与 app.mount()，
    // 否则首页可能先渲染出「模块未注册」的占位卡片再被替换（可见闪烁）
    for (const contribution of this.contributions) {
      try {
        contribution.register();
      } catch (error: unknown) {
        // 单个贡献失败不应让整个 app 起不来：它的 widget 会退化成占位卡片，其余功能不受影响
        log.error("createVueApp", `扩展点贡献注册失败（${contribution.namespace}）`, error);
      }
    }

    if (mode === "router") {
      // ④.5 等待基础路由注册完成
      await waitForBaseRoutes(context.router);
      // ④.6 把业务路由挂到 layout 之下
      registerRoutesUnderLayout(context.router, this.routesTree);
      // ④.7 初始化菜单 + 动态路由 + 用户信息。
      // 判定收敛在 shouldSeedMenuAtStartup（见 core/router/menuSeed.ts）：
      //   - openAuth=false：无登录流程，启动即灌（历史行为）；
      //   - openAuth=true 且 route.mode=static/module 且启动时已持令牌：整页刷新直接进
      //     目标路由，登录流程与守卫都不会跑，不在这里灌一次侧边栏就永远是空壳
      //     （实测症状「左侧菜单有时加载不出来」，只有手动点顶栏刷新才出现）；
      //   - remote/all：菜单归守卫的 loadRemoteRoutes 所有，这里插手会重复拉取。
      //     无令牌的 static 应用不在这里灌：守卫马上会把用户弹去登录页，
      //     登录成功后由 initAuthRouter 灌入。
      if (
        shouldSeedMenuAtStartup({
          openAuth: context.config.app.openAuth,
          routeMode: context.config.route.mode,
          hasToken: Boolean(getAccessToken()),
        })
      ) {
        await initMenusAtStartup(context);
      }
      vueApp.use(context.router);
    } else {
      vueApp.provide("app-has-router", false);
    }

    // ⑤ 主题安装（install 替换语义 / 缺省按 themeId 自动解析）+ 应用扩展（extend 追加语义，主题之后执行）
    if (installer) {
      await installer(vueApp, context);
    }
    if (extend) {
      await extend(vueApp, context);
    }

    // ⑤.0 链式 ui：按需安装 Re* 组件（合并 options.ui 与 .ui() 调用）
    const uiComponents =
      this.uiOptions?.components ?? ui?.components;
    const uiPlugins =
      this.uiOptions?.plugins ?? ui?.plugins;
    const uiPreset =
      this.uiOptions?.preset ?? ui?.preset;
    if (uiComponents?.length || uiPlugins?.length || uiPreset) {
      const { installUi, preloadUiLayouts } = await import("@repo/ui");
      await installUi(vueApp, {
        components: uiComponents ?? [],
        plugins: uiPlugins ?? [],
        preset: uiPreset,
      });
      // 预热组件内部的懒加载布局（弹窗 / 下拉 / 抽屉的布局），消除首次打开卡顿。
      // 只在确实装了 Re* 组件时才有意义（没装就不存在首次打开的场景）。
      preloadUiLayouts();
    }

    // ⑤.1 链式追加：use / component / css
    for (const plugin of this.plugins) {
      const installed = plugin as Plugin & { install?: (app: VueApp) => unknown };
      if (typeof installed.install === "function") {
        const result = installed.install(vueApp);
        if (result instanceof Promise) {
          await result.catch((error) => {
            log.warn("createVueApp", "插件安装失败", error);
          });
        }
      } else if (typeof installed === "function") {
        installed(vueApp);
      }
    }
    for (const [name, component] of this.components) {
      vueApp.component(name, component);
    }
    for (const cssUrl of this.cssUrls) {
      await import(/* @vite-ignore */ cssUrl).catch(() => {
        // 样式引入失败不影响启动
      });
    }

    // ⑤.5 浏览器指纹
    kickOffFingerprint();

    // ⑥ 挂载 + 隐藏加载动画
    if (mountEl) {
      vueApp.mount(mountEl);
      hideAppLoader();
      // ⑥.1 koi 本地 SVG sprite 注入（#icon-koi-*）。
      //
      // 为什么必须放这里而不是在 installKoi 里：installKoi 在 app.use(router) 之前
      // 同步执行，此时 <body> 尚未就绪；而 @repo/assets 的 setupSvgSprite 依赖
      // import.meta.glob 在编译期展开 icons/*.svg，若 Vite 依赖预构建把它折叠成空对象，
      // 注入的就是一个空 sprite，此后所有 #icon-koi-* 引用失效 —— 表现就是
      // 菜单缺省图标（koi-text-menu）、面包屑图标、标签页固定图标全部空白，
      // 而 element-plus 图标（Bell / DataBoard 等）正常（它们不走 sprite）。
      // mount 后再调用：document.body 已存在、glob 已展开，幂等（injected 标记防重复）。
      if (typeof document !== "undefined") {
        try {
          const { setupSvgSprite } = await import("@repo/assets");
          setupSvgSprite();
        } catch (error) {
          log.warn("createVueApp", "koi SVG sprite 注入失败", error);
        }
      }
    }

    // ⑥.1 全局浮层宿主：挂到 <body> 下，共享主 app context（独立于布局）。
    // 合并 options.host/hosts 与链式 .host() 传入的宿主列表；app 未挂载 / 非浏览器环境时跳过。
    const hostDescs: Array<Component | { component: Component; [key: string]: unknown }> = [];
    if (host) hostDescs.push(...(Array.isArray(host) ? host : [host]));
    if (hosts) hostDescs.push(...(Array.isArray(hosts) ? hosts : [hosts]));
    hostDescs.push(...this.hostDescs);
    if (hostDescs.length) {
      const appContext = (vueApp as unknown as { _context?: unknown })._context;
      const mountBody = () => {
        for (const desc of hostDescs) {
          const component =
            typeof desc === "object" && "component" in desc
              ? (desc as { component: Component }).component
              : (desc as Component);
          const props =
            typeof desc === "object" && "component" in desc
              ? (desc as { component: Component; [key: string]: unknown })
              : undefined;
          const container = document.createElement("div");
          container.setAttribute("data-process-host", "");
          document.body.appendChild(container);
          const vnode = createVNode(component, props);
          vnode.appContext = appContext as never;
          render(vnode, container);
        }
      };
      if (document.body) {
        mountBody();
      } else {
        // 文档尚未就绪时推迟到 DOMContentLoaded（极少数首帧场景）
        document.addEventListener(
          "DOMContentLoaded",
          () => mountBody(),
          { once: true }
        );
      }
    }

    return {
      vueApp,
      context,
      pinia: appPinia,
      i18n: appI18n,
      isReact: false,
      dispose: () => {
        vueApp.unmount();
        context.disposeSecurity();
      },
    };
  }
}

/** 入口：createVueApp(options).routes(...).mount("#app") */
export function createVueApp(options: CreateVueAppOptions = {}): VueAppBuilder {
  return new VueAppBuilder(options);
}

/** 把路由树扁平化为叶子后挂到 layout 之下 */
function registerRoutesUnderLayout(
  router: AppContext["router"],
  routes: RouteConfigsTable[]
): void {
  const homePath = getConfig().route.homePath || "/home";
  const visit = (list: RouteConfigsTable[]): void => {
    for (const route of list) {
      if (route.component) {
        if (!router.hasRoute(String(route.name ?? route.path))) {
          const meta = (route.meta ?? {}) as Record<string, unknown>;
          // meta.standalone / meta.remind：注册为顶层路由（不套 layout）。
          //
          // standalone 是独立全屏页的既有机制（如弹出远控）；
          // remind 语义是「只注册路由、不进菜单、不受菜单导航控制」，
          // 页面本身也不该落在后台框架里。两者统一走顶层 addRoute，
          // 由根 router-view 直接渲染组件，而不是先挂 layout 再靠 CSS 隐藏外壳。
          if (meta.standalone || meta.remind) {
            router.addRoute(route as never);
          } else {
            router.addRoute("layout", route as never);
          }
        }
        // 主题首页按 homePath 注册，同路径下先注册者赢；业务路由占了首页路径就要摘掉主题 home，
        // 否则应用自己的落地页永远不会被渲染。
        if (route.path === homePath && router.hasRoute("home")) {
          router.removeRoute("home");
        }
      }
      if (!route.component && route.redirect) {
        if (!router.hasRoute(String(route.name ?? route.path))) {
          router.addRoute("layout", route as never);
        }
      }
      if (route.children?.length) {
        visit(route.children);
      }
    }
  };
  visit(routes);
}

/**
 * 启动时初始化菜单：拉取菜单列表 + 注册动态路由 + 恢复当前用户信息。
 *
 * <p>调用时机由 {@link shouldSeedMenuAtStartup} 决定：openAuth=false（无登录流程），
 * 或 openAuth=true 的 static/module 应用带令牌整页刷新。remote/all 模式不走这里。</p>
 *
 * <p>openAuth=false 表示认证由后端会话/网关承担，前端可能没有 accessToken，但
 * /v2/user/menu 与 /me 依然可由后端 Principal 正常鉴权。不能因为本地没有 token
 * 就永久跳过远程菜单，否则该模式只渲染静态工作台。listRouters 会在远程失败时回退静态菜单。</p>
 */
async function initMenusAtStartup(context: AppContext): Promise<void> {
  const authStore = useAuthStore();
  const skipRemote = false;
  try {
    // 菜单之外还需恢复当前用户信息 / 角色 / 权限，
    // 否则刷新后 pinia roleList、loginUser、buttonList 为空（指令与右上角展示态缺失）。
    // （static 模式下 listRouters 不发请求，只按本地路由树重建侧边栏菜单。）
    const tasks: Promise<unknown>[] = [
      authStore.listRouters({ skipRemote }),
      authStore.getLoginUserInfo(false),
    ];
    await Promise.allSettled(tasks);
    registerDynamicRoutes(context.router, authStore.menuList, "layout");
  } catch (error) {
    console.error("[app] 启动期菜单 / 用户信息初始化失败", error);
  }
}
