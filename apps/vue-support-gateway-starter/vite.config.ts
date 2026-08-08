import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-gateway-starter",
  title: "Vue Support Gateway",
  server: {
    port: 7788,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8083",
        changeOrigin: true,
      },
      "/admin/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:8081",
        changeOrigin: true,
        ws: true,
      },
      "/health": {
        target: "http://127.0.0.1:8083",
        changeOrigin: true,
      },
      "/agents": {
        target: "http://127.0.0.1:8083",
        changeOrigin: true,
      },
      "/targets": {
        target: "http://127.0.0.1:8083",
        changeOrigin: true,
      },
      "/sessions": {
        target: "http://127.0.0.1:8083",
        changeOrigin: true,
      },
    },
  },
});