import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// 扩展 AxiosRequestConfig 以支持 throttle 配置
declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 是否禁用节流，默认 true（启用节流） */
    throttle?: boolean;
  }
}

import { msgError, noticeWarning, noticeError } from "@repo/core";
import { LOGIN_URL } from "@repo/config";
import useUserStore from "@repo/pinia/modules/user";
import { getToken } from "@repo/theme/koi/utils/storage.ts";
import { getRouter as getKoiRouter } from "@repo/core";
import i18n from "@repo/languages";
import { ElMessageBox } from "element-plus";
import { createThrottleAdapter } from "@repo/utils";
import { getEnv } from "@repo/env";
import { getConfig } from "@repo/config";

// axios配置[不含加密版本]：baseURL 统一读 @repo/config（app.yaml 的 httpConfig.baseUrl）
const config = {
  // 接口请求的地址
  baseURL: getConfig().http?.baseUrl || getEnv("VITE_WEB_BASE_API", "/system/api"),
  adapter: createThrottleAdapter(),
  timeout: 12000
};

/**
 * 统一响应体，与后端保持一致
 */
export interface Result<T = any> {
  /** 业务状态码：200 成功，401 未授权等 */
  status: number;
  msg: string;
  data?: T;
  /** 数据类型：NORMAL 明文；10/20 等为加密响应 */
  dataType?: string;
  traceId?: string;
}

// 401 提示框显示标志，防止多个 401 请求同时弹出多个提示框
let isShowing401MessageBox = false;

/**
 * 解析响应体中的业务状态码（兼容 status / code，且任一为 401 时优先视为未授权）
 */
export function getBusinessStatus(data: any): number | undefined {
  if (data == null || typeof data !== "object") {
    return undefined;
  }
  if (Number(data.status) === 401 || Number(data.code) === 401) {
    return 401;
  }
  const raw = data.status ?? data.code;
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** 是否为未授权响应（业务体或 HTTP 401） */
export function isUnauthorizedResponse(data: any, httpStatus?: number): boolean {
  if (httpStatus === 401) {
    return true;
  }
  return getBusinessStatus(data) === 401;
}

/**
 * 统一处理 401 未授权情况
 * @returns Promise.reject
 */
function handle401Unauthorized(data: any) {
  // 获取当前路由路径
  const currentPath = getKoiRouter().currentRoute.value.path;
  
  // 如果当前是登录页面，直接清除token并拒绝请求
  if (currentPath === "/" || currentPath === LOGIN_URL) {
    const userStore = useUserStore();
    userStore.setToken("");
    return Promise.reject(data);
  }

  // 如果已经有提示框在显示，直接拒绝请求，避免重复弹出
  if (isShowing401MessageBox) {
    return Promise.reject(data);
  }

  // 非登录页面显示提示框
  isShowing401MessageBox = true;
  return new Promise((_, reject) => {
    // 先关闭可能存在的其他提示框，然后延迟显示新的提示框
    // 使用 requestAnimationFrame 确保在 DOM 更新后显示
    requestAnimationFrame(() => {
      setTimeout(() => {
        ElMessageBox.confirm(i18n.global.t("msg.confirmLogin"), i18n.global.t("msg.remind"), {
          confirmButtonText: i18n.global.t("button.confirm"),
          cancelButtonText: i18n.global.t("button.cancel"),
          type: "warning",
          closeOnClickModal: false,
          closeOnPressEscape: false,
          showClose: false,
          distinguishCancelAndClose: true
        })
          .then(() => {
            const userStore = useUserStore();
            userStore.setToken("");
            msgError(i18n.global.t("msg.confirmLogin"));
            reject(i18n.global.t("button.confirm"));
            setTimeout(() => {
              getKoiRouter().replace(LOGIN_URL).catch(err => {
                console.error("路由跳转失败:", err);
                window.location.href = LOGIN_URL;
              });
            }, 0);
          })
          .catch(() => {
            noticeWarning(i18n.global.t("msg.cancelled"));
            reject(i18n.global.t("msg.cancelled"));
          })
          .finally(() => {
            isShowing401MessageBox = false;
          });
      }, 100); // 延迟 100ms 确保其他操作完成
    });
  });
}

class Yu {
  private instance: AxiosInstance;
  // 初始化
  constructor(config: AxiosRequestConfig) {
    // 实例化axios
    this.instance = axios.create(config);
    // 配置拦截器
    this.interceptors();
  }
  // 拦截器
  private interceptors() {
    // 请求发送之前的拦截器：携带token + 浏览器指纹
    // @ts-ignore
    this.instance.interceptors.request.use(
      config => {
        // 获取token
        const token = getToken();
        if (token) {
          config.headers!["Authorization"] = "Bearer " + token;
        } else {
          delete config.headers!["Authorization"];
        }

        // 浏览器指纹（已由 createApp 初始化写入 storage，这里同步读取）
        const fingerprint =
          window.localStorage.getItem("sys-fingerprint") ?? "";
        if (fingerprint) {
          config.headers!["x-req-fingerprint"] = fingerprint;
          config.headers!["x-oauth-fingerprint"] = fingerprint;
        }
        return config;
      },
      (error: any) => {
        error.data = {};
        error.data.msg = "服务器异常，请联系管理员";
        return error;
      }
    );
    // 请求返回之后的拦截器：数据或者状态
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        // console.log("服务器状态", res.status);
        const businessStatus = getBusinessStatus(res.data);
        if (businessStatus === 200) {
          return res.data;
        }
        if (businessStatus === 401) {
          return handle401Unauthorized(res.data);
        } else {
          // console.log("后端返回数据：", res.data.msg)
          noticeError(res.data.msg + "" || "服务器偷偷跑到火星去玩了");
          return Promise.reject(res.data.msg + "" || "服务器偷偷跑到火星去玩了"); // 可以将异常信息延续到页面中处理，使用try{}catch(error){};
        }
      },
      (error: any) => {
        // 处理网络错误，不是服务器响应的数据
        // console.log("进入错误", error);
        error.data = {};
        if (error && error.response) {
          const responseData = error.response.data;
          if (isUnauthorizedResponse(responseData, error.response.status)) {
            return handle401Unauthorized(
              typeof responseData === "object" && responseData !== null
                ? responseData
                : { code: 401, msg: "未授权，请重新登录" }
            );
          }
          switch (error.response.status) {
            case 400:
              error.data.msg = "错误请求";
              noticeError(error.data.msg);
              break;
            case 403:
              error.data.msg = "对不起，您没有权限访问";
              noticeError(error.data.msg);
              break;
            case 404:
              error.data.msg = "请求错误,未找到请求路径";
              noticeError(error.data.msg);
              break;
            case 405:
              error.data.msg = "请求方法未允许";
              noticeError(error.data.msg);
              break;
            case 408:
              error.data.msg = "请求超时";
              noticeError(error.data.msg);
              break;
            case 500:
              error.data.msg = "服务器又偷懒了，请重试";
              noticeError(error.data.msg);
              break;
            case 501:
              error.data.msg = "网络未实现";
              noticeError(error.data.msg);
              break;
            case 502:
              error.data.msg = "网络错误";
              noticeError(error.data.msg);
              break;
            case 503:
              error.data.msg = "服务不可用";
              noticeError(error.data.msg);
              break;
            case 504:
              error.data.msg = "网络超时";
              noticeError(error.data.msg);
              break;
            case 505:
              error.data.msg = "http版本不支持该请求";
              noticeError(error.data.msg);
              break;
            default:
              error.data.msg = `连接错误${error.response.status}`;
              noticeError(error.data.msg);
          }
        } else {
          error.data.msg = "连接到服务器失败";
          noticeError(error.data.msg);
        }
        return Promise.reject(error); // 将错误返回给 try{} catch(){} 中进行捕获，就算不进行捕获，上方 res.data.status != 200 也会抛出提示。
      }
    );
  }
  // Get请求
  get<T = Result>(url: string, params?: object): Promise<T> {
    return this.instance.get(url, { params }) as unknown as Promise<T>;
  }
  // Post请求
  post<T = Result>(url: string, data?: object): Promise<T> {
    return this.instance.post(url, data) as unknown as Promise<T>;
  }
  // Put请求
  put<T = Result>(url: string, data?: object): Promise<T> {
    return this.instance.put(url, data) as unknown as Promise<T>;
  }
  // Delete请求 /yu/role/1
  delete<T = Result>(url: string): Promise<T> {
    return this.instance.delete(url) as unknown as Promise<T>;
  }
  // 图片上传
  upload<T = Result>(url: string, formData?: object, config?: AxiosRequestConfig): Promise<T> {
    const extraHeaders =
      config?.headers && typeof config.headers === "object" && !(config.headers instanceof Headers)
        ? (config.headers as Record<string, string>)
        : {};
    return this.instance.post(url, formData, {
      ...config,
      throttle: false,
      headers: {
        "Content-Type": "multipart/form-data",
        ...extraHeaders
      }
    }) as unknown as Promise<T>;
  }
  // 导出Excel
  exportExcel<T = Result>(url: string, params?: object): Promise<T> {
    return axios.get(getEnv("VITE_SERVER", "") + url, {
      params,
      headers: {
        Accept: "application/vnd.ms-excel",
        Authorization: "Bearer " + getToken()
      },
      responseType: "blob"
    }) as unknown as Promise<T>;
  }
  // 下载
  download<T = Result>(url: string, data?: object): Promise<T> {
    return axios.post(getEnv("VITE_SERVER", "") + url, data, {
      headers: {
        Authorization: "Bearer " + getToken()
      },
      responseType: "blob"
    }) as unknown as Promise<T>;
  }
}

export default new Yu(config);
