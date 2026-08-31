import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "pages-server",
  title: "Vue Support Server",
  server: {
    port: 8087,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/ms/server": {
        target: "http://localhost:18082",
        changeOrigin: true,
      },
      "/ms/monitor": {
        target: "http://localhost:18081",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:18082",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:18082",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
