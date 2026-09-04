import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "pages-monitor",
  title: "Vue Support Monitor",
  server: {
    port: 8089,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      // 与 apps/vue-support-monitor-starter(5174) 对齐，走公网服务器真实链路
      // （本地 18081 后端未常驻，历史配置会导致 8089 全页面无数据）
      "/ms/monitor": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },
      "/api": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },
    },
  },
});