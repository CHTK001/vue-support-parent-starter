import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      "/ms/monitor": {
        target: "http://127.0.0.1:18081",
        changeOrigin: true,
      },
      "/ms/server": {
        target: "http://127.0.0.1:18081",
        changeOrigin: true,
      },
      "/ws/ms/server": {
        target: "http://127.0.0.1:18081",
        ws: true,
        changeOrigin: true,
      },
      "/api/apm": {
        target: "http://127.0.0.1:8582",
        changeOrigin: true,
      },
      "/agent": {
        target: "http://127.0.0.1:8582",
        changeOrigin: true,
      },
      "/monitor/api": {
        target: "http://127.0.0.1:19180",
        changeOrigin: true,
      },
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
