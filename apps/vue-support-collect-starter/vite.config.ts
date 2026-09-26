/**
 * 采集调度一体化平台前端 Vite 配置。
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
  appName: "vue-support-collect-starter",
  title: "采集调度一体化平台",
  // 数据源台账复用 @pages/datasource，alias 指向真实目录，
  // 这样 "@pages/datasource/src/views/ScDataSourceView.vue" 才能解析到 .vue 文件
  alias: {
    "@pages/datasource": "pages/datasource",
  },
  server: {
    port: 19096,
    strictPort: false,
    proxy: {
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
