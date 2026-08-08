import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-system-starter",
  title: "Vue Support System",
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // 系统管理后台网关：spring-api-support-system-starter: 18170/system/api
      "/system/api": {
        target: "http://localhost:18170",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/system\/api/, "/system/api"),
      },
      // IP 地理定位代理：第三方 API 默认无 CORS，dev 期走本地反代，生产由 nginx 反代
      "/ip-geo": {
        target: "https://ipwho.is",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ip-geo/, ""),
      },
    },
  },
});