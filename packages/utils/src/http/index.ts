/**
 * HTTP 请求模块
 * 基于 Axios 封装，支持拦截器、SSE、请求取消等功能
 * @author CH
 * @version 2.0.0
 * @since 2025-12-03
 */
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { isObject } from "@pureadmin/utils";
import {
  formatToken,
  getConfig,
  getToken,
  handRefreshToken,
  logOut,
  upgrade,
} from "@repo/config";
import { UserResult } from "@repo/core";
import { getLogger } from "../log";
import Axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import NProgress from "nprogress";
import { transformI18n } from "../../../config/src/i18n";
import { uu1, uu2 } from "../crypto/codec";
import type {
  PureHttpError,
  PureHttpRequestConfig,
  PureHttpResponse,
  RequestMethods,
} from "../http/types";
import { message } from "../message";
import { initializeWasmModule, isWasmLoaded } from "@repo/codec-wasm";
import {
  getRequestConfig,
  getErrorHandlerConfig,
  defaultConfig,
  WHITE_LIST,
  isNoAuth,
  isSuccess,
} from "./request-config";
import { getOrCreateFingerprint } from "./fingerprint";
import { reportErrorToServer } from "./error-handler";
import { generateNonce, generateSign } from "./sign";

const logger = getLogger("[HTTP]");

/** 响应结果类型 */
export interface ReturnResult<E> {
  code: string | number;
  msg: string;
  message: string;
  data: E;
  headers?: any;
  success: boolean;
}

/** 分页结果类型 */
export interface PageResult<T> {
  code: string | number;
  msg: string;
  message: string;
  data: {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;
  };
  success: boolean;
}

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = true;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 存储活跃的请求控制器 */
  private static activeRequests = new Map<string, AbortController>();

  /** 复用 WASM 初始化，避免首批请求并发抢跑 */
  private static wasmReadyPromise: Promise<void> | null = null;

  private static async ensureWasmReady(): Promise<void> {
    if (isWasmLoaded()) {
      return;
    }

    if (getConfig("wasmEnable") === false) {
      return;
    }

    if (!PureHttp.wasmReadyPromise) {
      PureHttp.wasmReadyPromise = initializeWasmModule()
        .then((result) => {
          if (!result || !isWasmLoaded()) {
            throw new Error("WASM 模块初始化失败");
          }
        })
        .finally(() => {
          if (!isWasmLoaded()) {
            PureHttp.wasmReadyPromise = null;
          }
        });
    }

    await PureHttp.wasmReadyPromise;
  }

  /**
   * 确保 x-nonce、x-sign 等安全头存在
   * 根据配置 Request.enableSign 决定是否生成签名
   * WASM 未加载时会使用降级实现（codec-wasm 的 JS 实现）
   */
  private static async ensureXSign(
    config: PureHttpRequestConfig,
  ): Promise<void> {
    if (!config.headers) {
      config.headers = {};
    }
    // 检查配置是否开启签名
    const requestConfig = getRequestConfig();
    if (requestConfig.enableSign === false) {
      if (process.env.NODE_ENV === "development") {
        logger.debug("[HTTP][签名生成] 签名功能已关闭，跳过生成");
      }
      return;
    }

    await PureHttp.ensureWasmReady();

    // 默认开启签名（enableSign 为 true 或 undefined）
    const timestamp = Date.now();
    const nonce = generateNonce();
    config.headers["x-timestamp"] = timestamp.toString();
    config.headers["x-nonce"] = nonce;
    // 按约定直接使用 getOrCreateFingerprint 获取（避免从 headers 读回导致 number 等脏值透传）
    const fingerprint = getOrCreateFingerprint();
    // 确保指纹头一定存在，否则后端 hasSignHeaders 会直接判定不完整并跳过/拒绝
    config.headers["x-req-fingerprint"] = fingerprint;
    const sign = generateSign(config, timestamp, nonce, fingerprint);
    config.headers["x-sign"] = sign || "";
    if (process.env.NODE_ENV === "development") {
      logger.debug("[HTTP][签名生成] 安全头已设置 {}", {
        url: config.url,
        hasSign: !!sign,
        timestamp: config.headers["x-timestamp"],
        nonce: config.headers["x-nonce"],
        wasmLoaded: isWasmLoaded(),
      });
    }
  }

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise((resolve, reject) => {
      PureHttp.requests.push(async (token: string) => {
        try {
          const authorization = formatToken(token);
          if (authorization) {
            config.headers["Authorization"] = authorization;
          }
          if (token) {
            config.headers["x-oauth-token"] = token;
          }
          // 确保 x-sign 一定存在
          await PureHttp.ensureXSign(config);
          resolve(config);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 优先使用 ApiAddress，如果未设置则使用 BaseUrl
        const apiAddress = getConfig().ApiAddress;
        config.baseURL = apiAddress || getConfig().BaseUrl;
        await PureHttp.ensureWasmReady();
        config = await uu2(config);
        // 确保headers对象存在
        if (!config.headers) {
          config.headers = {};
        }
        // 修复：确保headers存在再访问其属性
        const an =
          config.headers["x-remote-animation"] || config.headers["loading"];
        config.headers["x-req-fingerprint"] = getOrCreateFingerprint();

        // 检查是否配置了apiVersion，如果配置了则在URL中添加version参数（必须在生成签名之前）
        const apiVersion = getConfig().apiVersion;
        if (apiVersion) {
          // 确保URL包含版本参数
          if (config.params) {
            config.params.version = apiVersion;
          } else {
            config.params = { version: apiVersion };
          }
        }

        if (an) {
          if (an == "true") {
            // 开启进度条动画
            NProgress.start();
          }
        } else {
          if (getConfig().RemoteAnimation) {
            NProgress.start();
          }
        }
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          // 在所有处理完成后，最后统一生成 sign
          await PureHttp.ensureXSign(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          // 在所有处理完成后，最后统一生成 sign
          await PureHttp.ensureXSign(config);
          return config;
        }
        // 白名单接口直接放行
        if (WHITE_LIST.some((url) => config.url?.endsWith(url))) {
          // 在所有处理完成后，最后统一生成 sign
          await PureHttp.ensureXSign(config);
          return config;
        }
        // 需要 token 验证的接口
        return new Promise((resolve, reject) => {
          void (async () => {
            let data = getToken();
            const openAuth = getConfig().OpenAuth;
            if (!openAuth && !data) {
              data = {} as UserResult;
            }
            if ((openAuth && data) || !openAuth) {
              const now = new Date().getTime();
              const expired =
                ~~data.expires == 0 ? false : ~~data.expires - now <= 0;
              if (expired) {
                if (!PureHttp.isRefreshing) {
                  PureHttp.isRefreshing = true;
                  // token过期刷新
                  handRefreshToken({ refreshToken: data.refreshToken })
                    .then((res) => {
                      const token = res.accessToken;
                      const authorization = formatToken(token);
                      if (authorization) {
                        config.headers["Authorization"] = authorization;
                      }
                      if (token) {
                        config.headers["x-oauth-token"] = token;
                      }
                      PureHttp.requests.forEach((cb) => cb(token));
                      PureHttp.requests = [];
                    })
                    .finally(() => {
                      PureHttp.isRefreshing = false;
                    });
                }
                resolve(PureHttp.retryOriginalRequest(config));
                return;
              }

              const authorization = formatToken(data.accessToken);
              if (authorization) {
                config.headers["Authorization"] = authorization;
              }
              if (data.accessToken) {
                config.headers["x-oauth-token"] = data.accessToken;
              }
              // 在所有处理完成后，最后统一生成 sign
              await PureHttp.ensureXSign(config);
              resolve(config);
              return;
            }

            // 在所有处理完成后，最后统一生成 sign
            await PureHttp.ensureXSign(config);
            resolve(config);
          })().catch(reject);
        });
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      async (response: PureHttpResponse) => {
        const $config = response.config;
        // 关闭进度条动画
        if (getConfig().RemoteAnimation) {
          NProgress.done();
        }

        // 将所有响应处理交给uu1函数，包括blob处理
        const processedResponse = await uu1(response);

        // 如果processedResponse是Promise（异步处理blob的情况），需要处理Promise
        if (processedResponse instanceof Promise) {
          return processedResponse.then((result) => {
            return this.processResponseData(result, $config);
          });
        } else {
          return this.processResponseData(processedResponse, $config);
        }
      },
      async (error: PureHttpError) => {
        const $error = error;
        const response = error.response;
        const errorConfig = getErrorHandlerConfig();

        // 关闭进度条动画
        if (getConfig().RemoteAnimation) {
          NProgress.done();
        }

        // 如果返回体是 blob，优先尝试解析为 JSON，保证后续错误处理拿到结构化数据
        if (response && response.data instanceof Blob) {
          try {
            const text = await response.data.text();
            if (text) {
              const json = JSON.parse(text);
              // 覆盖为可直接消费的对象
              // @ts-ignore
              response.data = json;
            }
          } catch (parseError) {
            if (errorConfig.logToConsole) {
              logger.error("HTTP Error blob parse failed: {}", parseError);
            }
          }
        }

        // 检查是否为取消的请求
        $error.isCancelRequest = Axios.isCancel($error);

        // 统一处理无权限异常（包含 HTTP 403 与业务码 C0403S0000）
        const statusCode =
          (response?.data as any)?.code ?? response?.status ?? null;
        if (isNoAuth(statusCode)) {
          // 优先展示后端返回的提示信息
          const serverMsg =
            // @ts-ignore 兼容多种返回结构
            (response?.data as any)?.msg ||
            (response?.data as any)?.message ||
            error.message;
          if (serverMsg) {
            message(serverMsg, { type: "error" });
          }
          // 触发全局登出逻辑（会清理 token、路由并跳转登录页）
          logOut();
        }

        // 错误处理
        if (!$error.isCancelRequest && errorConfig.enable) {
          // 输出到控制台
          if (errorConfig.logToConsole) {
            logger.error("HTTP Error: {}", {
              url: error.config?.url,
              status: response?.status,
              message: error.message,
            });
          }

          // 上报到服务器（带防刷机制）
          if (errorConfig.reportToServer) {
            reportErrorToServer(
              {
                code: response?.status,
                msg: error.message,
              },
              error.config?.url || "unknown",
            );
          }
        }

        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      },
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig,
  ): Promise<T> & { requestId: string } {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig,
    } as PureHttpRequestConfig;

    // 生成请求唯一标识
    const requestId = `${method}_${url}_${Date.now()}_${Math.random()}`;

    // 创建AbortController
    const abortController = new AbortController();
    config.signal = abortController.signal;

    // 存储请求控制器
    PureHttp.activeRequests.set(requestId, abortController);

    // 单独处理自定义请求/响应回调
    const promise = new Promise<T>((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          // 请求完成后移除控制器
          PureHttp.activeRequests.delete(requestId);
          resolve(response);
        })
        .catch((error) => {
          // 请求失败后移除控制器
          PureHttp.activeRequests.delete(requestId);
          if (error?.response?.data && isObject(error.response.data)) {
            // 确保错误响应数据包含message属性，值与msg相同
            if (!error.response.data.message) {
              error.response.data.message = error.response.data.msg;
            }
          }
          reject(error?.response?.data || error);
        });
    });

    // 将requestId附加到Promise上
    (promise as any).requestId = requestId;
    return promise as Promise<T> & { requestId: string };
  }

  /** 单独抽离的`post`工具函数 */
  public post<T>(
    url: string,
    data?: any,
    config?: PureHttpRequestConfig,
  ): Promise<T> {
    return this.request<T>("post", url, {
      data: data,
      headers: config?.headers,
    });
  }
  /** 单独抽离的`put`工具函数 */
  public put<T>(
    url: string,
    data?: any,
    config?: PureHttpRequestConfig,
  ): Promise<T> {
    return this.request<T>("put", url, {
      data: data,
      headers: config?.headers,
    });
  }

  /** 单独抽离的`get`工具函数 */
  public get<T>(
    url: string,
    params?: any,
    config?: PureHttpRequestConfig,
  ): Promise<T> {
    return this.request<T>("get", url, {
      params: params,
      headers: config?.headers,
    });
  }
  /** 单独抽离的`delete`工具函数 */
  public delete<T>(
    url: string,
    params?: any,
    config?: PureHttpRequestConfig,
  ): Promise<T> {
    return this.request<T>("delete", url, {
      params: params,
      headers: config?.headers,
    });
  }

  /** 取消请求方法 */
  public abort(requestId?: string, reason?: string): void {
    if (requestId) {
      // 取消特定请求
      const controller = PureHttp.activeRequests.get(requestId);
      if (controller) {
        controller.abort(reason || "请求被主动取消");
        PureHttp.activeRequests.delete(requestId);
      }
    } else {
      // 取消所有活跃请求
      PureHttp.activeRequests.forEach((controller, id) => {
        controller.abort(reason || "所有请求被主动取消");
      });
      PureHttp.activeRequests.clear();
    }
  }

  /** 获取活跃请求数量 */
  public getActiveRequestsCount(): number {
    return PureHttp.activeRequests.size;
  }

  /** 获取所有活跃请求的ID列表 */
  public getActiveRequestIds(): string[] {
    return Array.from(PureHttp.activeRequests.keys());
  }

  /** SSE连接方法 */
  public sse(
    url: string,
    options: {
      onmessage?: (event: MessageEvent) => void;
      onopen?: (response: Response) => void;
      onerror?: (error: any) => void;
      onclose?: () => void;
      headers?: Record<string, string>;
      method?: string;
      body?: string | FormData;
      signal?: AbortSignal;
    } = {},
  ): AbortController {
    const controller = new AbortController();
    void (async () => {
      try {
        await PureHttp.ensureWasmReady();

        const token = getToken();
        const fingerprint = getOrCreateFingerprint();
        const authorization = formatToken(token);
        const defaultHeaders: Record<string, string> = {
          "x-req-fingerprint": fingerprint,
          ...options.headers,
        };

        if (authorization) {
          defaultHeaders["Authorization"] = authorization;
        }

        if (isWasmLoaded()) {
          const timestamp = Date.now();
          const nonce = generateNonce();
          const tempConfig: PureHttpRequestConfig = {
            url,
            method: (options.method || "GET") as any,
            params: {},
            data:
              typeof options.body === "object" && options.body !== null
                ? options.body
                : {},
            headers: options.headers || {},
          };
          defaultHeaders["x-nonce"] = nonce;
          defaultHeaders["x-timestamp"] = timestamp.toString();
          defaultHeaders["x-sign"] = generateSign(
            tempConfig,
            timestamp,
            nonce,
            fingerprint as string,
          );
        }

        // 优先使用 ApiAddress，如果未设置则使用 BaseUrl
        const sseBaseUrl = getConfig().ApiAddress || getConfig().BaseUrl;
        await fetchEventSource(sseBaseUrl + url, {
          method: options.method || "GET",
          //@ts-ignore
          headers: defaultHeaders,
          body: options.body,
          signal: controller.signal,
          onopen: async (response) => {
            if (
              response.ok &&
              response.headers.get("content-type")?.includes("text/event-stream")
            ) {
              options.onopen?.(response);
            } else {
              throw new Error(
                `SSE连接失败: ${response.status} ${response.statusText}`,
              );
            }
          },
          onmessage: (event) => {
            //@ts-ignore
            options.onmessage?.(event);
          },
          onerror: (error) => {
            options.onerror?.(error);
            throw error;
          },
          onclose: () => {
            options.onclose?.();
          },
        });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          logger.error("SSE连接错误: {}", error);
          options.onerror?.(error);
        }
      }
    })();

    return controller;
  }

  // 处理响应数据的辅助函数
  private processResponseData(
    response: PureHttpResponse,
    $config: PureHttpRequestConfig,
  ) {
    const data = response.data?.data || response.data;
    if (data instanceof Object && data?.data) {
      data.records = data?.data;
    }
    const code = response.data?.code || response.status;
    const msg =
      response.data?.msg || response.data?.message || response.statusText;
    const success = response.data?.success || isSuccess(code);

    // 构建统一的返回结果对象
    const result: any = {
      data: data,
      code: code,
      msg: msg,
      message: msg,
      success: success,
      headers: response.headers,
    };
    // 修复：确保headers存在再访问x-response-version
    const resVersion = result?.headers && result.headers["x-response-version"];
    if (resVersion) {
      upgrade(resVersion);
    }
    if (!isSuccess(code)) {
      // 无权限错误统一触发登出，避免留在无效会话下
      if (isNoAuth(code)) {
        const serverMsg =
          response.data?.msg || data?.message || "用户信息不存在/请重新登录!";
        message(serverMsg, { type: "error" });
        logOut();
      } else {
        // 是否自动弹出错误提示由 AutoErrorMessage 控制（默认开启，保持兼容）
        const autoErrorMessage = getConfig().AutoErrorMessage;
        if (autoErrorMessage !== false) {
          message(response.data?.msg || data?.message || "Error", {
            type: "error",
          });
        }
      }
      return Promise.reject({
        msg: response.data?.msg || data?.message || "Error",
        code: code,
      });
    }
    // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
    if (typeof $config.beforeResponseCallback === "function") {
      $config.beforeResponseCallback(response);
      return result;
    }
    if (PureHttp.initConfig.beforeResponseCallback) {
      PureHttp.initConfig.beforeResponseCallback(response);
      return result;
    }
    if (response.config.headers["wrapper"] === false) {
      return result.data;
    }
    return result;
  }
}

export const http = new PureHttp();

export { generateSign };
