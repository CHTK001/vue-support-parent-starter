import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-remote-starter",
  title: "远控管理台",
  server: {
    port: 8091,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/api/remote": {
        target: "http://localhost:9001",
        changeOrigin: true,
      },
    },
  },
});
