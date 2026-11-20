/**
 * 验收专用 vite 配置（仅供验收探针使用，不进入日常开发）。
 *
 * <p>在默认 {@link ./vite.config.ts} 之上只覆盖 dev server：
 * 独立端口 17777（strictPort，被占用即失败，避免静默漂移到他会话端口）、
 * 关闭 HMR（探针不需要热更新）。后端目标仍由 AI_API_TARGET 环境变量注入
 * （本验收固定指向 http://172.16.9.194:8787，不改默认 vite.config.ts）。</p>
 */
import { mergeConfig } from "vite";
import base from "./vite.config";

export default mergeConfig(base as any, {
  server: {
    port: 17777,
    strictPort: true,
    hmr: false,
  },
});
