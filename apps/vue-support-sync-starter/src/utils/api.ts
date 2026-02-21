import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 创建 axios 实例
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 可以在这里添加 token 等
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { data } = response;
      // 根据业务需求处理响应
      if (data.code === 200 || data.code === 0) {
        return data;
      }
      return Promise.reject(new Error(data.message || "请求失败"));
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * API 请求实例
 */
export const api = createAxiosInstance();

/**
 * 通用请求方法
 */
export const request = {
  /**
   * GET 请求
   */
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.get<ApiResponse<T>>(url, config).then((res) => res as unknown as ApiResponse<T>);
  },

  /**
   * POST 请求
   */
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.post<ApiResponse<T>>(url, data, config).then((res) => res as unknown as ApiResponse<T>);
  },

  /**
   * PUT 请求
   */
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.put<ApiResponse<T>>(url, data, config).then((res) => res as unknown as ApiResponse<T>);
  },

  /**
   * DELETE 请求
   */
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.delete<ApiResponse<T>>(url, config).then((res) => res as unknown as ApiResponse<T>);
  },
};

