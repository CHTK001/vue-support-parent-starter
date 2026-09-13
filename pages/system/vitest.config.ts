import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

/**
 * @pages/system 单元测试配置
 *
 * - environment: jsdom（组件测试需要浏览器环境）
 * - plugins: @vitejs/plugin-vue 解析 .vue 单文件组件
 * - globals: 启用 describe/it/expect 全局，无需逐个 import
 * - include: 仅收集 src 下的 *.spec.ts
 *
 * 运行：pnpm --filter @pages/system test   或   cd pages/system && pnpm test
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.spec.ts"],
    server: {
      deps: {
        // 组件测试中会对 @repo/utils / @repo/ui 做 vi.mock，无需预打包
        inline: [/@repo\//],
      },
    },
  },
});
