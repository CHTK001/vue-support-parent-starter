import { resolve as pResolve } from "node:path";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

/**
 * 应用壳级的 Vite 别名必须穿透到测试环境：`@pages/system` 等包只挂 `src`，
 * 包本身不在 `node_modules` 挂载点下，只有 Vite 的 alias 把它们指向 `src`。
 * 没有它测试里 import "@pages/system/views/SysLogManage.vue" 会解析失败。
 */
const VITE_ALIAS: Array<{ find: string; replacement: string }> = [
  { find: "@pages/system", replacement: pResolve(process.cwd(), "../../pages/system/src") },
  { find: "@pages/monitor", replacement: pResolve(process.cwd(), "../../pages/monitor/src") },
  { find: "@pages/docker", replacement: pResolve(process.cwd(), "../../pages/docker/src") },
  { find: "@pages/hotsport", replacement: pResolve(process.cwd(), "../../pages/hotsport/src") },
  { find: "@pages/eduai", replacement: pResolve(process.cwd(), "../../pages/eduai/src") },
  { find: "@pages/ai", replacement: pResolve(process.cwd(), "../../pages/ai/src") },
  { find: "@pages/filesystem", replacement: pResolve(process.cwd(), "../../pages/filesystem/src") },
  { find: "@pages/task", replacement: pResolve(process.cwd(), "../../pages/task/src") },
  { find: "@pages/job", replacement: pResolve(process.cwd(), "../../pages/job/src") },
  { find: "@pages/message", replacement: pResolve(process.cwd(), "../../pages/message/src") },
];

/**
 * @pages/server 单元测试配置
 *
 * 本包此前没有任何单元测试配置，也没有 test 脚本，
 * 于是「页面能不能跑」只能靠人点。服务管理（ScServiceManage）上线后，
 * 过滤器类型别名归一、深度查看入口解析这类**纯逻辑**一旦回归，
 * 表现为「按钮点不动 / 打开的是死链」，编译与构建都是绿的，CI 抓不到。
 *
 * - environment: jsdom。组件测试用 @vue/test-utils 的 shallowMount，而它**即使浅挂载
 *   也需要 document**（实测在 node 环境下 10 例全部 ReferenceError: document is not
 *   defined），所以本包一旦引入组件级测试就必须用 jsdom；纯逻辑用例在 jsdom 下同样正常。
 *   之前选 node 是因为当时只有纯逻辑用例，那个前提已经不成立了。
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
  resolve: { alias: VITE_ALIAS },
  test: {
    environment: "jsdom",
    globals: true,
    // ReTable 等大组件的 installUi 安装列表较长，默认的 10000ms hook timeout 不够
    hookTimeout: 120000,
    include: ["src/**/*.spec.ts"],
  },
});