import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * 远控管理台 —— 单页面应用（mode=single）
 *
 * 页面：远控（左表单右画面）/ 被控端 / 接入码；配置经 /api/remote/config 保存到后台。
 */
export default createVite({
  appName: "vue-support-remote-starter",
  title: "远控管理台",
  server: {
    port: 8091,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
