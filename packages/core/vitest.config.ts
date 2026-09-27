import { defineConfig } from "vitest/config";

/**
 * @repo/core 单元测试配置
 *
 * - environment: node：menu.ts 只做数据 → 路由的纯计算，不碰 DOM / window
 * - globals: 提供 describe/it/expect 全局变量，测试文件仍显式 import（便于 tsc 独立类型检查）
 * - include: 只收本包 src 下的 *.spec.ts
 *
 * 运行：pnpm --filter @repo/core test
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.spec.ts"],
  },
});
