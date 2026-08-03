import { createVite } from "../../turbo/vite/createVite";

/**
 * 爬虫中心应用 Vite 配置。
 *
 * 复用 @repo/vite 提供的 createVite（apps/* 的标准入口），
 * 后端代理指向 spring-support-spider-starter 服务。
 */
export default createVite({
  appName: "vue-support-spider-starter",
  title: "爬虫中心",
  server: {
    port: 19092,
    strictPort: false,
    proxy: {
      "/spider-api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/spider": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});