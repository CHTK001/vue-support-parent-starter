/**
 * @repo/app —— React 实现：createReactApp
 *
 * 复用 core 装配层（crypto/config/storage/token/http）与框架无关逻辑（shared.ts），
 * 渲染层使用 React 19 createRoot + react-router-dom。
 *
 * 业务入口只需声明「要什么」：
 *   await createReactApp({ appName: "ai", framework: "react" })
 *     .routes(routeTree)   // react-router 路由表（含布局）
 *     .root(RootComponent) // React 根组件（挂载到 #root）
 *     .mount("#root");
 */
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { RouterProvider, createBrowserRouter, type RouteObject } from "react-router-dom";
import { getConfig } from "@repo/config";
import { getAccessToken } from "@repo/utils";
import { checkRouteAccess, applyDocumentTitle } from "@repo/core";
import { assembleCore, applyTitle, buildMenuFromRoutes, kickOffFingerprint, hideAppLoader, applyLoaderDeployPolicy } from "./shared";
import type { AppInstance, CreateAppOptions } from "./types";

/** React 实现挂载完成后的完整实例 */
export interface ReactAppInstance extends AppInstance {
  /** React 根实例 */
  root: Root;
  /** 生成的 react-router 实例（selfContained 模式下业务自带路由，此项为空） */
  router?: ReturnType<typeof createBrowserRouter>;
}

/** React 实现特有的启动选项 */
export interface CreateReactAppOptions extends CreateAppOptions {
  /** 挂载到 #root 前的 React 根组件包装器（可选；用于注入全局 Provider） */
  wrapRoot?: (element: React.ReactElement) => React.ReactElement;
  /**
   * 自包含渲染器模式：跳过 core 装配与 react-router，直接渲染 root 组件。
   *
   * 适用场景：渲染器自带完整 Provider 栈与路由（内含 AuthProvider/ThemeProvider/
   * 自研 HashRouter 等），业务侧只需
   * `createContextApp({ framework: "react", selfContained: true }).root(<App/>).mount("#app")`。
   * 开启后 createReactApp 仅负责 createRoot + 挂载 + 隐藏加载动画。
   */
  selfContained?: boolean;
}

/** 默认挂载节点 */
const DEFAULT_MOUNT_EL = "#root";

/** React 应用构建器：收集 routes / root，统一装配挂载 */
export class ReactAppBuilder {
  private routeTree: RouteObject[] = [];
  private rootComponent?: React.ReactElement;

  constructor(private options: CreateReactAppOptions = {}) {}

  /** 注册 react-router 路由表 */
  routes(tree: RouteObject[]): this {
    this.routeTree.push(...tree);
    return this;
  }

  /** 设置 React 根组件（渲染到路由之外，含全局布局/Provider） */
  root(element: React.ReactElement): this {
    this.rootComponent = element;
    return this;
  }

  /** 启动：装配 core → 创建 react-router → 渲染 */
  async mount(mountEl: string = DEFAULT_MOUNT_EL): Promise<ReactAppInstance> {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
    const {
      appName = env.VITE_APP_NAME,
      configUrl,
      title,
      wrapRoot,
      selfContained,
      ...coreOptions
    } = this.options;

    // 自包含渲染器模式：渲染器自带完整 Provider 栈 + 路由，
    // 跳过 core 装配与 react-router，直接挂载 root 组件，避免双路由/双装配冲突。
    if (selfContained) {
      if (!this.rootComponent) {
        throw new Error("[createReactApp] selfContained 模式必须通过 .root() 提供根组件");
      }
      let element: React.ReactElement = this.rootComponent;
      if (wrapRoot) {
        element = wrapRoot(element);
      }

      // 浏览器指纹（后台生成，写入 storage 供请求头校验；失败不影响启动）
      kickOffFingerprint();

      const host = typeof document !== "undefined" ? document.querySelector(mountEl) : null;
      if (!host) {
        throw new Error(`[createReactApp] 挂载节点不存在: ${mountEl}`);
      }
      const root = createRoot(host as HTMLElement);
      root.render(element);
      hideAppLoader();

      return {
        context: {} as never,
        isReact: true,
        root,
        dispose: () => {
          root.unmount();
        },
      };
    }

    // ① core 装配基础上下文（React 侧跳过 vue-router / pinia 动态路由）
    const { context } = await assembleCore({ appName, configUrl, isReact: true, ...coreOptions });

    // ①.5 页面标题覆盖
    applyTitle(context, title);

    // ①.6 加载动画的部署侧接管（app.yaml other.loaderConfig）：
    // 与 Vue 侧同一入口 —— 锁定态写 localStorage，下次刷新首屏一致（首屏脚本先于配置执行）。
    applyLoaderDeployPolicy();

    // ② 创建 react-router（基于 context.config.route 生成基础守卫路由）
    const router = createBrowserRouter(this.buildRoutes());

    // ③ 构造 React 渲染树
    let element: React.ReactElement = React.createElement(RouterProvider, { router });
    if (this.rootComponent) {
      element = React.createElement(
        React.Fragment,
        null,
        this.rootComponent,
        element
      );
    }
    if (wrapRoot) {
      element = wrapRoot(element);
    }

    // ⑤.5 浏览器指纹
    kickOffFingerprint();

    // ⑥ 挂载 + 隐藏加载动画
    const host = typeof document !== "undefined" ? document.querySelector(mountEl) : null;
    if (!host) {
      throw new Error(`[createReactApp] 挂载节点不存在: ${mountEl}`);
    }
    const root = createRoot(host as HTMLElement);
    root.render(element);
    hideAppLoader();

    return {
      context,
      isReact: true,
      router,
      root,
      dispose: () => {
        root.unmount();
        context.disposeSecurity();
      },
    };
  }

  /** 组装 react-router 路由（含登录/首页重定向基础守卫） */
  private buildRoutes(): RouteObject[] {
    const config = getConfig();
    const homePath = config.route.homePath || "/home";
    const loginPath = config.route.loginPath || "/login";

    // 每个路由的 loader：与 Vue 版共用 checkRouteAccess 做鉴权决策
    const guardLoader = (target: { path: string; title?: string; roles?: string[]; perms?: string[] }) =>
      async () => {
        const decision = checkRouteAccess(target, {
          getAccessToken: () => {
            try {
              return getAccessToken() ?? "";
            } catch {
              return "";
            }
          },
        });
        if (decision.type === "redirect-login") return { redirect: loginPath };
        if (decision.type === "redirect-home") return { redirect: homePath };
        if (decision.type === "redirect-forbidden") return { redirect: config.route.forbiddenPath || "/403" };
        if (decision.title) {
          applyDocumentTitle(decision.title, config.app.title);
        }
        return null;
      };

    const fallbackElement = React.createElement(
      "div",
      { style: { padding: 48, textAlign: "center" } },
      "404 - Not Found"
    );

    const routes: RouteObject[] = [
      // 根路径：按鉴权状态重定向（已登录 → home；未登录 → login）
      {
        path: "/",
        loader: guardLoader({ path: homePath }),
        element: React.createElement("div", null, "createReactApp"),
        children: this.routeTree,
      },
      // 登录页：已登录重定向首页（业务可在 routeTree 中覆盖 /login）
      {
        path: loginPath,
        loader: guardLoader({ path: loginPath }),
        element: React.createElement("div", null, "Login"),
      },
      // 兜底
      {
        path: "*",
        element: fallbackElement,
      },
    ];
    return routes;
  }
}

/** 入口：createReactApp(options).root(<App/>).mount("#root") */
export function createReactApp(options: CreateReactAppOptions = {}): ReactAppBuilder {
  return new ReactAppBuilder(options);
}
