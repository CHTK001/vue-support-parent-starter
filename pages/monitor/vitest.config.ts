import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

/**
 * @pages/monitor 单元测试配置
 *
 * 服务管理（协议服务器节点 Server + ServerFilter 编排）原先住在 @pages/server，
 * 按「app 只是壳、功能归 pages/xx」的约定迁到这里，随之带过两类门禁：
 *   - 纯逻辑用例（过滤器类型别名归一、深度查看入口解析、列表展示口径、确认框语义）
 *   - 组件级用例（file-storage 配置面板的分区渲染）
 *
 * - environment: jsdom。组件测试用 @vue/test-utils 的 mount，而它**即使浅挂载
 *   也需要 document**（实测在 node 环境下全部 ReferenceError: document is not
 *   defined），所以本包一旦引入组件级测试就必须用 jsdom；纯逻辑用例在 jsdom 下同样正常。
 * - plugins: 需要 @vitejs/plugin-vue，因为注册表模块 import 了三个 .vue 面板，
 *   markRaw(ScFileStorageFilterPanel) 在模块加载时就会求值。
 *
 * 运行方式：pnpm --filter @pages/monitor test
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.spec.ts"],
  },
});
