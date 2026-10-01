import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * vue-support-template-starter —— Vue 应用脚手架模板
 *
 * 单页应用（mode=single）：预置 ElementPlus + 全局图标库 + ReIcon，
 * 业务侧通过 @repo/ui/re-xxx 动态挂载。
 */

/**
 * 后端地址。刻意**不预置远端缺省值**：实测该主机上没有监听 18171，
 * 编一个远端地址只会把「连不上」换成「连错地方」。
 * 这里保留本机地址作为显式缺省（仅在本机自己跑后端时正确），并改为可覆盖：
 *   TEMPLATE_API_TARGET=http://<backend-host>:18171 pnpm dev
 */
const templateApiTarget =
  process.env.TEMPLATE_API_TARGET ?? "http://localhost:18171";

export default createVite({
  appName: "vue-support-template-starter",
  title: "Vue Support Template",
  server: {
    port: 8090,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/system/api": {
        target: templateApiTarget,
        changeOrigin: true,
      },
    },
  },
});