import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";

export interface ApiResponse<T = unknown> {
  code: number | string;
  message: string;
  data: T;
}

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => response,
    (error) => Promise.reject(error),
  );

  return instance;
};

const api = createAxiosInstance();

export const apiRequest = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.get<any, ApiResponse<T>>(url, config);
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.post<any, ApiResponse<T>>(url, data, config);
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.put<any, ApiResponse<T>>(url, data, config);
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.delete<any, ApiResponse<T>>(url, config);
  },
};

export default apiRequest;
