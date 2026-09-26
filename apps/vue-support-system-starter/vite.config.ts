import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-system-starter",
  title: "系统管理平台",
  publicDir: "../../public",
  server: {
    port: 8096,
    strictPort: true,
    proxy: {
      // 系统管理控制台后端：部署在 192.168.50.198 的 API（context-path /system/api）。
      // 前端本地跑，后端在 198，故代理指向远端而不是 localhost。
      "/system/api": {
        target: "http://192.168.50.198:18170",
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
      // 台风：浙江省水利厅台风网开放接口（后台未实现 /v2/typhoon/* 时的兜底数据源）
      "/typhoon-api": {
        target: "https://typhoon.slt.zj.gov.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/typhoon-api/, "/Api"),
      },
    },
  },
});