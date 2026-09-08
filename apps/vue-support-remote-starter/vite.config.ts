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
        target: "http://localhost:8091",
        changeOrigin: true,
        bypass(req) {
          if (req.url?.startsWith("/api/remote/config")) return req.url;
          if (req.url?.startsWith("/api/remote/gateways")) return req.url;
          if (req.url?.startsWith("/api/remote/agents")) return req.url;
          if (req.url?.startsWith("/api/remote/access-codes")) return req.url;
        },
      },
      "/gateway-ws": {
        target: "ws://localhost:9002",
        ws: true,
        rewriteWsPath: true,
      },
    },
  },
});
