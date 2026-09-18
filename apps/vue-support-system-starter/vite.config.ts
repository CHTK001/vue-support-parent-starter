import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-system-starter",
  title: "系统管理平台",
  publicDir: "../../public",
  server: {
    port: 8096,
    strictPort: true,
    proxy: {
      // 系统管理后台网关（服务器 nginx 8080）
      "/system/api": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },
      // 天气：Open-Meteo 免费天气 API（无需 key）
      "/weather-api": {
        target: "https://api.open-meteo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weather-api/, ""),
      },
      // 天气：BigDataCloud 反向地理编码
      "/geo-api": {
        target: "https://api.bigdatacloud.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geo-api/, ""),
      },
      // 天气：freeipapi IP 定位
      "/freeip-api": {
        target: "https://freeipapi.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/freeip-api/, ""),
      },
      // 天气：ip-api IP 定位（HTTP 免费版，HTTPS 返回 403）
      "/ip-api": {
        target: "http://ip-api.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ip-api/, ""),
      },
    },
  },
});