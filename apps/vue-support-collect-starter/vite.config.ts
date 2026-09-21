/**
 * 采集调度一体化平台前端 Vite 配置。
 *
 * 后端为 spring-api-support-collect-starter（默认 18190，context-path /collect/api）。
 * 代理前缀即后端 context-path，不做 rewrite：/collect/api/v2/collect/** -> 18190 原始路径。
 */
import { createVite } from "../../turbo/vite/createVite.ts";

const apiTarget = process.env.COLLECT_API_TARGET ?? "http://127.0.0.1:18190";

export default createVite({
  appName: "vue-support-collect-starter",
  title: "采集调度一体化平台",
  server: {
    port: 19096,
    strictPort: false,
    proxy: {
      "/collect/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
