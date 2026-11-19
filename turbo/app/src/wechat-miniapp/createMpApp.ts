/**
 * @repo/app/wechat-miniapp —— 小程序应用装配入口
 * （{@code createContextApp({ platform: "wechat-miniapp" })} 的实现）
 *
 * <p>装配语义与 PC 完全一致：storage → token → http/sse → unwrap → 注入上下文；
 * 底层全部换成 uni API（uni storage / uni.request），不依赖
 * localStorage / axios / vue-router / Web Worker。</p>
 *
 * <p>宿主用法（uni-app 入口约定：createApp 必须同步返回 {@code { app }}）：</p>
 * <pre>{@code
 * // src/main.ts
 * import { createContextApp } from "@repo/app";
 *
 * export function createApp() {
 *   return createContextApp({
 *     platform: "wechat-miniapp",
 *     uni,
 *     loginPath: "/pages/login/index",
 *     app: App,
 *     createSSRApp,
 *   }).mountApp();
 * }
 * }</pre>
 *
 * <p>页面里 {@code inject("mpContext")}；非组件代码用 {@link getMpAppContext}，
 * 两者是同一个对象。</p>
 */
import { createMpHttp } from "./platformHttp";
import { createMpSse } from "./platformSse";
import { createMpStorage } from "./platformStorage";
import { createMpTokenManager } from "./platformToken";
import { getUniRuntime, setUniRuntime } from "./uni";
import type {
  CreateMpAppOptions,
  MpAppContext,
  MpHttp,
  MpSse,
  MpResult,
  MpStorage,
  MpTokenManager,
} from "./types";

/**
 * 小程序侧用到的最小 Vue 应用接口（结构化声明）。
 *
 * <p>刻意<b>不 import vue</b>：库内引用 vue 会让宿主有可能解析出第二个 Vue 副本
 * （类型层面也会因版本差异产生无谓冲突）。uni 入口传入的 {@code createSSRApp(App)}
 * 实例在结构上满足本接口。</p>
 */
export interface MpVueApp {
  provide(key: string, value: unknown): unknown;
}

/** 默认后端地址（与 PC 端 AI_API_TARGET 口径一致） */
const DEFAULT_BASE_URL = "http://127.0.0.1:8787";

/**
 * 业务信封解包：成功码 "00000"（后端字符串码）→ data；否则抛出带 msg 的错误。
 *
 * <p>与 PC 端 unwrap 同一口径，兼容 "0" / "200"。</p>
 */
export function unwrapResult<T>(result: MpResult<T> | T): T {
  if (result && typeof result === "object" && "code" in (result as MpResult)) {
    const res = result as MpResult<T>;
    const code = String(res.code ?? "");
    if (code === "00000" || code === "0" || code === "200") {
      return (res.data ?? (res as unknown as T)) as T;
    }
    const error = new Error(res.msg || `请求失败（code=${code}）`) as Error & { code?: string };
    error.code = code;
    throw error;
  }
  return result as T;
}

/** 最近一次装配出的上下文（小程序单实例；热重载时覆盖） */
let activeContext: MpAppContext | null = null;

/**
 * 取当前装配出的应用上下文。
 *
 * <p>给<b>非组件</b>代码（api / service 层）用：组件内仍走 {@code inject("mpContext")}，
 * 两者指向同一个对象。</p>
 *
 * @throws 入口尚未调用 createContextApp 时抛出可读错误
 */
export function getMpAppContext(): MpAppContext {
  if (!activeContext) {
    throw new Error(
      '[@repo/app] 应用上下文未初始化：请先由入口调用 createContextApp({ platform: "wechat-miniapp" })',
    );
  }
  return activeContext;
}

/**
 * 缺省 401 处理：清令牌 + 回登录页。
 *
 * <p>只在传了 {@code loginPath} 且未自定义 {@code onUnauthorized} 时生成；
 * 需要更复杂行为（比如弹窗）时由宿主传 {@code onUnauthorized} 覆盖。</p>
 */
function createLoginRedirect(options: CreateMpAppOptions): (() => void) | undefined {
  const loginPath = options.loginPath;
  if (!loginPath) return undefined;
  return () => {
    activeContext?.token.clearTokens();
    getUniRuntime().reLaunch?.({ url: loginPath });
  };
}

/** 小程序应用构建器（与 PC 的 VueAppBuilder 同一入口形态） */
export class MpAppBuilder {
  /** 平台标识（与 Web 构建器同一个字段，便于运行期判定） */
  readonly platform = "wechat-miniapp" as const;

  private readonly ctx: MpAppContext;

  constructor(private readonly options: CreateMpAppOptions = {}) {
    this.ctx = MpAppBuilder.assemble(options);
  }

  /** 装配 storage / token / http / sse（同步，uni 入口要求 createApp 同步返回） */
  private static assemble(options: CreateMpAppOptions): MpAppContext {
    // 传了 uni 运行时就直接注入，宿主不必再单独调 setUniRuntime()
    if (options.uni) {
      setUniRuntime(options.uni);
    }
    const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const storage: MpStorage = createMpStorage(undefined, options.storage);

    // http / sse 需要 token：用惰性取值打破装配顺序依赖
    let tokenRef: MpTokenManager | null = null;
    const getAccessToken = () => tokenRef?.getAccessToken() ?? "";
    const onUnauthorized = options.onUnauthorized ?? createLoginRedirect(options);

    const http: MpHttp = createMpHttp({
      baseUrl,
      getAccessToken,
      onUnauthorized,
      config: options.request,
    });
    const sse: MpSse = createMpSse({ baseUrl, getAccessToken, onUnauthorized });
    const token = createMpTokenManager(storage, options.token);
    tokenRef = token;

    const ctx: MpAppContext = {
      appName: options.appName ?? "default",
      baseUrl,
      storage,
      token,
      http,
      sse,
      unwrap: unwrapResult,
    };
    // 非组件代码（api / service 层）通过 getMpAppContext() 取到同一个对象
    activeContext = ctx;
    return ctx;
  }

  /**
   * 挂载小程序应用，返回 uni 入口要求的 {@code { app }}。
   *
   * <p>实例由入口传入的 {@code createSSRApp(app)} 创建（本模块不 import vue 运行时，
   * 避免与宿主解析出两个 Vue 副本）；装配好的上下文以 {@code mpContext} 注入根实例。</p>
   */
  mountApp(): { app: MpVueApp } {
    const { app, createSSRApp } = this.options;
    if (!app || !createSSRApp) {
      throw new Error(
        "[@repo/app] mountApp() 需要在 createContextApp({ app, createSSRApp }) 里传入根组件与 createSSRApp",
      );
    }
    const instance = createSSRApp(app) as MpVueApp;
    instance.provide("mpContext", this.ctx);
    return { app: instance };
  }
}

/**
 * 创建小程序应用。
 *
 * @param options 启动选项（appName / baseUrl / storage / token / request / loginPath / uni / app / createSSRApp）
 * @returns 链式构建器；{@code mountApp()} 返回 uni 入口要求的 {@code { app }}
 */
export function createMpApp(options: CreateMpAppOptions = {}): MpAppBuilder {
  return new MpAppBuilder(options);
}
