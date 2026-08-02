import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-gateway-starter",
  title: "Vue Support Gateway",
  server: {
    port: 7788,
    strictPort: true,
    proxy: {
      // 网关后端代理（spring-api-support-gateway-starter: 18300/gateway）
      "/gateway/api": {
        target: "http://localhost:18300",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gateway\/api/, "/gateway/api"),
      },
      // 管理接口
      "/admin/api": {
        target: "http://localhost:18300",
        changeOrigin: true,
      },
      // 远程会话 WebSocket
      "/ws": {
        target: "ws://localhost:18300",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
