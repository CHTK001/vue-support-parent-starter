/**
 * vue-support-ai-starter 壳入口。
 *
 * <p><b>业务归 @pages/ai，本应用只做 Vite 启动壳</b>：AI 控制台的视图、路由、
 * 启动装配、App 壳组件由独立技术栈承载（首页布局自持，登录页 / 路由守卫 /
 * token 存储复用 vue 框架，见 pages/ai/src/main.js），物理上住在 @pages/ai
 * 包内，本文件只负责按 Vite 约定触发挂载。</p>
 *
 * <p><strong>为什么深导入 {@code @pages/ai/main.js} 而不是 {@code @pages/ai}</strong>：
 * 包根 {@code index.ts} 是共享业务包的公共出口，只应暴露可复用的页面/组件/API
 * （如 `/embed`、`/menu` 深导入供 system/eduai 宿主内嵌），<b>不应暴露应用启动入口</b>。
 * 若经过包根取 {@code mountAiApp}，会把整个 AI 壳（App.vue + element-plus +
 * tailwind/refactor 全局样式）变成公共导出，任何 host 一旦误用包根就被拖入整壳。
 * 这里走深导入 {@code @pages/ai/main.js}，把「应用入口由 apps 决定」写死，pages 包根保持干净。</p>
 *
 * <p>路径可用性：本应用 vite.config 的 alias 将 {@code @pages/ai} 指向
 * {@code pages/ai/src}，故 {@code @pages/ai/main.js} 解析为 {@code pages/ai/src/main.js}；
 * pnpm exports（{@code "./*": "./src/*"}）兜底与之一致。</p>
 */
import { mountAiApp } from "@pages/ai/main.js";

void mountAiApp();