/**
 * 框架上下文装配（AI 控制台）
 *
 * 本应用保留自己的 Vue 外壳（App.vue / vue-router / pinia / element-plus），
 * 只借用 @repo/core 的 createApp 完成框架级基础能力：
 *   ① wasm 加密模块 ② app.yaml 统一配置 ③ 框架 storage ④ token 管理器
 *   ⑤ 带鉴权拦截器的 http 客户端（Bearer 注入 / 401·403 跳登录 / 统一提示 / 重试）
 * createApp 内部会调用 setDefaultHttpInstance，因此 @repo/utils 的 createHttp()
 * 在全应用共享同一条请求管线——业务侧不允许再自建 axios 实例或 fetch。
 *
 * createApp 生成的 router（框架远程菜单路由）本应用不使用，路由守卫见 main.js。
 */
import { createApp } from '@repo/core';
import type { AppContext } from '@repo/core';
import { getClientId } from '@/utils/clientId';
import {
  clearAllAuthData,
  createHttp,
  getAccessToken,
  getDefaultHttpInstance,
  setAccessToken,
  setUserInfo,
  getUserInfo,
} from '@repo/utils';
import type {
  AxiosInstance,
  ChainableRequest,
  Http,
  RequestBody,
  SseClient,
  SseClientOptions,
} from '@repo/utils';

/** 请求选项：只暴露本项目实际用到的字段，业务侧不需要了解 axios 配置 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  timeout?: number;
  /** 是否触发全局 loading（默认走框架配置） */
  loading?: boolean;
  /** 失败时是否静默（不弹统一提示） */
  noToast?: boolean;
  /**
   * 失败时不打 console。
   *
   * 只给「后端可能还没上线、失败本就是预期」的可选端点用（如会话目标），
   * 普通业务请求不要开——那会把真正的故障藏起来。
   */
  silent?: boolean;
  /** 上传进度回调 */
  onUploadProgress?: (event: { loaded: number; total?: number }) => void;
}

/** axios 风格客户端：全部委托给 @repo/utils 的链式 Http，返回已解包的业务数据 */
export interface HttpClient {
  request(endpoint: string, options?: RequestOptions): Promise<any>;
  get(url: string, options?: RequestOptions): Promise<any>;
  post(url: string, data?: unknown, options?: RequestOptions): Promise<any>;
  put(url: string, data?: unknown, options?: RequestOptions): Promise<any>;
  patch(url: string, data?: unknown, options?: RequestOptions): Promise<any>;
  delete(url: string, options?: RequestOptions): Promise<any>;
  sse<T = unknown>(
    url: string,
    options?: Omit<SseClientOptions<T>, 'method' | 'headers' | 'body'> & {
      method?: 'GET' | 'POST';
      headers?: Record<string, string>;
      body?: unknown;
    },
  ): SseClient;
}

/** 解包后端统一响应 {code,data,msg}：命中则取 data，其它形态原样返回 */
export function unwrapBody(body: unknown): unknown {
  if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
    return (body as { data: unknown }).data;
  }
  return body;
}

let context: AppContext | null = null;

/** 启动框架上下文（幂等：重复调用复用同一实例） */
export async function bootstrapFramework(): Promise<AppContext> {
  if (context) return context;
  context = await createApp({ appName: 'vue-support-ai-starter', routerMode: 'history' });
  return context;
}

/**
 * 内嵌宿主平台时采用宿主已装配的框架上下文。
 *
 * <p>独立运行（ai-guada）由 main.js 调 {@link bootstrapFramework} 自装配；
 * 内嵌进系统平台等宿主时，宿主 createApp 已装配好同一条请求管线（wasm 加解密、
 * 第一方请求头、Bearer 注入、401 处理、统一提示、loading），本模块直接采用——
 * 二次装配会另起一套 token/storage 各写各的，wasm 与远端配置也要拉两遍。</p>
 *
 * <p>幂等：context 已有值时不覆盖（先 bootstrap 后 adopt 的调用顺序也安全）。</p>
 */
export function adoptContext(ctx: AppContext): void {
  if (context) return;
  context = ctx;
}

/** 未装配时统一报错：所有请求出口都必须晚于 bootstrapFramework() */
function requireReady(): AppContext {
  if (!context) {
    throw new Error('[ai-guada] 请求模块未装配，请先 await bootstrapFramework()');
  }
  return context;
}

/**
 * 解析请求实例：优先 pages/ai 自己的上下文，其次宿主注入的全局默认实例。
 *
 * <p>内嵌宿主时宿主 createApp 在装配阶段就 setDefaultHttpInstance（与
 * context.http 是同一个 axios 实例，见 packages/core createApp.ts），
 * 早于任何路由渲染。内嵌页（如 ModelsPage）经懒加载路由挂载，其 onMounted
 * 可能早于宿主 main.ts 的 .then(adopt) 执行——2026-10-14 实测该竞态会让
 * 请求抛「请求模块未装配」。故 context 缺失时直接回退宿主管线，不再依赖
 * adopt 的调用时机；两者都缺失（独立运行且尚未 bootstrap）才抛原错误。</p>
 */
function resolveHttpInstance(): AxiosInstance {
  if (context) {
    return context.http.getInstance();
  }
  const host = getDefaultHttpInstance();
  if (host) {
    return host;
  }
  throw new Error('[ai-guada] 请求模块未装配，请先 await bootstrapFramework()');
}

/**
 * 基于框架请求管线创建指定 baseURL 的客户端。
 *
 * 每次调用都新建 Http（成本极低），因此 createApp 之后热更新实例、Electron 动态端口
 * 都能立刻生效；headers 用于附带本应用自己的公共请求头。
 */
export function httpAt(baseUrl: string, headers?: Record<string, string>, timeout = 60000): Http {
  return createHttp({
    baseUrl,
    useAppConfig: false,
    timeout,
    headers,
    instance: resolveHttpInstance(),
  });
}

/** 把链式 Http 包装成 axios 风格客户端（url 走各自 baseURL 拼接规则） */
export function createClient(getHttp: () => Http, options: { unwrap?: boolean } = {}): HttpClient {
  const unwrap = options.unwrap !== false;
  const build = (method: NonNullable<RequestOptions['method']>, url: string, options: RequestOptions = {}): ChainableRequest => {
    const client = getHttp();
    const builder =
      method === 'POST' ? client.post(url)
        : method === 'PUT' ? client.put(url)
          : method === 'PATCH' ? client.patch(url)
            : method === 'DELETE' ? client.delete(url)
              : client.get(url);
    if (options.params) builder.query(options.params);
    if (options.headers) builder.headers(options.headers);
    if (options.responseType) builder.responseType(options.responseType);
    if (options.timeout !== undefined) builder.timeout(options.timeout);
    if (options.loading !== undefined) builder.loading(options.loading);
    if (options.noToast !== undefined) builder.noToast(options.noToast);
    if (options.onUploadProgress) builder.uploadProgress(options.onUploadProgress);
    if (options.data !== undefined) builder.data(options.data as RequestBody);
    return builder;
  };

  const send = (method: NonNullable<RequestOptions['method']>, url: string, options: RequestOptions = {}): Promise<any> =>
    build(method, url, options)
      .then((res) => {
        const body = res?.data;
        return unwrap ? unwrapBody(body) : body;
      })
      .catch((e: unknown) => {
        // HTTP 非 2xx（如登记 500）时 axios 抛「Request failed with status code 500」，
        // 后端真实 msg 在 e.response.data 里 —— 不替换的话页面只能看到笼统状态码，
        // 无法区分「模型没加载」「图片解码失败」「后端 5xx 抖动」等实际原因。
        const err = e as { response?: { data?: unknown }; message?: string };
        const respData = err?.response?.data;
        let backendMsg: unknown;
        if (respData && typeof respData === 'object') {
          const obj = respData as { msg?: unknown; message?: unknown; error?: unknown };
          backendMsg = obj.msg ?? obj.message ?? obj.error;
        } else if (typeof respData === 'string' && respData.trim()) {
          backendMsg = respData;
        }
        if (backendMsg) {
          const wrapped = new Error(String(backendMsg)) as Error & {
            status?: number;
            code?: unknown;
            response?: unknown;
            cause?: unknown;
          };
          const status = (e as { response?: { status?: number } }).response?.status;
          if (status !== undefined) wrapped.status = status;
          wrapped.cause = e;
          throw wrapped;
        }
        throw e;
      });

  return {
    request: (endpoint, options = {}) =>
      send(options.method ?? 'GET', endpoint, options),
    get: (url, options = {}) => send('GET', url, options),
    post: (url, data, options = {}) => send('POST', url, { ...options, data }),
    put: (url, data, options = {}) => send('PUT', url, { ...options, data }),
    patch: (url, data, options = {}) => send('PATCH', url, { ...options, data }),
    delete: (url, options = {}) => send('DELETE', url, options),
    sse: (url, options = {}) => {
      const { method = 'POST', headers, body, ...rest } = options;
      return getHttp().createSse(url, {
        ...rest,
        method,
        headers: headers ?? {},
        body: body as RequestBody,
      });
    },
  };
}

/** /v2 业务接口客户端（复用框架带鉴权拦截器的实例，显式携带 /v2 前缀） */
export function v2Http(): Http {
  return httpAt('/v2', { 'X-Client-Id': getClientId() });
}

/** 根路径客户端（/api/** 管理类接口，后端控制器不在 /v2 前缀下） */
export function rootHttp(): Http {
  return httpAt('', { 'X-Client-Id': getClientId() });
}

/** /v2 业务接口：全应用统一入口，禁止再自建 axios 实例或 fetch */
export const api = createClient(v2Http);

/** 根路径管理接口（/api/**）：同上，仅 baseURL 不同 */
export const adminApi = createClient(rootHttp);

/** 当前登录令牌（框架 storage，key = tokenConfig.accessTokenKey） */
export function currentToken(): string {
  return getAccessToken();
}

/** 是否已登录 */
export function hasToken(): boolean {
  return Boolean(getAccessToken());
}

/** 保存登录态：令牌与用户信息统一写入框架 storage */
export function saveAuth(token: string, userInfo: Record<string, unknown>): void {
  setAccessToken(token);
  setUserInfo(userInfo);
}

/** 清除登录态（令牌、用户信息、菜单/布局缓存） */
export function clearAuth(): void {
  clearAllAuthData();
}

/** 读取框架 storage 中的当前用户信息 */
export function cachedUserInfo<T = Record<string, unknown>>(): T | null {
  return getUserInfo<T>();
}
