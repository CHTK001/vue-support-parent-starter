/**
 * AI 控制台（@pages/ai）开发服务器配置。
 *
 * <p><strong>入口</strong>：物理上归档在 pages/ai（拥有完整 route table、route
 * 入口、node_modules 与全部业务页生产代码）；apps/vue-support-ai-starter 只提供
 * 空壳 stub（空 src、public 里放图片/文件预览资产）和 dist/app.example.yaml，
 * 不能作为本身的前端 root 使用。</p>
 *
 * <p><strong>代理</strong>：/v2（业务接口：chat / setting / auth / user / models /
 * usage 等）与 /api（管理接口：providers / mcp / agents / services / skills 等）
 * 统一转给 AI_API_TARGET（默认 http://localhost:8787，CLI 上通过
 * set AI_API_TARGET=http://localhost:8787 或 export AI_API_TARGET= 覆盖）。
 * vite 没有读对目标时流量会静默导到旧后端，登录与弹窗检查全是假失败，
 * 所以验收脚本每次跑之前必须先用 curl 确认 /api/providers 返回 200 + 2 行。</p>
 *
 * <p><strong>主机与端口</strong>：0.0.0.0 + strictPort，确保验收脚本里的
 * http://localhost:15689 能直达，也避免开发机多开时端口被占位。</p>
 *
 * <p><strong>入口脚本</strong>：共享 index.html 模板约定 /src/main.ts，页面的
 * 真实入口是 src/main.js，所以必须覆盖 entry，否则 dev 下 index.html 里挂
 * 一个不存在的 /src/main.ts → 白屏。</p>
 */
import { createVite, WORKSPACE_ROOT } from "../../turbo/vite/createVite";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

/** 开发包入口：base 走同源，@/ 指向 pages/ai/src 业务层（createVite 共享 @repo/* 别名录不包含此层）。 */
const apiTarget = process.env.AI_API_TARGET ?? "http://localhost:8787";

export default createVite({
  appName: "vue-support-ai-starter",
  title: "AI 控制台",
  // 页面的入口是 src/main.js（共享模板默认是 main.ts）
  entry: "/src/main.js",
  // @/ 业务别名（多个 Pages 包共享 @ 时，只在此处为 pages/ai 补入源目录）
  alias: { "@": path.join(WORKSPACE_ROOT, "pages", "ai", "src") },
  /**
   * Tailwind v4：src/tailwind.css 是 `@import "tailwindcss"`，必须由该插件编译。
   * 缺了它 flex-1 / min-h-0 / 尺寸类全部丢失 —— 表现是外壳侧栏图标被撑到原始
   * SVG 尺寸、列表页像空白（2026-11-05 实测：补插件前后对比截图差异明显）。
   * createVite 基线只带 UnoCSS（koi 主题口径），不含 tailwind，故在此显式挂入。
   */
  plugins: [tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 15689,
    strictPort: true,
    proxy: {
      // 业务接口（v2Http）
      "/v2": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 管理接口（rootHttp）
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 登录鉴权：未代理时 403，且本应用本地跑时与后端同源（Origin 被接受）
      "/login": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 登录态续期与登出
      "/logout": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
