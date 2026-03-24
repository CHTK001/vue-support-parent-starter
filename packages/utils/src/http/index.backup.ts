import { fetchEventSource } from "@microsoft/fetch-event-source";
import { isObject } from "@pureadmin/utils";
import { formatToken, getConfig, getToken, handRefreshToken, logOut, upgrade } from "@repo/config";
import { UserResult } from "@repo/core";
import { localStorageProxy } from "@repo/utils";
import Axios, { type AxiosInstance, type AxiosRequestConfig, type CustomParamsSerializer } from "axios";
import NProgress from "nprogress";
import { stringify } from "qs";
import { transformI18n } from "../../../config/src/i18n";
import { uu1, uu2 } from "../crypto/codec";
import type { PureHttpError, PureHttpRequestConfig, PureHttpResponse, RequestMethods } from "../http/types";
import { message } from "../message";
// 导入WASM版本的generateNonce、generateSign和md5Hash函数
import { generateNonce as generateNonceWasm, generateSign as generateSignWasm, md5Hash as md5HashWasm } from "@repo/codec-wasm";

const AutoErrorMessage = getConfig().AutoErrorMessage;
/** 响应结果 */
export interface ReturnResult<E> {
  // 状态码; 成功 00000
  code: string | number;
  // 消息
  msg: string;
  // 消息（与msg相同，用于兼容不同场景）
  message: string;
  // 数据
  data: E;
  // 响应头
  headers?: any;
  /** 是否成功 */
  success: boolean;
}
const isNoAuth = (code) => {
  if (!code) {
    return false;
  }

  return code === "C0403S0000" || code === 403;
};

const isSuccess = (code) => {
  if (!code) {
    return false;
  }

  return code === "00000" || code === 200;
};

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: getConfig().baseHttpTimeout || 30000,
  baseURL: getConfig().BaseUrl,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
  // 默认responseType设置为blob
  responseType: "blob",
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer,
  },
};

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
        config.baseURL = getConfig().BaseUrl;
        config = await uu2(config);
        // 确保headers对象存在
        if (!config.headers) {
          config.headers = {};
        }
        // 修复：确保headers存在再访问其属性
        const an = config.headers["x-remote-animation"] || config.headers["loading"];
        config.headers["x-req-fingerprint"] = localStorageProxy().getItem("visitId");
        
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
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = ["/refresh-token", "/login", "/logout"];
        return whiteList.some((url) => config.url.endsWith(url))
          ? config
          : new Promise((resolve) => {
              let data = getToken();
              const openAuth = getConfig().OpenAuth;
              if (!openAuth && !data) {
                data = {} as UserResult;
              }
              if ((openAuth && data) || !openAuth) {
                const now = new Date().getTime();
                const expired = ~~data.expires == 0 ? false : ~~data.expires - now <= 0;
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
                  config.headers["Authorization"] = formatToken(data.accessToken);
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
          return processedResponse.then(result => {
            return this.processResponseData(result, $config);
          });
        } else {
          return this.processResponseData(processedResponse, $config);
        }
      },
      (error: PureHttpError) => {
        const $error = error;
        const response = error.response;

        // 关闭进度条动画
        if (getConfig().RemoteAnimation) {
          NProgress.done();
        }

        // 检查是否为取消的请求
        $error.isCancelRequest = Axios.isCancel($error);

        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(method: RequestMethods, url: string, param?: AxiosRequestConfig, axiosConfig?: PureHttpRequestConfig): Promise<T> & { requestId: string } {
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
  public post<T>(url: string, data?: any, config?: PureHttpRequestConfig): Promise<T> {
    return this.request<T>("post", url, {
      data: data,
      headers: config?.headers,
    });
  }
  /** 单独抽离的`put`工具函数 */
  public put<T>(url: string, data?: any, config?: PureHttpRequestConfig): Promise<T> {
    return this.request<T>("put", url, {
      data: data,
      headers: config?.headers,
    });
  }

  /** 单独抽离的`get`工具函数 */
  public get<T>(url: string, params?: any, config?: PureHttpRequestConfig): Promise<T> {
    return this.request<T>("get", url, {
      params: params,
      headers: config?.headers,
    });
  }
  /** 单独抽离的`delete`工具函数 */
  public delete<T>(url: string, params?: any, config?: PureHttpRequestConfig): Promise<T> {
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

    fetchEventSource(getConfig().BaseUrl + url, {
      method: options.method || "GET",
      //@ts-ignore
      headers: defaultHeaders,
      body: options.body,
      signal: controller.signal,
      onopen: async (response) => {
        if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
          options.onopen?.(response);
        } else {
          throw new Error(`SSE连接失败: ${response.status} ${response.statusText}`);
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
  private processResponseData(response: PureHttpResponse, $config: PureHttpRequestConfig) {
    const data = response.data?.data || response.data;
    if (data instanceof Object && data?.data) {
      data.records = data?.data;
    }
    const code = response.data?.code || response.status;
    const msg = response.data?.msg || response.data?.message || response.statusText;
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

/** 生成复杂的nonce值 */
const generateNonce = (): string => {
  try {
    // 使用WASM版本的generateNonce函数（同步方式）
    return generateNonceWasm();
  } catch (error) {
    console.error('Failed to generate nonce using WASM:', error);
    // 如果WASM失败，提供一个备用实现
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

/** 生成签名 */
export const generateSign = (config: PureHttpRequestConfig, timestamp: number, nonce: string): string => {
  try {
    // 准备签名参数
    const params: Record<string, any> = {
      ...config.params,
      ...config.data
    };
    
    // 过滤掉空值和函数
    const filteredParams: Record<string, string> = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined && typeof value !== 'function' && typeof value !== 'object') {
        filteredParams[key] = String(value);
      }
    });
    
    // 将参数转换为key=value格式的字符串
    const paramPairs: string[] = [];
    Object.keys(filteredParams).sort().forEach(key => {
      paramPairs.push(`${key}=${filteredParams[key]}`);
    });
    
    const paramsString = paramPairs.join('&');
    
    // 使用WASM版本的generateSign函数（同步方式）
    return generateSignWasm(paramsString, timestamp, nonce, getConfig().secretKey || '');
  } catch (error) {
    console.error('Failed to generate sign using WASM:', error);
    // 如果WASM失败，提供一个备用实现
    return Math.random().toString(36).substring(2, 10);
  }
};

/** MD5哈希函数 */
const md5Hash = (input: string): string => {
  try {
    // 使用WASM版本的md5Hash函数（同步方式）
    return md5HashWasm(input);
  } catch (error) {
    console.error('Failed to generate MD5 hash using WASM:', error);
    // 如果WASM失败，提供一个备用实现
    return btoa(input);
  }
};
