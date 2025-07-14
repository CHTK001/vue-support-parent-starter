import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer,
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig,
} from "../http/types";
import { stringify } from "qs";
import NProgress from "nprogress";
import { message } from "../message";
import { getToken, formatToken, logOut, handRefreshToken } from "@repo/config";
import { transformI18n } from "../../../config/src/i18n";
import { uu1, uu2 } from "../crypto/codec";
import { upgrade, getConfig } from "@repo/config";
import { UserResult } from "@repo/core";
import { localStorageProxy } from "@repo/utils";

const AutoErrorMessage = getConfig().AutoErrorMessage;
/** 响应结果 */
export interface ReturnResult<E> {
  // 状态码; 成功 00000
  code: string | number;
  // 消息
  msg: string;
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
        config = uu2(config);
        const an =
          config.headers["x-remote-animation"] || config.headers["loading"];
        config.headers["x-req-fingerprint"] =
          localStorageProxy().getItem("visitId");
        if (an) {
          if (an == "true") {
            // 开启进度条动画
            NProgress.start();
          }
        } else {
          if (getConfig().remoteAnimation) {
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
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 关闭进度条动画
        if (getConfig().remoteAnimation) {
          NProgress.done();
        }
        response = uu1(response);
        const data = response.data?.data || response.data;
        const result: any = {
          data: null,
          code: 0,
          msg: "",
          headers: {},
        };
        const code = response.data?.code || response.status;
        result.data = data;
        result.code = code;
        result.response = response;
        result.msg = response.data?.msg || response.statusText;
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
        if (getConfig().remoteAnimation) {
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
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig,
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
