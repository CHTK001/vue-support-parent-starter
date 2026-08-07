import axios, { AxiosError, type AxiosResponse } from "axios";
import { ElMessage } from "element-plus";
import type { ApiResult } from "@/types/spider";

/**
 * axios 实例。
 *
 * <p>请求通过 Vite proxy 转发到 {@code http://127.0.0.1:19091} 后端服务。</p>
 */
export const http = axios.create({
  baseURL: "/",
  timeout: 30_000,
});

/**
 * 解包后端统一响应为业务数据。
 *
 * <p>非成功码（{@code code !== "00000"}）抛错并 toast 提示。</p>
 */
function unwrap<T>(r: AxiosResponse<ApiResult<T>>): T {
  const body = r.data;
  if (!body || !body.success) {
    const msg = body?.msg || `请求失败 (code=${body?.code})`;
    ElMessage.error(msg);
    throw new Error(msg);
  }
  return body.data as T;
}

/**
 * 请求拦截：统一前缀，dev 阶段直走 vite proxy /spider-api/*
 */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResult>) => {
    const msg =
      error.response?.data?.msg ??
      error.message ??
      "网络异常，请稍后再试";
    ElMessage.error(msg);
    return Promise.reject(error);
  }
);

/**
 * 爬虫定义 API。
 */
export const definitionApi = {
  page: (pageNo = 1, pageSize = 20) =>
    http
      .get<ApiResult>("/spider-api/spider/definitions/page", {
        params: { pageNo, pageSize },
      })
      .then(unwrap) as Promise<unknown>,

  detail: (spiderCode: string) =>
    http
      .get<ApiResult>(`/spider-api/spider/definitions/detail`, {
        params: { spiderCode },
      })
      .then(unwrap) as Promise<unknown>,

  save: (data: Record<string, unknown>) =>
    http
      .post<ApiResult>("/spider-api/spider/definitions/save", data)
      .then(unwrap) as Promise<unknown>,

  remove: (spiderCode: string) =>
    http
      .delete<ApiResult>("/spider-api/spider/definitions/delete", {
        params: { spiderCode },
      })
      .then(unwrap) as Promise<unknown>,

  status: (spiderCode: string, spiderStatus: 0 | 1) =>
    http
      .post<ApiResult>("/spider-api/spider/definitions/status", null, {
        params: { spiderCode, spiderStatus },
      })
      .then(unwrap) as Promise<unknown>,
};

/**
 * 代理池 API。
 */
export const proxyPoolApi = {
  page: (pageNo = 1, pageSize = 20) =>
    http
      .get<ApiResult>("/spider-api/spider/proxy-pools/page", {
        params: { pageNo, pageSize },
      })
      .then(unwrap) as Promise<unknown>,

  save: (data: Record<string, unknown>) =>
    http
      .post<ApiResult>("/spider-api/spider/proxy-pools/save", data)
      .then(unwrap) as Promise<unknown>,

  remove: (poolCode: string) =>
    http
      .delete<ApiResult>("/spider-api/spider/proxy-pools/delete", {
        params: { poolCode },
      })
      .then(unwrap) as Promise<unknown>,
};

/**
 * 执行记录 API。
 */
export const executionApi = {
  page: (pageNo = 1, pageSize = 20, spiderCode?: string) =>
    http
      .get<ApiResult>("/spider-api/spider/executions/page", {
        params: { pageNo, pageSize, spiderCode },
      })
      .then(unwrap) as Promise<unknown>,

  detail: (executionNo: string) =>
    http
      .get<ApiResult>("/spider-api/spider/executions/detail", {
        params: { executionNo },
      })
      .then(unwrap) as Promise<unknown>,

  /**
   * 触发爬虫执行（异步）。
   *
   * @param spiderCode 爬虫编码
   * @returns 后端返回 { executionNo, status, startTime }
   */
  run: (spiderCode: string) =>
    http
      .post<ApiResult>("/spider-api/spider/executions/run", null, {
        params: { spiderCode },
      })
      .then(unwrap) as Promise<unknown>,
};

export default http;
