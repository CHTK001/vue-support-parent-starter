/**
 * http() - 统一HTTP请求封装
 * 
 * 远程组件统一repo/http，使用http()进行请求。
 * 基于axios封装，支持请求拦截器、响应拦截器、错误处理，
 * 并与createContextApp的http上下文集成。
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAppContext } from './contextApp';

// ==================== 类型定义 ====================

/** HTTP请求方法 */
export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options';

/** HTTP请求配置 */
export interface HttpRequestConfig extends AxiosRequestConfig {
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 自定义错误消息 */
  errorMessage?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 是否返回原始响应（不解析data） */
  rawResponse?: boolean;
}

/** HTTP响应 */
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: HttpRequestConfig;
}

/** HTTP错误 */
export class HttpError extends Error {
  status?: number;
  data?: any;
  config?: HttpRequestConfig;
  
  constructor(message: string, status?: number, data?: any, config?: HttpRequestConfig) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
    this.config = config;
  }
}

// ==================== 默认配置 ====================

const DEFAULT_BASE_URL = '/v2';
const DEFAULT_TIMEOUT = 30000;

// ==================== 创建axios实例 ====================

let axiosInstance: AxiosInstance | null = null;

/** 获取或创建axios实例 */
function getAxiosInstance(): AxiosInstance {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL: DEFAULT_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    axiosInstance.interceptors.request.use(
      (config) => {
        // 从应用上下文获取token
        try {
          const { auth } = useAppContext();
          if (auth?.token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${auth.token}`;
          }
        } catch (e) {
          // 上下文未初始化时忽略
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // 统一错误处理
        const httpError = new HttpError(
          error.message || '请求失败',
          error.response?.status,
          error.response?.data,
          error.config
        );
        
        // 调用应用上下文的错误处理器
        try {
          const { http } = useAppContext();
          if (http?.errorHandler) {
            http.errorHandler(httpError);
          }
        } catch (e) {
          // 上下文未初始化时忽略
        }
        
        return Promise.reject(httpError);
      }
    );
  }
  return axiosInstance;
}

// ==================== http() 核心函数 ====================

/**
 * 统一HTTP请求函数
 * 
 * @param method 请求方法
 * @param url 请求URL
 * @param data 请求数据（POST/PUT/PATCH）
 * @param config 请求配置
 * @returns Promise<HttpResponse>
 * 
 * @example
 * ```ts
 * import { http } from './http';
 * 
 * // GET请求
 * const res = await http('get', '/models');
 * console.log(res.data);
 * 
 * // POST请求
 * const res = await http('post', '/models', { name: 'test' });
 * 
 * // 带配置
 * const res = await http('get', '/models', null, { showLoading: true, timeout: 10000 });
 * ```
 */
export async function http<T = any>(
  method: HttpMethod,
  url: string,
  data?: any,
  config?: HttpRequestConfig
): Promise<HttpResponse<T>> {
  const instance = getAxiosInstance();
  
  const requestConfig: HttpRequestConfig = {
    method,
    url,
    ...config,
  };
  
  // 处理请求数据
  if (data !== undefined && data !== null) {
    if (method === 'get' || method === 'head' || method === 'options') {
      requestConfig.params = data;
    } else {
      requestConfig.data = data;
    }
  }
  
  try {
    const response: AxiosResponse = await instance.request(requestConfig);
    
    if (config?.rawResponse) {
      return response as HttpResponse<T>;
    }
    
    return {
      data: response.data as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: requestConfig,
    };
  } catch (error: any) {
    // 错误提示
    if (config?.showError !== false) {
      const message = config?.errorMessage || error.message || '请求失败';
      console.error('[HTTP Error]', message, error);
    }
    throw error;
  }
}

// ==================== 便捷方法 ====================

/**
 * http.get() - GET请求
 * 
 * @example
 * ```ts
 * const res = await http.get('/models');
 * const res = await http.get('/models', { page: 1 });
 * ```
 */
http.get = <T = any>(url: string, params?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> => {
  return http<T>('get', url, params, config);
};

/**
 * http.post() - POST请求
 * 
 * @example
 * ```ts
 * const res = await http.post('/models', { name: 'test' });
 * ```
 */
http.post = <T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> => {
  return http<T>('post', url, data, config);
};

/**
 * http.put() - PUT请求
 */
http.put = <T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> => {
  return http<T>('put', url, data, config);
};

/**
 * http.delete() - DELETE请求
 */
http.delete = <T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> => {
  return http<T>('delete', url, undefined, config);
};

/**
 * http.patch() - PATCH请求
 */
http.patch = <T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>> => {
  return http<T>('patch', url, data, config);
};

// ==================== 配置管理 ====================

/**
 * 设置全局baseURL
 */
export function setBaseUrl(baseUrl: string): void {
  const instance = getAxiosInstance();
  instance.defaults.baseURL = baseUrl;
}

/**
 * 设置全局超时时间
 */
export function setTimeout(timeout: number): void {
  const instance = getAxiosInstance();
  instance.defaults.timeout = timeout;
}

/**
 * 设置全局请求头
 */
export function setHeader(key: string, value: string): void {
  const instance = getAxiosInstance();
  instance.defaults.headers.common[key] = value;
}

/**
 * 添加请求拦截器
 */
export function addRequestInterceptor(
  onFulfilled: (config: any) => any,
  onRejected?: (error: any) => any
): number {
  const instance = getAxiosInstance();
  return instance.interceptors.request.use(onFulfilled, onRejected);
}

/**
 * 添加响应拦截器
 */
export function addResponseInterceptor(
  onFulfilled: (response: any) => any,
  onRejected?: (error: any) => any
): number {
  const instance = getAxiosInstance();
  return instance.interceptors.response.use(onFulfilled, onRejected);
}

// ==================== 导出 ====================

export default http;
export type { HttpMethod, HttpRequestConfig, HttpResponse };
