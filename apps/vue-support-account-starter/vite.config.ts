import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-account-starter",
  title: "账号管理",
  server: {
    port: 8097,
    strictPort: true,
    proxy: {
      // 后端账号管理 API
      "/api/account": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
