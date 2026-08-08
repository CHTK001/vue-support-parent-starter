import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-ai-starter",
  title: "Vue Support AI",
  server: {
    port: 8088,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      // AI 后端 (spring-support-ai-starter: 8080, context-path /api/ai)
      "/api/ai": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
