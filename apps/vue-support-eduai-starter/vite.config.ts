import { createVite } from "../../turbo/vite/createVite";

/**
 * 教育 AI 应用 Vite 配置。
 *
 * 后端代理指向 spring-support-eduai-starter (默认 8080)。
 */
export default createVite({
  appName: "vue-support-eduai-starter",
  title: "教育 AI 工作台",
  server: {
    port: 19093,
    strictPort: false,
    proxy: {
      "/v2/edu": {
        target: "http://localhost:19095",
        changeOrigin: true,
      },
      "/edu-api": {
        target: "http://localhost:19095",
        changeOrigin: true,
      },
    },
  },
});