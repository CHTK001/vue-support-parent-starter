import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * vue-support-template-starter —— 组件模板预览与调试应用
 *
 * 单页面应用（mode=single），注册 ElementPlus + 全局图标 +
 * ReIcon，全部组件模板在运行时通过 @repo/ui/re-xxx 动态加载。
 */
export default createVite({
  appName: "vue-support-template-starter",
  title: "Vue Support Template",
  server: {
    port: 8090,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      "/system/api": {
        target: "http://localhost:18171",
        changeOrigin: true,
      },
    },
  },
});