import { createVite } from "../../turbo/vite/createVite.ts";

/** dev / preview 共用的后端代理配置 */
const proxy = {
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
};

export default createVite({
  appName: "pages-server",
  title: "Vue Support Server",
  server: {
    port: 8087,
    strictPort: true,
    host: "0.0.0.0",
    proxy,
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy,
  },
});
