import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * 教育 AI 应用 Vite 配置。
 *
 * 后端代理指向 spring-support-eduai-starter（默认 19095）。
 * 同机可能同时跑多套后端，验证时用 VUE_EDUAI_API_TARGET 改指向，不必改这里。
 */
// 后端只跑在 Kali 上（eduai 的 19095 实例实测在远端监听），本机不起后端进程，
    // 所以缺省指向远端而不是 localhost。
    // 注意：缺省目标指向没人监听的本机端口时，dev 代理返回的是合法 JSON 但 data 为空，
    // 不会报连接错误，排查方向容易被带偏。
    // 需要指向其他实例时用环境变量覆盖：
    //   VUE_EDUAI_API_TARGET=http://localhost:19095 pnpm dev
    const apiTarget = process.env.VUE_EDUAI_API_TARGET ?? "http://192.168.50.198:19095";

// 「采集管理」收敛到 @pages/collect 后，本应用需要代理采集平台的多节点后端：
//   采集业务 18190 / 调度节点 18191 / 数据源中心 hub 8081。
// 代理前缀即后端 context-path，不做 rewrite：/collect/api/v2/collect/** -> 18190 原始路径。
// 缺省指向 Kali 远端（本机不起这些后端进程），均可用环境变量覆盖：
//   VUE_COLLECT_API_TARGET / VUE_COLLECT_SCHEDULER_TARGET / VUE_COLLECT_HUB_TARGET
const collectApiTarget = process.env.VUE_COLLECT_API_TARGET ?? "http://192.168.50.198:18190";
const collectSchedulerTarget = process.env.VUE_COLLECT_SCHEDULER_TARGET ?? "http://192.168.50.198:18191";
const collectHubTarget = process.env.VUE_COLLECT_HUB_TARGET ?? "http://192.168.50.198:8081";
const stripCollectApiPrefix = (path: string) => path.replace(/^\/collect\/api/, "");
// dev 代理必须在转发前摘掉 Origin/Referer，否则采集后端判跨域 403（changeOrigin 只改 Host，
// 浏览器 POST 里的 Origin 会原样送到远端）。生产同源部署无此问题，故只改 dev。
const stripOriginHeaders = (proxyServer: any) => {
  proxyServer.on("proxyReq", (proxyReq: any) => {
    proxyReq.removeHeader("origin");
    proxyReq.removeHeader("referer");
  });
};

/**
 * 单例化「Vue 运行时 + 路由 + 状态」。
 *
 * <p>为什么必须做：`useRoute()` / `useRouter()` 靠 `app.provide` 的**注入键**工作。
 * 注入键是模块级 Symbol —— 一旦打包产物里出现两份 vue / vue-router，
 * 组件里 inject 的就是「另一份」的键，于是 `useRoute()` 返回 **undefined**，
 * 调用点炸出 `Cannot read properties of undefined (reading 'query')` /
 * `(reading 'push')`。</p>
 *
 * <p>实测（2026-10-04）：同一套代码在 dev（ESM 天然去重）正常，
 * 打包后 `/edu/student` 永久停在「加载中…」（StudentPortalView 的 onMounted
 * 先调 adoptImpersonationToken()，里面读 `route.query.impersonate` 即抛错，
 * 于是 load() 根本没机会跑）；学生登录页的 `router.push` 同样失败。
 * 老师端恰好只用 `useRouter()` 且在另一条渲染路径上，所以没暴露。</p>
 *
 * <p>three 的 dedupe 见下：那是同一个坑的另一半（three 重复实例会让
 * instanceof 全部落空、模型渲染成空）。</p>
 */
function runtimeDedupe() {
  return {
    name: "eduai-runtime-dedupe",
    enforce: "pre" as const,
    config() {
      return {
        resolve: {
          dedupe: ["vue", "vue-router", "vue-demi", "pinia", "@vue/runtime-core", "@vue/runtime-dom"],
        },
      };
    },
  };
}

/**
 * three 单例化。
 *
 * 3D 展台（pages/eduai/src/components/insect/InsectStage3D.vue）同时 import 了
 * `three` 与 `three/examples/jsm/controls/OrbitControls.js`。
 *
 * 重复实例不是警告而是静默故障：各副本之间 instanceof 互不相认，builders 里
 * `mesh.isMesh` 之类判断会全部落空，模型被当成空 Group，页面只剩一块空画布。
 *
 * 两道保险：
 *   1. pages/eduai 的 three 版本与 packages/ui、pages/monitor 对齐（^0.185.1），
 *      避免同一应用里出现两个 three 版本 —— 这是重复实例的真正来源；
 *   2. 这里再补 resolve.dedupe，挡住 examples/jsm 被预构建成独立 chunk 的情况。
 *
 * createVite 的 config 透传刻意排除了 resolve，所以 dedupe 用 config 钩子注入，
 * 不改动 turbo/vite 共享基线。three 保持预构建（不要 exclude）——
 * 排除后 three.module.js 与 three.core.js 会各成一份，反而制造重复实例。
 */
function threeDedupe() {
  return {
    name: "insect-three-dedupe",
    enforce: "pre" as const,
    config() {
      return {
        resolve: {
          dedupe: ["three"],
        },
      };
    },
  };
}

export default createVite({
  appName: "vue-support-eduai-starter",
  title: "教育 AI 工作台",
  plugins: [runtimeDedupe(), threeDedupe()],
  // 「采集管理」收敛到 @pages/collect 后，本应用需要引用采集平台的视图组件。
  //
  // createVite 内置的 REPO_ALIAS 里 @pages/* 指向 pages/xxx/src，本条覆盖成**包根目录**，
  // 与 collect-scheduler / hotsport 等应用保持一致。alias 优先于包 exports，所以深导入必须带 src/：
  //   "@pages/collect/src/views/X.vue" -> pages/collect/src/views/X.vue  ✓
  //   "@pages/collect/views/X.vue"     -> pages/collect/views/X.vue      ✗ 不存在
  // 写错时只在 dev server 暴露（模块 500、路由桶文件连带失败、页面全白屏），
  // 生产构建走包 exports 能解析，所以单跑 vue-tsc / vite build 发现不了。
  alias: {
    "@": "pages/ai/src",
    "@pages/collect": "pages/collect",
    // 数据源管理页（@pages/datasource）被采集/调度入口深导入：
    //   "@pages/datasource/src/views/... vue" 与 "@pages/datasource/src/api/..."
    // system/monitor/collect-scheduler 均把该前缀覆盖为包根目录，eduai 若漏配，
    // rolldown 构建会报 Failed to resolve import "@pages/datasource/src/api/..."。
    "@pages/datasource": "pages/datasource",
  },
    server: {
      port: 19093,
      strictPort: false,
      proxy: {
        // 后端所有接口都代理过去。
        // 不能只代理 /v2/edu + /v2/user：登录页还需要
        // /v1/captcha（验证码图片）与 /v2/setting/default（登录配置），
        // 漏掉的路径会被 vite 当静态请求处理，表现为验证码不显示、配置读不到。
        "/v2": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/v1": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/edu-api": {
          target: apiTarget,
          changeOrigin: true,
        },
        // 生产 nginx 若需要把 ai-starter 管理端点接到其它业务应用，需同步加
        // location /api/（随前端发布带上）。
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        // 采集平台代理（顺序敏感：前缀更长者排在通用 /collect/api 前面，
        // 先匹配到的先生效）：
        //   /collect/api/v2/scheduler -> 调度节点 18191（执行器注册表只在 SCHEDULER 进程里）
        //   /collect/api/ms/datasource/{ddl,tables,table-infos,table-exists,columns,mapping/resolve}
        //       -> 采集节点 18190（结构读取与建表、运行期写库同目标）
        //   /collect/api/ms -> 数据源中心 hub 8081（独立 hub 无 context-path，须剥掉 /collect/api）
        //   /collect/api -> 采集业务节点 18190（登录 /v2/user/login、采集接口）
        "/collect/api/v2/scheduler": {
          target: collectSchedulerTarget,
          changeOrigin: true,
          configure: stripOriginHeaders,
        },
        "/collect/api/ms/datasource/ddl": {
          target: collectApiTarget,
          changeOrigin: true,
          configure: stripOriginHeaders,
        },
        "/collect/api/ms/datasource/tables": {
          target: collectApiTarget,
          changeOrigin: true,
          configure: stripOriginHeaders,
        },
        "/collect/api/ms/datasource/table-infos": {
          target: collectApiTarget,
          changeOrigin: true,
          configure: stripOriginHeaders,
        },
        "/collect/api/ms/datasource/table-exists": {
          target: collectApiTarget,
          changeOrigin: true,
          configure: stripOriginHeaders,
        },
        "/collect/api/ms/datasource/columns": {
          target: collectApiTarget,
          changeOrigin: true,
          configure: stripOriginHeaders,
        },
        "/collect/api/ms/datasource/mapping/resolve": {
          target: collectApiTarget,
          changeOrigin: true,
          configure: stripOriginHeaders,
        },
        "/collect/api/ms": {
          target: collectHubTarget,
          changeOrigin: true,
          ...(collectHubTarget.includes(":18190") ? {} : { rewrite: stripCollectApiPrefix }),
          configure: stripOriginHeaders,
        },
        "/collect/api": {
          target: collectApiTarget,
          changeOrigin: true,
          configure: stripOriginHeaders,
        },
      },
    },
});
