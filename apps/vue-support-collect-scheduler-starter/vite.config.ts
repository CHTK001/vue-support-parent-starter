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

// 后端只跑在 Kali 上（collect-scheduler 的 18190 实例实测在远端监听），
    // 本机不起后端进程，所以缺省指向远端而不是 127.0.0.1。
    // 与 vue-support-ai-guada / vue-support-system-starter / monitor 同一口径。
    // 注意：缺省目标指向没人监听的本机端口时，dev 代理返回的是合法 JSON 但 data 为空，
    // 不会报连接错误，排查方向容易被带偏。
    // 需要指向其他实例时用环境变量覆盖：
    //   COLLECT_API_TARGET=http://127.0.0.1:18190 pnpm dev
    const apiTarget = process.env.COLLECT_API_TARGET ?? "http://192.168.50.198:18190";
const schedulerTarget = process.env.COLLECT_SCHEDULER_TARGET ?? "http://127.0.0.1:18191";

// dev 代理必须在转发前摘掉 Origin/Referer，否则后端会判成跨域并 403。
// 为什么：changeOrigin 只改 Host，浏览器 POST 里的 Origin 会原样送到 192.168.50.198:18190；
// 而后端自 393306437（2026-10-02「收紧 CORS 任意 Origin 反射」）起只放行显式
// allowed-origins，本模块配置里没有该白名单，于是登录 POST 被判「Invalid CORS request」。
// 症状很有迷惑性：GET 不带 Origin 头，所以列表/详情都正常，只有登录进不去。
// 为什么只改 dev 不动服务端：CORS 白名单是安全配置，不该为本地开发放开。
// 生产是同源部署，前端与 API 同 host:port，不存在这个问题。
const stripOriginHeaders = (proxyServer: any) => {
  proxyServer.on("proxyReq", (proxyReq: any) => {
    proxyReq.removeHeader("origin");
    proxyReq.removeHeader("referer");
  });
};

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
        configure: stripOriginHeaders,
      },
      "/collect/api": {
        target: apiTarget,
        changeOrigin: true,
        configure: stripOriginHeaders,
      },
    },
  },
});
