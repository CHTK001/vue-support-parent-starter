import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

/**
 * @pages/server 单元测试配置
 *
 * 本包此前没有任何单元测试配置，也没有 test 脚本，
 * 于是「页面能不能跑」只能靠人点。服务管理（ScServiceManage）上线后，
 * 过滤器类型别名归一、深度查看入口解析这类**纯逻辑**一旦回归，
 * 表现为「按钮点不动 / 打开的是死链」，编译与构建都是绿的，CI 抓不到。
 *
 * - environment: node。本包的测试只覆盖纯函数（注册表解析、入口 URL 拼装），
 *   不挂载组件，因此不需要 jsdom——顺带避开 catalog 里并未收录 jsdom、
 *   只能靠传递依赖碰巧装上的问题（pages/system 用了 jsdom，那是它的选择，
 *   不是本包的需要）。
 * - plugins: 需要 @vitejs/plugin-vue，因为注册表模块 import 了三个 .vue 面板，
 *   markRaw(ScFileStorageFilterPanel) 在模块加载时就会求值。
 * - include: 与 pages/system 保持一致，收 src 下的 *.spec.ts
 *   （注意：注释里不能写 src/ 加上双星号加斜杠的 glob 写法——其中的星号斜杠
 *     会提前闭合本块注释，把后面的内容当成代码，esbuild 报 Unexpected "*"）
 *
 * 运行方式：pnpm --filter @pages/server test
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.spec.ts"],
  },
});