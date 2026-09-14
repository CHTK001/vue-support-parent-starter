/**
 * vue-support-video-starter —— 视频资源浏览与播放应用
 *
 * 开发代理到本地 spring-api-support-common-video-starter 服务。
 */
import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-video-starter",
  title: "视频资源中心",
  server: {
    port: 8095,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      // 后端：spring-api-support-common-video-starter（VideoSearchController）。
      // 无独立端口配置，随部署宿主调整 target 即可。
      "/video/api": {
        target: "http://localhost:18171",
        changeOrigin: true,
      },
    },
  },
});
