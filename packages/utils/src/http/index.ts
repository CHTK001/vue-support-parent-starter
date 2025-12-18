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
  upgrade,
} from "@repo/config";
import { UserResult } from "@repo/core";
import { localStorageProxy } from "@repo/utils";
import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer,
} from "axios";
import NProgress from "nprogress";
import { stringify } from "qs";
import { transformI18n } from "../../../config/src/i18n";
import { uu1, uu2, isWasmEnabled, generateNonce as generateNonceFromCodec } from "../crypto/codec";
import type {
  PureHttpError,
  PureHttpRequestConfig,
  PureHttpResponse,
  RequestMethods,
} from "../http/types";
import { message } from "../message";
import {
  generateNonce as generateNonceWasm,
  jsGenerateNonce,
  generateSign as generateSignWasm,
  jsGenerateSign,
  md5Hash as md5HashWasm,
  jsMd5Hash,
} from "@repo/codec-wasm";

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

/** 无权限状态码判断 */
const isNoAuth = (code: string | number | null): boolean =>
  code === "C0403S0000" || code === 403;

/** 成功状态码判断 */
const isSuccess = (code: string | number | null): boolean =>
  code === "00000" || code === 200;

/** 获取请求配置 */
const getRequestConfig = () => {
  const config = getConfig();
  return {
    timeout: config?.Request?.timeout || config?.baseHttpTimeout || 30000,
    retryCount: config?.Request?.retryCount || 3,
    retryDelay: config?.Request?.retryDelay || 1000,
    showLoading: config?.Request?.showLoading !== false,
    enable: config?.Request?.enable !== false,
  };
};

/** 获取错误处理配置 */
const getErrorHandlerConfig = () => {
  const config = getConfig();
  return {
    enable: config?.ErrorHandler?.enable || false,
    showNotification: config?.ErrorHandler?.showNotification !== false,
    logToConsole: config?.ErrorHandler?.logToConsole !== false,
    reportToServer: config?.ErrorHandler?.reportToServer || false,
    reportUrl: config?.ErrorHandler?.reportUrl || "/v1/error/report",
  };
};

/** 错误上报队列（防刷机制） */
const errorReportQueue: Map<string, number> = new Map();
const ERROR_REPORT_INTERVAL = 60000; // 同一错误1分钟内只上报一次

/** 上报错误到服务器 */
const reportErrorToServer = async (error: any, url: string) => {
  const config = getErrorHandlerConfig();
  if (!config.enable || !config.reportToServer) return;

  // 生成错误唯一标识
  const errorKey = `${error.code || "unknown"}_${url}`;
  const lastReportTime = errorReportQueue.get(errorKey);
  const now = Date.now();

  // 防刷检查：同一错误1分钟内只上报一次
  if (lastReportTime && now - lastReportTime < ERROR_REPORT_INTERVAL) {
    return;
  }

  errorReportQueue.set(errorKey, now);

  // 清理过期的错误记录
  errorReportQueue.forEach((time, key) => {
    if (now - time > ERROR_REPORT_INTERVAL) {
      errorReportQueue.delete(key);
    }
  });

  try {
    // 使用fetch避免循环依赖
    const baseUrl = getConfig().ApiAddress || getConfig().BaseUrl;
    await fetch(baseUrl + config.reportUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        code: error.code,
        message: error.msg || error.message,
        timestamp: now,
        userAgent: navigator.userAgent,
        fingerprint: localStorage.getItem("visitId"),
      }),
    });
  } catch (e) {
    // 上报失败静默处理
    if (config.logToConsole) {
      console.warn("Error report failed:", e);
    }
  }
};

/** 默认请求配置 */
const defaultConfig: AxiosRequestConfig = {
  timeout: getRequestConfig().timeout,
  baseURL: getConfig()?.BaseUrl,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
  responseType: "blob",
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer,
  },
};

/** 请求白名单（不需要 token） */
const WHITE_LIST = ["/refresh-token", "/login", "/logout"];

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

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise((resolve) => {
      PureHttp.requests.push((token: string) => {
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
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
        config = await uu2(config);
        // 确保headers对象存在
        if (!config.headers) {
          config.headers = {};
        }
        // 修复：确保headers存在再访问其属性
        const an =
          config.headers["x-remote-animation"] || config.headers["loading"];
        config.headers["x-req-fingerprint"] =
          localStorageProxy().getItem("visitId");

        // 添加nonce和timestamp参数
        const timestamp = Date.now();
        // 使用同步方式获取nonce
        const nonce = generateNonce();

        config.headers["x-nonce"] = nonce;
        config.headers["x-timestamp"] = timestamp.toString();

        // 生成并添加签名
        const sign = generateSign(config, timestamp, nonce);
        config.headers["x-sign"] = sign;

        // 检查是否配置了apiVersion，如果配置了则在URL中添加version参数
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
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        // 白名单接口直接放行
        return WHITE_LIST.some((url) => config.url?.endsWith(url))
          ? config
          : new Promise((resolve) => {
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
                        config.headers["Authorization"] = formatToken(token);
                        PureHttp.requests.forEach((cb) => cb(token));
                        PureHttp.requests = [];
                      })
                      .finally(() => {
                        PureHttp.isRefreshing = false;
                      });
                  }
                  resolve(PureHttp.retryOriginalRequest(config));
                } else {
                  config.headers["Authorization"] = formatToken(
                    data.accessToken
                  );
                  resolve(config);
                }
              } else {
                resolve(config);
              }
            });
      },
      (error) => {
        return Promise.reject(error);
      }
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
      (error: PureHttpError) => {
        const $error = error;
        const response = error.response;
        const errorConfig = getErrorHandlerConfig();

        // 关闭进度条动画
        if (getConfig().RemoteAnimation) {
          NProgress.done();
        }

        // 检查是否为取消的请求
        $error.isCancelRequest = Axios.isCancel($error);

        // 错误处理
        if (!$error.isCancelRequest && errorConfig.enable) {
          // 输出到控制台
          if (errorConfig.logToConsole) {
            console.error("HTTP Error:", {
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
              error.config?.url || "unknown"
            );
          }
        }

        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
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
    config?: PureHttpRequestConfig
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
    config?: PureHttpRequestConfig
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
    config?: PureHttpRequestConfig
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
    config?: PureHttpRequestConfig
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
    } = {}
  ): AbortController {
    const controller = new AbortController();
    const token = getToken();

    const defaultHeaders = {
      //@ts-ignore
      Authorization: formatToken(token),
      "x-req-fingerprint": localStorageProxy().getItem("visitId") || "",
      ...options.headers,
    };

    // 优先使用 ApiAddress，如果未设置则使用 BaseUrl
    const sseBaseUrl = getConfig().ApiAddress || getConfig().BaseUrl;
    fetchEventSource(sseBaseUrl + url, {
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
            `SSE连接失败: ${response.status} ${response.statusText}`
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
    }).catch((error) => {
      if (error.name !== "AbortError") {
        console.error("SSE连接错误:", error);
        options.onerror?.(error);
      }
    });

    return controller;
  }

  // 处理响应数据的辅助函数
  private processResponseData(
    response: PureHttpResponse,
    $config: PureHttpRequestConfig
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
      message(response.data?.msg || data?.message || "Error", {
        type: "error",
      });
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

/** 
 * 生成复杂的 nonce 值
 * 根据 wasmEnable 配置决定使用 WASM 或 JS/TS 实现
 * 不会降级：如果启用 WASM 但加载失败，将抛出错误
 */
const generateNonce = (): string => {
  if (isWasmEnabled()) {
    // 使用 WASM 版本，不降级
    return generateNonceWasm();
  } else {
    // 使用 JS/TS 版本
    return jsGenerateNonce();
  }
};

/** 
 * 生成签名
 * 根据 wasmEnable 配置决定使用 WASM 或 JS/TS 实现
 * 不会降级：如果启用 WASM 但加载失败，将抛出错误
 */
export const generateSign = (
  config: PureHttpRequestConfig,
  timestamp: number,
  nonce: string
): string => {
  // 准备签名参数
  const params: Record<string, any> = {
    ...config.params,
    ...config.data,
  };

  // 过滤掉空值和函数
  const filteredParams: Record<string, string> = {};
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (
      value !== null &&
      value !== undefined &&
      typeof value !== "function" &&
      typeof value !== "object"
    ) {
      filteredParams[key] = String(value);
    }
  });

  // 将参数转换为 key=value 格式的字符串
  const paramPairs: string[] = [];
  Object.keys(filteredParams)
    .sort()
    .forEach((key) => {
      paramPairs.push(`${key}=${filteredParams[key]}`);
    });

  const paramsString = paramPairs.join("&");

  if (isWasmEnabled()) {
    // 使用 WASM 版本，不降级
    return generateSignWasm(
      paramsString,
      timestamp,
      nonce,
      getConfig().secretKey || ""
    );
  } else {
    // 使用 JS/TS 版本
    return jsGenerateSign(
      paramsString + timestamp + nonce + (getConfig().secretKey || ""),
      getConfig().secretKey || ""
    );
  }
};

/** 
 * MD5 哈希函数
 * 根据 wasmEnable 配置决定使用 WASM 或 JS/TS 实现
 * 不会降级：如果启用 WASM 但加载失败，将抛出错误
 */
const md5Hash = (input: string): string => {
  if (isWasmEnabled()) {
    // 使用 WASM 版本，不降级
    return md5HashWasm(input);
  } else {
    // 使用 JS/TS 版本
    return jsMd5Hash(input);
  }
};
