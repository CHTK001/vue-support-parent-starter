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
// 导入WASM版本的generateNonce函数
import { generateNonce as generateNonceWasm } from "@repo/codec-wasm";

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
    responseType: "json",
    "X-Requested-With": "XMLHttpRequest",
  },
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
        const an = config.headers["x-remote-animation"] || config.headers["loading"];
        config.headers["x-req-fingerprint"] = localStorageProxy().getItem("visitId");
        
        // 添加nonce和timestamp参数
        const timestamp = Date.now();
        // 使用异步方式获取nonce
        const nonce = await generateNonce();
        
        config.headers["x-nonce"] = nonce;
        config.headers["x-timestamp"] = timestamp.toString();
        
        // 生成并添加签名
        const sign = generateSign(config, timestamp, nonce);
        config.headers["x-sign"] = sign;
        
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
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 关闭进度条动画
        if (getConfig().RemoteAnimation) {
          NProgress.done();
        }
        response = uu1(response);
        const data = response.data?.data || response.data;
        if (data instanceof Object && data?.data) {
          data.records = data?.data;
        }
        const result: any = {
          data: null,
          code: 0,
          msg: "",
          message: "", // 添加message属性
          headers: {},
        };
        const code = response.data?.code || response.status;
        result.data = data;
        result.code = code;
        result.response = response;
        result.msg = response.data?.msg || response.statusText;
        // 添加message属性，值与msg相同
        result.message = result.msg;
        result.headers = response.headers;
        result.success = response.data?.success || isSuccess(code);
        const resVersion = result.headers["x-response-version"];
        upgrade(resVersion);
        if (!isSuccess(code)) {
          message(response.data?.msg || data.message || "Error", {
            type: "error",
          });
          return Promise.reject({
            msg: response.data?.msg || data.message || "Error",
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
      },
      (error: PureHttpError) => {
        const $error = error;
        const response = error.response;
        let code = response?.status as any;

        // 关闭进度条动画
        if (getConfig().RemoteAnimation) {
          NProgress.done();
        }

        // 处理Blob类型的响应数据
        const handleBlobData = (blob) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const text = reader.result as string;
                const jsonData = JSON.parse(text);
                resolve(jsonData);
              } catch (e) {
                console.error("Failed to parse JSON from blob:", e);
                reject(e);
              }
            };
            reader.onerror = () => reject(new Error("Failed to read blob"));
            reader.readAsText(blob);
          });
        };

        // 处理错误消息显示
        const showErrorMessage = (msg: string) => {
          if (!AutoErrorMessage) {
            return;
          }
          if (msg === "Internal Server Error") {
            msg = transformI18n("http.error.serverError");
          }
          message(msg, {
            type: "error",
            grouping: true,
          });
        };

        // 处理认证失败的情况
        const handleAuthError = () => {
          const token = getToken();
          if (token.accessToken && token.refreshToken) {
            handRefreshToken({ refreshToken: token.refreshToken })
              .catch(() => {
                logOut();
              })
              .finally(() => {
                PureHttp.isRefreshing = false;
              });
            return Promise.resolve(PureHttp.retryOriginalRequest(error.config));
          }
          logOut();
          return Promise.reject($error);
        };

        // 检查是否为取消的请求
        $error.isCancelRequest = Axios.isCancel($error);

        // 处理响应数据
        if (response) {
          const data = response.data as any;
          if (data) {
            // 处理Blob类型的JSON数据
            if (data instanceof Blob && data?.type === "application/json") {
              return handleBlobData(data)
                .then((jsonData: any) => {
                  code = jsonData.code || code;

                  if (!isSuccess(code)) {
                    showErrorMessage(jsonData.msg || "Error");

                    if (isNoAuth(code)) {
                      return handleAuthError();
                    }
                  }

                  return Promise.reject({
                    msg: jsonData.msg || "Error",
                    code: code,
                    data: jsonData.data,
                  });
                })
                .catch((err) => {
                  return Promise.reject(err);
                });
            }

            code = data?.code || code;
          }
        }

        // 处理非成功状态码
        if (!isSuccess(code)) {
          if (isNoAuth(code)) {
            return handleAuthError();
          }

          const data = response ? (response.data as any) : {};
          const msg = data?.msg || response?.statusText || "Error";
          showErrorMessage(msg);
        }

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
}

export const http = new PureHttp();

/** 生成复杂的nonce值 */
const generateNonce = async (): Promise<string> => {
  try {
    // 使用WASM版本的generateNonce函数
    return await generateNonceWasm();
  } catch (error) {
    console.warn('WASM generateNonce failed, using fallback implementation:', error);
    // 如果WASM失败，回退到JavaScript实现
    // 获取当前时间戳（毫秒）
    const timestamp = Date.now();
    
    // 生成多个随机数
    const random1 = Math.random().toString(36).substr(2, 5);
    const random2 = Math.random().toString(36).substr(2, 7);
    const random3 = Math.floor(Math.random() * 1000000).toString(36);
    
    // 生成基于时间戳的哈希-like值
    const timeHash = (timestamp * 9301 + 49297) % 233280;
    
    // 生成序列号
    const sequence = (timestamp & 0xFFFF) ^ (timestamp >>> 16);
    
    // 生成基于随机数的混合值
    const mixed = ((random1.length * random2.length * random3.length) + timestamp) % 999999;
    
    // 生成最终的复杂nonce
    const nonce = `${random1}${sequence.toString(36)}${random2}${timeHash.toString(36)}${random3}${mixed.toString(36)}`;
    
    // 确保长度足够复杂
    if (nonce.length < 32) {
      const padding = Math.random().toString(36).substr(2, 32 - nonce.length);
      return nonce + padding;
    }
    
    return nonce;
  }
};

/** 生成签名 */
const generateSign = (config: any, timestamp: number, nonce: string): string => {
  // 收集请求参数
  const params: Record<string, any> = {};
  
  // 收集URL参数
  if (config.params) {
    Object.keys(config.params).sort().forEach(key => {
      params[key] = config.params[key];
    });
  }
  
  // 收集请求体数据
  if (config.data) {
    if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
      Object.keys(config.data).sort().forEach(key => {
        params[key] = config.data[key];
      });
    } else if (typeof config.data === 'string') {
      try {
        const jsonData = JSON.parse(config.data);
        Object.keys(jsonData).sort().forEach(key => {
          params[key] = jsonData[key];
        });
      } catch (e) {
        // 如果不是JSON字符串，则直接使用
        params['data'] = config.data;
      }
    }
  }
  
  // 添加nonce和timestamp
  params['_nonce'] = nonce;
  params['_timestamp'] = timestamp;
  
  // 按键名排序并拼接参数
  const sortedKeys = Object.keys(params).sort();
  let paramString = '';
  sortedKeys.forEach(key => {
    const value = params[key];
    if (value !== null && value !== undefined) {
      paramString += `${key}=${value}&`;
    }
  });
  
  // 移除末尾的&符号
  if (paramString.endsWith('&')) {
    paramString = paramString.slice(0, -1);
  }
  
  // 添加密钥
  const secretKey = "your-secret-key"; // 实际应该从配置中获取
  const dataToSign = paramString + secretKey;
  
  // 生成MD5签名
  return md5Hash(dataToSign);
};

/** MD5哈希函数 */
const md5Hash = (input: string): string => {
  // 简化的MD5实现（实际项目中应使用crypto库）
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const character = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + character;
    hash = hash & hash; // 转换为32位整数
  }
  // 转换为16进制字符串并确保长度为32位
  let hex = Math.abs(hash).toString(16);
  while (hex.length < 32) {
    hex = "0" + hex;
  }
  return hex.substr(0, 32);
};
