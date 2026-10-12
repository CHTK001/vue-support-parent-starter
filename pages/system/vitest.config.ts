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
  resolve: {
    /**
     * 必须去重 element-plus，否则本页所有「断言提示文案」的用例都会假失败。
     *
     * 现象：vi.mock("element-plus") 之后，页面自己 import 的 ElMessageBox 被替身接管
     * （断言能过），但 @repo/core 里 message.success(...) 一次都打不到替身上
     * （Number of calls: 0）。
     *
     * 根因：磁盘上存在**两份** element-plus@2.14.3，pnpm 的 peer 哈希不同：
     *   element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_  -> packages/core、packages/ui、packages/theme
     *   element-plus@2.14.3_vue@3.5.40_typescript@6.0.3_  -> pages/system 及其 spec
     * spec 注册的替身只挂在 6.0.3 那份上，而 packages/core/src/msg.ts 解析到的是
     * 5.9.3 那份，于是 @repo/core 的提示打到了真实的 Element Plus 上。
     *
     * 哈希差异的来源是 typescript 版本：apps/vue-support-ai-guada 与 pages/ai
     * 声明 typescript ^6.0.2（解析为 6.0.3），绕过了 pnpm-workspace.yaml 里
     * catalog 的 ^5.7.3（解析为 5.9.3），全仓其余 30 个包走的都是 catalog。
     * 把 typescript 统一回 catalog 属于跨仓的版本决策，且会牵动构建产物，
     * 不应由测试配置单方面决定；这里只在测试侧去重，保证断言打在同一个模块实例上。
     */
    dedupe: ["element-plus", "vue"],
  },
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
