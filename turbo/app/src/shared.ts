/**
 * @repo/app —— 框架无关的装配核心
 *
 * 被 createVueApp / createReactApp 共同复用：
 *   1. 调 core createApp 装配基础上下文（crypto/config/storage/token/http）
 *   2. 页面标题覆盖（参数 → VITE_* → app.yaml）
 *   3. 路由树 → 静态菜单推导（供 Vue 侧边栏 / React 侧菜单）
 *   4. 浏览器指纹、站内消息等后台能力
 *
 * 本模块不 import 任何框架渲染 API（vue / react 都不直接依赖），
 * 只依赖 @repo/core 的逻辑装配层。
 */
import {
  createApp as createCoreApp,
  initStationMessageAdapter,
  type AppContext,
  type RouteConfigsTable,
} from "@repo/core";
import { bindStationMessageSocket } from "@repo/pinia";
import { setConfig, applyConfig, resolveMenuDefaultIcon, type AppConfig } from "@repo/config";
import { log, ensureFingerprint } from "@repo/utils";

/** 加载动画的部署侧接管：把 app.yaml 的决定落到「下次刷新首屏」用的 localStorage */
export { applyLoaderDeployPolicy } from "@repo/config";

/** core 装配的输入（框架无关） */
export interface CoreAssembleOptions {
  appName?: string;
  configUrl?: string;
  /** React 侧为 true 时，跳过 vue-router / pinia 动态路由等 Vue 专属步骤 */
  isReact?: boolean;
  /** 透传给 core createApp 的其余选项 */
  [key: string]: unknown;
}

/** core 装配结果 */
export interface CoreAssembled {
  context: AppContext;
}

/**
 * 装配 core 基础上下文。
 *
 * React 侧通过 loadRemoteRoutes 空实现避免动态 import @repo/pinia；
 * vue-router 实例仍会被创建（不挂载），因为 core createApp 当前硬编码创建，
 * 但 React 侧不消费 context.router，无害。
 */
export async function assembleCore(options: CoreAssembleOptions = {}): Promise<CoreAssembled> {
  const { appName, configUrl, isReact, ...coreOptions } = options;
  log.info("createContextApp", "assembleCore...", { isReact: !!isReact });

  const context = await createCoreApp({
    appName,
    configUrl,
    // React 侧不拉远程菜单（避免触发 @repo/pinia 的动态路由逻辑）
    ...(isReact ? { loadRemoteRoutes: async () => {} } : {}),
    ...coreOptions,
  });
  log.info("createContextApp", "assembleCore OK", { title: context.config?.app?.title });

  // 站内消息：HTTP 适配器 + Socket 推送绑定（均不阻塞初始化）
  try {
    const queryEnabled = context.config.message.query ?? context.config.app.openAuth;
    if (queryEnabled) {
      initStationMessageAdapter();
    }
  } catch {
    // 站内消息接口未就绪：降级为仅实时推送
  }
  if (!isReact) {
    void bindStationMessageSocket();
  }

  return { context };
}

/** 页面标题覆盖（参数 → VITE_WEB_TITLE → VITE_APP_TITLE → app.yaml） */
export function applyTitle(
  context: AppContext,
  title?: string
): void {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
  const finalTitle = title ?? env.VITE_WEB_TITLE ?? env.VITE_APP_TITLE ?? context.config.app.title;
  if (finalTitle) {
    applyConfig({ app: { ...context.config.app, title: finalTitle } } as Partial<AppConfig>);
  }
}

/** 浏览器指纹（后台生成，写入 storage 供请求头校验） */
export function kickOffFingerprint(): void {
  void ensureFingerprint().catch(() => {
    // 指纹生成失败不影响启动
  });
}

/**
 * 从路由树推导侧边栏菜单（Vue 侧边栏 / React 菜单共用）：
 *   - 保留 path/name/redirect/meta/children 层级
 *   - 剥掉 component
 *   - 路由树未含首页时补默认首页入口
 */
export interface AppMenuNode {
  path: string;
  name?: string;
  redirect?: string;
  meta: Record<string, unknown>;
  children?: AppMenuNode[];
}

export function buildMenuFromRoutes(
  routes: RouteConfigsTable[],
  homePath: string,
  hideBusiness = false
): AppMenuNode[] {
  const menu = routes.map((r) => toMenuNode(r, hideBusiness));
  if (!menu.some((item) => item.path === homePath)) {
    menu.unshift({
      path: "/",
      name: "layout",
      redirect: homePath,
      meta: { title: "menu.home.auth", icon: "koi-home", isVisible: "1" },
      children: [
        { path: homePath, name: "homePage", meta: { title: "menu.home.work.name", icon: "koi-work", isVisible: "1" } },
      ],
    });
  }
  return menu;
}

function toMenuNode(route: RouteConfigsTable, hideBusiness = false): AppMenuNode {
  const meta = (route.meta ?? {}) as Record<string, unknown>;
  const isVisible = meta.showLink === false ? "0" : "1";
  // 远程菜单模式（remote）：业务路由仅注册 URL 供直接访问/兜底，不显示在侧边栏
  // （菜单以后端 /v2/user/menu 为准）；remind 使 getShowStaticAndDynamicMenuList 过滤掉它。
  const nextMeta: Record<string, unknown> = {
    ...meta,
    icon: meta.icon || resolveMenuDefaultIcon(),
    isVisible,
  };
  if (hideBusiness) nextMeta.remind = true;
  return {
    path: route.path,
    name: typeof route.name === "string" ? route.name : undefined,
    redirect: typeof route.redirect === "string" ? route.redirect : undefined,
    meta: nextMeta,
    children: route.children?.length ? route.children.map((c) => toMenuNode(c, hideBusiness)) : undefined,
  };
}

/** 隐藏公共 index.html 注入的全屏加载动画 */
export function hideAppLoader(): void {
  const hide = (window as unknown as { hideAppLoader?: () => void }).hideAppLoader;
  if (typeof hide === "function") {
    hide();
  }
}

/** 等待下一帧绘制（SSR / 无 rAF 环境立即返回） */
function nextPaintFrame(): Promise<void> {
  if (typeof requestAnimationFrame !== "function") return Promise.resolve();
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * 等到「首帧业务内容真正画出来」再收首屏遮罩。
 *
 * <p>为什么不能 mount 完就收：{@code app.mount()} 只保证根组件挂上了，
 * 首次路由导航（含异步路由组件的 chunk）可能还没完成 —— 这时撤掉遮罩，
 * 用户看到的就是一整片白（本仓库实测踩过）。</p>
 *
 * <p>顺序：路由 ready（首屏内容已解析）→ 双 rAF（patch 后的 DOM 进入下一帧绘制）
 * → 隐藏。{@code timeoutMs} 是兜底：路由守卫卡住 / chunk 一直不回来时，
 * 宁可露出一半内容也不能让遮罩永久盖住整站。</p>
 *
 * @param options.ready     首个路由是否已就绪（Vue: router.isReady()；React: initialized）
 * @param options.timeoutMs 最长等待时间，默认 10s
 */
export function hideAppLoaderWhenReady(options: {
  ready?: Promise<unknown> | null;
  timeoutMs?: number;
} = {}): void {
  const { ready = null, timeoutMs = 10000 } = options;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  const firstRoute = ready
    ? Promise.resolve(ready).catch(() => undefined)
    : Promise.resolve(undefined);

  void Promise.race([firstRoute, timeout])
    .then(() => nextPaintFrame())
    .then(() => hideAppLoader());
}
