import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * vue-support-hotspot-starter — APM 热点观测台（前后端分离）
 *
 * - dev：vite 8890 端口，/api/apm 代理到 spring-support-hotsport-starter (:8086)
 * - build：产物 dist/ 由构建脚本拷贝至 spring 模块 src/main/resources/static/
 *   实现单 jar 前后端一体交付
 */
export default createVite({
  appName: "vue-support-hotspot-starter",
  title: "APM 热点观测台",
  // 业务页以 "@pages/hotsport/src/..." 形式引用，alias 目标指向页面根 pages/hotsport
  alias: {
    "@pages/hotsport": "pages/hotsport",
  },
  server: {
    port: 8890,
    strictPort: true,
    proxy: {
      // APM 观测数据 API → 后端 spring-support-hotsport-starter
      "/api/apm": {
        target: "http://127.0.0.1:8086",
        changeOrigin: true,
      },
    },
  },
});
