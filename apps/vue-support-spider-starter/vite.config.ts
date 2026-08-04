import { createVite } from "../../turbo/vite/createVite";

/**
 * 爬虫中心应用 Vite 配置。
 *
 * 复用 @repo/vite 提供的 createVite（apps/* 的标准入口），
 * 后端代理指向 spring-support-spider-starter 服务。
 */
const viteConfig = createVite({
  appName: "vue-support-spider-starter",
  title: "爬虫中心",
  server: {
    port: 19092,
    strictPort: false,
    proxy: {
      "/spider-api": {
        target: "http://localhost:19091",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/spider-api/, ""),
      },
    },
  },
  config: {
    optimizeDeps: {
      // rsocket-*/rsocket-core 是 Flow 语法，rolldown 解析失败；排除掉
      exclude: ["rsocket-core", "rsocket-websocket-client", "rsocket-flowable"],
    },
  },
});
export default viteConfig;
