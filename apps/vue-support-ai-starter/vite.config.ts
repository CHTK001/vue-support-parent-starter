import { createVite } from "@repo/vite-configs";

export default createVite({
  appName: "vue-support-ai-starter",
  title: "Vue Support AI",
  server: {
    port: 8088,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      // AI 后端 (spring-support-ai-starter: 8080)
      "/v2/ai": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // 兜底代理
      "/system": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
