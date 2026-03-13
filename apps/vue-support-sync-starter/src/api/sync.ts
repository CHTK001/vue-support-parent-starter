import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1/sync';

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
    if (data.code !== 200 && data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'));
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
