import axios from "axios";
import { ElMessage } from "element-plus";

const request = axios.create({
  baseURL: (import.meta as any).env?.VITE_APP_BASE_API || "",
  timeout: 30000
});

request.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      ElMessage.error(res.message || "请求失败");
      return Promise.reject(new Error(res.message || "请求失败"));
    }
    return res;
  },
  (error) => {
    ElMessage.error(error.message || "请求失败");
    return Promise.reject(error);
  }
);

export default request;