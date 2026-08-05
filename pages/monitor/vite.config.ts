import { createVite } from "../turbo/vite/createVite.ts";

export default createVite({
  appName: "pages-monitor",
  title: "Vue Support Monitor",
  server: {
    port: 8089,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/ms/monitor": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
});