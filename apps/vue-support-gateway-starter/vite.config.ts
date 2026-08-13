import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * vue-support-gateway-starter 应用入口
 *
 * 单页面模式：直接挂载 RemoteControl（左侧 ConnectionForm 配置 + 右侧 Viewer 远控画面）。
 *
 * 通过 unoTheme 将 Element Plus CSS 变量映射为 UnoCSS 工具类
 * （bg-el-bg / text-el-text-primary / border-el-border-light 等），
 * 仅作用于本应用。共享基线 turbo/vite/createVite.ts 提供可选 unoTheme 参数，
 * 业务侧按需扩展，未传入时保持零侵入。
 */
const elColorAliases: Record<string, string> = {
  // 文本
  "el-text-primary": "var(--el-text-color-primary)",
  "el-text-regular": "var(--el-text-color-regular)",
  "el-text-secondary": "var(--el-text-color-secondary)",
  "el-text-placeholder": "var(--el-text-color-placeholder)",
  "el-text-disabled": "var(--el-text-color-disabled)",
  // 背景
  "el-bg": "var(--el-bg-color)",
  "el-bg-page": "var(--el-bg-color-page)",
  "el-bg-overlay": "var(--el-bg-color-overlay)",
  // 边框
  "el-border": "var(--el-border-color)",
  "el-border-light": "var(--el-border-color-light)",
  "el-border-lighter": "var(--el-border-color-lighter)",
  "el-border-extra-light": "var(--el-border-color-extra-light)",
  // 填充
  "el-fill": "var(--el-fill-color)",
  "el-fill-light": "var(--el-fill-color-light)",
  "el-fill-lighter": "var(--el-fill-color-lighter)",
  "el-fill-blank": "var(--el-fill-color-blank)",
  // 主色
  "el-primary": "var(--el-color-primary)",
  "el-primary-light-3": "var(--el-color-primary-light-3)",
  "el-primary-light-5": "var(--el-color-primary-light-5)",
  "el-primary-light-7": "var(--el-color-primary-light-7)",
  "el-primary-light-8": "var(--el-color-primary-light-8)",
  "el-primary-light-9": "var(--el-color-primary-light-9)",
  "el-primary-dark-2": "var(--el-color-primary-dark-2)",
  // 语义色
  "el-success": "var(--el-color-success)",
  "el-success-light-9": "var(--el-color-success-light-9)",
  "el-warning": "var(--el-color-warning)",
  "el-warning-light-9": "var(--el-color-warning-light-9)",
  "el-danger": "var(--el-color-danger)",
  "el-danger-light-9": "var(--el-color-danger-light-9)",
  "el-info": "var(--el-color-info)",
  "el-info-light-9": "var(--el-color-info-light-9)",
};

export default createVite({
  appName: "vue-support-gateway-starter",
  title: "Vue Support Gateway",
  unoTheme: elColorAliases,
  server: {
    port: 7788,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://172.16.0.40:18090",
        changeOrigin: true,
      },
      "/admin/api": {
        target: "http://172.16.0.40:18090",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://172.16.0.40:18182",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
