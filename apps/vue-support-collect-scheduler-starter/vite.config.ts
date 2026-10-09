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
// 调度节点同样跑在 Kali 上（198:18191 实测响应，缺 token 时 403）。
// 缺省曾指向 127.0.0.1:18191 —— 本机没人监听，平台总览的调度摘要/节点列表
// 恒报 ECONNREFUSED（dev 日志每分钟刷红），与 apiTarget 的口径对齐改为远端。
const schedulerTarget = process.env.COLLECT_SCHEDULER_TARGET ?? "http://192.168.50.198:18191";

// 数据源中心（/ms/datasource/** 与 /ms/monitor/**）由 datasource-hub 后端提供，
// 与 monitor 应用共用同一个 hub（8081）。为什么不能打到 18190：采集后端内嵌的
// datasource-hub 是旧构建，只有 /ms/datasource/**（列表 2 条），没有任何
// /ms/monitor/** 控制台端点（DbConsole/Etcd/Influxdb/Nacos/Neo4j/Nginx/RedisManage
// 全部 S0503C0000 未映射），数据源中心控制台会整体 404。
// 打到 hub 还有一致性收益：列表与控制台用同一注册表的同一批 datasourceId，
// 不会出现「列表读 18190 的 id=2、控制台打 8081 的 id=2（nacos）」串库。
// 令牌互通已实测：18190 签发的 token 在 8081 上 list/redis-manage 均可用。
//   COLLECT_HUB_TARGET=http://127.0.0.1:8081 pnpm dev 可覆盖。
//
// 前缀处理按 hubTarget 分两种情况，代理条目按各自所需决定是否 rewrite：
//  - 指向 8081 这类**独立 hub**（没有自己的 context-path）：必须剥掉 /collect/api；
//  - 指向 18190（**内嵌 hub**，context-path 就是 /collect/api）：绝不能剥，
//    剥了请求就落在容器层、没有路由，返回 Tomcat 原生 404 HTML 而非应用 JSON。
// 详见下方 /collect/api/ms 条目的注释。
const hubTarget = process.env.COLLECT_HUB_TARGET ?? "http://192.168.50.198:8081";
const stripCollectApiPrefix = (path: string) => path.replace(/^\/collect\/api/, "");

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

/**
 * 实时浏览器 sidecar 自动拉起：dev server 启动时把 scripts/live-browser.mjs 挂到后台，
 * 关闭时杀掉。拾取器的「实时模式」依赖 http://127.0.0.1:19097，
 * 手动起容易忘，这里做成全自动；已有人占端口时直接复用（幂等）。
 *
 * 另外每 15s 探活一次：实测 sidecar 会被外部静默干掉（退出码 1、无报错），
 * 探活失败就重新拉起，保证长时间开发时实时模式不悄悄退化成静态兜底。
 */
const liveBrowserPlugin = () => ({
  name: "live-browser-sidecar",
  apply: "serve" as const,
  configureServer(server: any) {
    const port = process.env.LIVE_BROWSER_PORT || "19097";
    // 幂等探测：端口上已有 /api/health 就不重复拉起
    const probe = async (): Promise<boolean> => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 800);
        const r = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: ctrl.signal });
        clearTimeout(t);
        return r.ok;
      } catch {
        return false;
      }
    };
    let child: any = null;
    let spawning = false;
    const spawnSidecar = async () => {
      if (spawning) {
        return;
      }
      spawning = true;
      try {
        const { spawn } = await import("node:child_process");
        const script = new URL("../../scripts/live-browser.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
        child = spawn(process.execPath, [script], {
          detached: false,
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, LIVE_BROWSER_PORT: port },
        });
        child.stdout?.on("data", (b: Buffer) => process.stdout.write(`[live-browser] ${b}`));
        child.stderr?.on("data", (b: Buffer) => process.stderr.write(`[live-browser] ${b}`));
        child.on("exit", (code: number | null) => {
          server.config.logger.warn(`[live-browser] 进程退出（code=${code}），15s 内自动重拉`);
          child = null;
        });
        // 等它报 listening（最多 15s；首次拉起要启动 Chromium 是在建会话时，启动很快）
        for (let i = 0; i < 30; i += 1) {
          await new Promise((r) => setTimeout(r, 500));
          if (await probe()) {
            server.config.logger.info(`[live-browser] ready at http://127.0.0.1:${port}`);
            return;
          }
        }
        server.config.logger.warn(`[live-browser] 15s 内未就绪，实时模式将不可用（静态模式不受影响）`);
      } finally {
        spawning = false;
      }
    };
    const boot = async () => {
      if (await probe()) {
        server.config.logger.info(`[live-browser] reuse http://127.0.0.1:${port}`);
        return;
      }
      await spawnSidecar();
    };
    void boot();
    // 探活守护：进程没了就重拉（只在自己没持有活进程时动手，避免误伤别处起的实例）
    const guardian = setInterval(() => {
      if (child && child.exitCode !== null) {
        child = null;
      }
      if (child) {
        return;
      }
      void probe().then((ok) => {
        if (!ok && !spawning) {
          server.config.logger.info(`[live-browser] 探活失败，重新拉起 sidecar`);
          void spawnSidecar();
        }
      });
    }, 15000);
    guardian.unref?.();
    server.httpServer?.on("close", () => {
      clearInterval(guardian);
      child?.kill();
    });
  },
});

export default createVite({
  appName: "vue-support-collect-scheduler-starter",
  title: "采集调度一体化平台",
  // 实时浏览器 sidecar：dev 启动时自动挂到 19097，拾取器实时模式依赖它
  plugins: [liveBrowserPlugin() as any],
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
      // 顺序敏感：前缀更长的条目必须排在通用 /collect/api 前面，先匹配到的先生效。
      // 四条路由各司其职：
      //   /collect/api/v2/scheduler -> 调度节点（执行器注册表只在 SCHEDULER 进程里）
      //   /collect/api/ms/datasource/ddl -> 采集节点（app=采集库，建表与运行期写库同目标）
      //   /collect/api/ms           -> datasource-hub（8081），见下方 hubTarget 注释
      //   /collect/api              -> 采集业务节点 18190（登录 /v2/user/login、采集接口）
      "/collect/api/v2/scheduler": {
        target: schedulerTarget,
        changeOrigin: true,
        configure: stripOriginHeaders,
      },
      // DDL（建表/补列）必须打在采集节点（18190）自己身上：
      // 「应用主库（app）」解析的是宿主应用的主 DataSource —— 采集侧解析到采集库，
      // 与运行期写库目标一致；中心（8081）的 app 是中心自己的主库（ngxacc），走中心会
      // 「执行成功、表却不在采集库里」（2026-10-08 pw-ddl 实测）。
      // 内嵌 hub 原生提供 ddl 端点（挂在 /collect/api 之下），所以直连且不加 rewrite。
      // 顺序敏感：必须排在 /collect/api/ms 前面，否则会先被中心条目接管。
      "/collect/api/ms/datasource/ddl": {
        target: apiTarget,
        changeOrigin: true,
        configure: stripOriginHeaders,
      },
      // 数据源中心（列表 + 控制台）-> hub。
      // **不剥 /collect/api 前缀**：18190 的 context-path 是 /collect/api（application.yml:20），
      // 内嵌 hub 的 /ms/** 与采集接口一样挂在这个前缀之下，剥掉后打到容器层就没有路由了
      // （返回 Tomcat 原生 404 HTML，而不是应用的 403 JSON —— 说明请求没进 Spring MVC）。
      // 之前那条 rewrite 是按「hub 独立部署在 8081、没有 context-path」写的，对内嵌 hub 不成立。
      // 顺序敏感：必须排在通用 /collect/api 前面，否则会先被通用条目转去 18190。
      "/collect/api/ms": {
        target: hubTarget,
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
