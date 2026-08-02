import axios, { AxiosError, type AxiosResponse } from "axios";
import { ElMessage } from "element-plus";
import type { ReturnResult } from "@/types/spider";

/**
 * 后端基础地址。
 *
 * <p>开发环境通过 vite proxy 将 /spider 转发到 19091；生产环境可通过环境变量覆盖。</p>
 */
const baseURL = import.meta.env.VITE_API_BASE ?? "/";

/**
 * axios 实例。
 */
export const http = axios.create({
  baseURL,
  timeout: 30_000,
});

/**
 * 响应拦截：解包 { code, data, success }，直接返回 data 字段。
 */
http.interceptors.response.use(
  (response: AxiosResponse<ReturnResult>) => {
    const body = response.data;
    if (body && typeof body === "object" && "code" in body) {
      if (!body.success) {
        ElMessage.error(body.msg || `请求失败 (code=${body.code})`);
        return Promise.reject(new Error(body.msg || "request failed"));
      }
      return body.data as any;
    }
    return response.data;
  },
  (error: AxiosError<ReturnResult>) => {
    const msg =
      error.response?.data?.msg ??
      error.message ??
      "网络异常，请稍后再试";
    ElMessage.error(msg);
    return Promise.reject(error);
  }
);