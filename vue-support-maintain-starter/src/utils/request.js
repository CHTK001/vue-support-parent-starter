import axios from 'axios';
import Constant from "@/config/common"
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    if (localStorage.getItem(Constant.LOCAL_TOKEN_NAME)) {
      config.headers[Constant.TOKEN_NAME] = localStorage.getItem(Constant.LOCAL_TOKEN_NAME);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(response => {
    return response
  },
  error => {
    if (error && error.response && error.response.data) {
      const { code, msg } = error.response.data;
      // token 过期,重新登录
      if (code === 'B0403') {
        ElMessageBox.confirm('当前页面已失效，请重新登录', '提示', {
          confirmButtonText: '确定',
          type: 'warning'
        }).then(() => {
          localStorage.clear();
          window.location.href = '/';
        });
      } else {
        ElMessage.error(msg || '系统出错');
      }
    } else {
        ElMessage.error('系统出错/网络出错');
    }
    return Promise.reject(error.message);
  }
);

// 导出 axios 实例
export default service;
