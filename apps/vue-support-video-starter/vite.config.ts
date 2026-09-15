/**
 * vue-support-video-starter —— 视频资源浏览与播放应用
 *
 * 开发代理到本地 spring-api-support-common-video-starter 服务。
 */
import { createVite } from "../../turbo/vite/createVite.ts";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** 当前应用源码根目录（供 @ 别名解析业务 src） */
const APP_ROOT = resolve(fileURLToPath(import.meta.url), "..");

export default createVite({
  appName: "vue-support-video-starter",
  title: "视频资源中心",
  alias: {
    "@": resolve(APP_ROOT, "src"),
  },
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
