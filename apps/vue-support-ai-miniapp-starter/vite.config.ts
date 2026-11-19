import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

/**
 * AI 小程序端（uni-app + Vue3）Vite 配置。
 *
 * 与 PC 端 apps/vue-support-ai-starter 共用同一套后端与同一套应用装配框架：
 * 业务代码只写一行 `import { createContextApp } from "@repo/app"`，
 * 由 `platform: "wechat-miniapp"` 走小程序分支（uni storage / uni.request / token）。
 *
 * 这里把 `@repo/app` 解析到小程序实现，原因只有一个：
 * 包根 `turbo/app/src/index.ts` 有 `import "virtual:uno.css"` 这类 Web 副作用，
 * 而小程序构建没有 UnoCSS 插件，也不该吃 element-plus / vue-router。
 * 换实现、不换 import —— 等价于 RN 的 platform 文件、C 的 #ifdef。
 *
 * 用正则做精确匹配（写成字符串会把 `@repo/app/wechat-miniapp` 一起吃掉）。
 * 同时不经过 node_modules 链接：小程序依赖集独立（uni-app 锁 3.0.0-alpha 系列），
 * 避免为一处 workspace 链接重装整仓依赖、动到其他会话在途的 pnpm-lock.yaml。
 */
const wechatMiniappEntry = fileURLToPath(
  new URL("../../turbo/app/src/wechat-miniapp/index.ts", import.meta.url),
);

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: [{ find: /^@repo\/app$/, replacement: wechatMiniappEntry }],
  },
});
