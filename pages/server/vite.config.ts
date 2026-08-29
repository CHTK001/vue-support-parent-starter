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
        target: "http://localhost:18082",
        changeOrigin: true,
      },
      // guacd Զ�� WebSocket(�迪�� ws ͸��)
      "/ws/ms/server": {
        target: "http://localhost:18082",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
