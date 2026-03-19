import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1/sync';

export const isApiSuccess = (code: number | string | undefined) => {
  return code === 200 || code === 0 || code === '200' || code === '0' || code === '00000';
};

export const getApiMessage = (payload: { message?: string; msg?: string } | undefined) => {
  return payload?.message || payload?.msg || '请求失败';
};

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (!isApiSuccess(data.code)) {
      return Promise.reject(new Error(getApiMessage(data)));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('authenticated');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
