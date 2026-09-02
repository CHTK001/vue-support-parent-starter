/**
 * vue-support-geo-starter Vite 配置
 *
 * GeoDownloader Web 版：影像/高程/历史影像/3D Tiles/MVT/OSM 矢量下载。
 * 代理 /geo/api -> 后端 Spring Boot（端口 18171）。
 */
import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-geo-starter",
  title: "GeoDownloader",
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
});
