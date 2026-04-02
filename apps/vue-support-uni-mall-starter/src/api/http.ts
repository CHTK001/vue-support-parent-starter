import type { ApiResponse } from "../entity/user";
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
import { mockRequest, IS_MOCK } from "./mock";
import { clearToken, getToken } from "./token";

export function request<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  if (IS_MOCK) {
    return mockRequest<T>(url, method, data);
  }

  const token = getToken();
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        const body = res.data as ApiResponse<T>;
        if (res.statusCode === 401) {
          clearToken();
          reject(new Error("登录已过期"));
          return;
        }
        if (res.statusCode >= 400 || !body?.success) {
          reject(new Error(body?.message ?? "请求失败"));
          return;
        }
        resolve(body);
      },
      fail: (err) => reject(new Error(err.errMsg ?? "网络请求失败")),
    });
  });
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    request<T>(url, "GET", params),
  post: <T>(url: string, data?: Record<string, unknown>) =>
    request<T>(url, "POST", data),
  put: <T>(url: string, data?: Record<string, unknown>) =>
    request<T>(url, "PUT", data),
  delete: <T>(url: string, data?: Record<string, unknown>) =>
    request<T>(url, "DELETE", data),
};
