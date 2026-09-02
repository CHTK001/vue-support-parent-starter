/**
 * axios 实例
 *
 * GeoDownloader 后端（spring-api-support-geo-starter）返回原始 JSON：
 *   - 页面通过 /geo/api 前缀访问，由 vite proxy 转发到 18171
 *   - 不拆包 code/data
 */
import axios from "axios";

/** 后端 API 前缀 */
const baseURL = "/geo/api";

export const http = axios.create({
  baseURL,
  timeout: 30_000,
});

// 响应不拆包：backend 直接返回数据对象/数组
http.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
);

export type { AxiosResponse } from "axios";