/**
 * vue-support-geo-starter Vite 配置
 *
 * GeoDownloader Web 版：影像/高程/历史影像/3D Tiles/MVT/OSM 矢量下载。
 * 代理 /geo/api -> 后端服务。
 */
import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * 后端地址。刻意**不预置远端缺省值**：实测该主机上没有部署对应的 geo 后端
 * （18171 未被任何进程监听），编一个远端地址只会把「连不上」换成「连错地方」。
 * 这里保留本机地址作为显式缺省（仅在本机自己跑后端时正确），并改为可覆盖：
 *   GEO_API_TARGET=http://geo-host:18171 pnpm dev
 *
 * 另外提示：缺省目标指向没人监听的端口时，dev 代理往往返回合法 JSON 但 data 为空，
 * 而不是报连接错误，排查时容易误判为「没有数据」。
 */
const geoApiTarget = process.env.GEO_API_TARGET ?? "http://localhost:18171";

export default createVite({
  appName: "vue-support-geo-starter",
  title: "GeoDownloader",
  alias: {
    "@": "apps/vue-support-geo-starter/src",
  },
  server: {
    port: 8095,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/geo/api": {
        target: geoApiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 8888,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/geo/api": {
        target: geoApiTarget,
        changeOrigin: true,
      },
    },
  },
});