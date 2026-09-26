import { defineConfig } from "vitest/config";

/**
 * @repo/utils 单元测试配置
 *
 * - environment: node（sse/token 等模块不依赖 DOM；getAccessToken 在无 window 时直接返回空串）
 * - globals: 启用 describe/it/expect 全局，无需逐个 import
 * - include: 仅收集 src 下的 *.spec.ts
 *
 * 运行：pnpm --filter @repo/utils test
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.spec.ts"],
  },
});
