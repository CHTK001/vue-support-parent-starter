import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "pages-server",
  title: "Vue Support Server",
  server: {
    port: 8090,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      // REST 接口代理到服务器资产后端(spring-support-server-starter)
      "/ms/server": {
        target: "http://localhost:8082",
        changeOrigin: true,
      },
      // guacd 远控 WebSocket(需开启 ws 透传)
      "/ws/ms/server": {
        target: "http://localhost:8082",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
