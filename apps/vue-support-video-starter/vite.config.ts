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

/**
 * 后端地址。刻意**不预置远端缺省值**：实测该主机上没有部署对应的 video 后端
 * （18172 未被任何进程监听），编一个远端地址只会把「连不上」换成「连错地方」。
 * 这里保留本机地址作为显式缺省（仅在本机自己跑后端时正确），并改为可覆盖：
 *   VIDEO_API_TARGET=http://<video-host>:18172 pnpm dev
 */
const videoApiTarget = process.env.VIDEO_API_TARGET ?? "http://localhost:18172"

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
      // 后端：spring-api-support-video-starter（VideoApplication，默认 18172，无 context-path）
      "/video/api": {
        target: videoApiTarget,
        changeOrigin: true,
      },
    },
  },
});
