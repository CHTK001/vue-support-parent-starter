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
 * 统一转给 AI_API_TARGET（默认 http://127.0.0.1:8787，CLI 上通过
 * set AI_API_TARGET=http://127.0.0.1:8787 或 export AI_API_TARGET= 覆盖）。
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
import type { ProxyOptions } from "vite";

/** 开发包入口：base 走同源，@/ 指向 pages/ai/src 业务层（createVite 共享 @repo/* 别名录不包含此层）。 */
const apiTarget = process.env.AI_API_TARGET ?? "http://127.0.0.1:8787";

/**
 * dev 代理公共处理：转发前剥掉浏览器的 Origin 头。
 *
 * <p>changeOrigin 只改写 Host、不改 Origin；后端 ApiCorsFilter 是白名单制，
 * 见到陌生源（如 127.0.0.1:15689）一律 403「Invalid CORS request」。GET 请求
 * 不带 Origin 侥幸能用，而 POST（登录 /v2/user/login、生成任务提交等全部写接口）
 * 必挂——2026-11-19 实测登录 403。剥掉 Origin 后请求与 curl 同态（非 CORS 请求），
 * 后端按同源放行，无需为每个 vite 端口维护后端白名单再重启服务。</p>
 */
const withoutBrowserOrigin: Pick<ProxyOptions, "configure"> = {
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
  },
};

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
        ...withoutBrowserOrigin,
      },
      // 管理接口（rootHttp）
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        ...withoutBrowserOrigin,
      },
      // 登录鉴权：未代理时 403，且本应用本地跑时与后端同源（Origin 被接受）。
      // 注意只代理 **POST**：/login 同时是 SPA 的登录页路由（守卫 next({path:'/login'})），
      // GET 也转给后端的话，dev 下登录页会直接渲染出后端那句「不支持GET请求」的 JSON，
      // 登录页永远打不开（2026-11-10 实测）。GET 回落交给前端路由。
      //
      // vite 8 实测：bypass 返回字符串路径只是改写 req.url 继续 next()，而 pages/ai
      // 没有物理 index.html（build 时才落盘），链上无人接手 → GET /login 直接 404。
      // 因此 GET 在这里直接 302 到 /：SPA 壳照常返回，路由守卫把未登录用户送回
      // /login（客户端跳转，不再打服务器）。res 已结束后再返回字符串，vite 检测到
      // writableEnded 会停止后续处理，不会重复走代理。
      "/login": {
        target: apiTarget,
        changeOrigin: true,
        ...withoutBrowserOrigin,
        bypass: (req, res) => {
          if (req.method === "GET") {
            res.statusCode = 302;
            res.setHeader("Location", "/");
            res.end();
            return "/";
          }
          return undefined;
        },
      },
      // 登录态续期与登出
      "/logout": {
        target: apiTarget,
        changeOrigin: true,
        ...withoutBrowserOrigin,
      },
    },
  },
});
