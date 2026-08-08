import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-system-starter",
  title: "Vue Support System",
  server: {
    port: 5173,
    strictPort: true,
    warmup: {
      // 首屏核心模块预热，避免高并发转换导致 headless 浏览器连接超时
      clientFiles: ["/src/main.ts", "/@fs/D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/framework.ts"],
    },
    proxy: {
      // 系统管理后台网关：spring-api-support-system-starter: 18170/system/api
      "/system/api": {
        target: "http://localhost:18170",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/system\/api/, "/system/api"),
      },
    },
  },
});