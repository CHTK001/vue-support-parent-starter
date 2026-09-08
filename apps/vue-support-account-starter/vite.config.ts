import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-account-starter",
  title: "账号管理",
  server: {
    port: 8097,
    strictPort: true,
    proxy: {
      // 账号管理 API
      "/api/account": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  config: {
    // 部署在 nginx /account/ 路径下，资源使用相对路径
    base: "/account/",
  },
});