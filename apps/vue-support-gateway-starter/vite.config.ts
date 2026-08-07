import { createVite } from "@repo/vite-configs";

export default createVite({
  appName: "vue-support-gateway-starter",
  title: "Vue Support Gateway",
  server: {
    port: 7788,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/admin/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:8080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});