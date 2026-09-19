/**
 * vue-support-geo-starter Vite 配置
 *
 * GeoDownloader Web 版：影像/高程/历史影像/3D Tiles/MVT/OSM 矢量下载。
 * 代理 /geo/api -> 后端服务。
 */
import { createVite } from "../../turbo/vite/createVite.ts";

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
        target: "http://localhost:18171",
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
        target: "http://localhost:18171",
        changeOrigin: true,
      },
    },
  },
});
