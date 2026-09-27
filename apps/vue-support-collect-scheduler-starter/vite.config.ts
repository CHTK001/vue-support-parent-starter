/**
 * 采集调度一体化平台前端 Vite 配置。
 *
 * 结构对齐后端：一个「采集调度系统」app，依赖两个平级 pages 模块
 *   采集侧 @pages/collect（平台总览 + 数据采集）
 *   调度侧 @pages/job   （调度中心）
 *
 * 后端是多节点：SINGLE(18190) 跑采集业务，SCHEDULER(18191) 跑调度控制台。
 * 代理前缀即后端 context-path，不做 rewrite：/collect/api/v2/collect/** -> 18190 原始路径。
 *
 * 调度控制台（/v2/scheduler/**）必须打到 SCHEDULER 节点：执行器注册表只在
 * 调度中心角色的进程里有，单机角色的注册表恒为空，「在线节点」永远查不到东西。
 * 所以这里把更长的前缀写在前面，先匹配到的先生效。
 *
 * 两个目标都可用环境变量覆盖：COLLECT_API_TARGET / COLLECT_SCHEDULER_TARGET。
 */
import { createVite } from "../../turbo/vite/createVite.ts";

const apiTarget = process.env.COLLECT_API_TARGET ?? "http://127.0.0.1:18190";
const schedulerTarget = process.env.COLLECT_SCHEDULER_TARGET ?? "http://127.0.0.1:18191";

export default createVite({
  appName: "vue-support-collect-scheduler-starter",
  title: "采集调度一体化平台",
  // alias 指向各 pages 的真实目录，这样包内引用（含 "@pages/xxx/src/views/*.vue"
  // 这类深路径）才能解析到 .vue 文件，而不是只走 workspace 的入口。
  alias: {
    "@pages/collect": "pages/collect",
    "@pages/job": "pages/job",
    "@pages/datasource": "pages/datasource",
  },
  server: {
    port: 19096,
    strictPort: false,
    proxy: {
      // 数据源模块接口在 context-path 下（前端已按 httpConfig.baseUrl 注入 /collect/api/ms/datasource），
      // 因此由下面的 /collect/api 前缀统一代理，不需要单独条目。
      // 顺序敏感：调度控制台前缀更长，必须排在通用前缀前面
      "/collect/api/v2/scheduler": {
        target: schedulerTarget,
        changeOrigin: true,
      },
      "/collect/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
