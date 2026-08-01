import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-system-starter",
  title: "Vue Support System",
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // 系统服务代理到后端（spring-api-support-system-starter: 18170/system/api）
      "/system/api": {
        target: "http://localhost:18170",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/system\/api/, "/system/api"),
      },
      // 通用请求路径兜底代理
      "/api": {
        target: "http://localhost:18170",
        changeOrigin: true,
      },
    },
  },
});
