import { createVite } from "../../turbo/vite/createVite.ts";
import path from "node:path";
import vue from "@vitejs/plugin-vue";

/** pages/ai 源码根目录（app 壳通过别名直接引用源码，避免依赖构建产物） */
const AI_SRC = path.resolve(__dirname, "../../pages/ai/src");

/**
 * AI 控制台应用 Vite 配置。
 *
 * - framework: "react" → 启用 @vitejs/plugin-react，入口 /src/main.tsx
 * - plugins: 追加 @vitejs/plugin-vue（@repo/app 统一导出含 .vue 组件，需解析）
 * - alias: 注入 pages/ai 的 @ / @common / @renderer 别名（与 pages/ai/vite.config.ts 对齐）
 * - 后端代理指向 AI 后端服务（端口见 proxy 配置）
 */
export default createVite({
  appName: "vue-support-ai-starter",
  title: "AI 控制台",
  framework: "react",
  plugins: [vue()],
  alias: {
    "@": AI_SRC,
    "@common": path.resolve(AI_SRC, "common"),
    "@renderer": path.resolve(AI_SRC, "renderer"),
  },
  server: {
    port: 19094,
    strictPort: false,
    proxy: {
      "/v2": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
