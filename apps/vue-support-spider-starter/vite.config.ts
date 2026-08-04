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
      // 前端 HTTP baseUrl = "/spider-api"（见 apps/.../app.yaml），
      // 这里把 /spider-api/foo 重写为 /foo 后转发给后端 :19091。
      "/spider-api": {
        target: "http://localhost:19091",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/spider-api/, ""),
      },
      // 兼容 @repo/spider 内 spiderApi.ts 仍使用 /spider/* 直连后端。
      "/spider": {
        target: "http://localhost:19091",
        changeOrigin: true,
      },
    },
  },
});