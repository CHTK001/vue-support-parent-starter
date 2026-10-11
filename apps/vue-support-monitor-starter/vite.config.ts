import type { PluginOption } from "vite";

import { fileViewerRenderers } from "@file-viewer/vite-plugin";

import { createVite } from "../../turbo/vite/createVite.ts";

// 后端实例：后台只跑在 Kali 上，本机不起后端进程，所以缺省值指向远端而不是 127.0.0.1。
// 与 vue-support-ai-guada / vue-support-system-starter 同一口径
// （见 a2b20b189「前端代理默认指向远端后端」）。
//
// 为什么这件事值得单独说明（**两种静默错法，第二种更贵**）：
//
// 1) 缺省目标指向一个**没人监听的本机端口**时，dev 代理返回的是
//      {"code":"00000","data":[],"success":true}
//    也就是**合法 JSON 但数据为空**。它不像连不上那样报错，表现是
//    「服务管理列表 0 个服务」，排查方向会整个跑偏到「数据丢了 / 查询写错了 /
//    后台没起节点」，而真实原因只是代理指错机器。
//
// 2) 更坑的一种：目标端口**有另一个实例在监听，而且它也一切正常**。
//    实测 2026-10-05，198 上 8081 与 8112 同时在跑**同一个 jar**
//    （spring-support-monitor-starter-4.0.0.42-exec.jar，两个会话各部署一份）：
//      8081  pid=556813  --server.port=8081
//      8112  pid=406188  --server.port=8112
//    两者都返回 200 + 合法 JSON + 真实数据。此时**页面能开、数据能看、
//    点什么都"正常"**，但你验收的是另一个实例的代码 —— 而且不会报任何错。
//
//    端口本身没有「正确答案」，只有「你验的是哪一个」。所以下面的缺省值
//    只是**本仓库交付那一份**的地址（8081），不是「正确端口」。
//    验别的实例时**务必显式覆盖**，别依赖缺省：
//      MS_API_TARGET=http://192.168.50.198:8112 pnpm dev
//
// 端口：29612 是 socket.io 推送端口（与 --plugin.socket.room[0].port=29612 一致）。
// 注意此前缺省写的 29181 是**错的端口**，即使把主机改成远端，socket 推送仍然连不上。
const apiTarget = process.env.MS_API_TARGET ?? "http://192.168.50.198:8081";
const socketTarget = process.env.MS_SOCKET_TARGET ?? "http://192.168.50.198:29612";

/** APM 观测后端地址；实测 8582 无监听，故不预置远端缺省，详见下方注释 */
const apmTarget = process.env.APM_TARGET ?? "http://127.0.0.1:8582";

// 文件存储服务器（FileStorageServerFilter）。
//
// 它是后端进程内的一个 HTTP 服务，监听在后端所在机器上，前端本地跑时本机没有这个进程，
// 因此 dev 下统一走 Vite 代理转发（浏览器 → 本机:8848/<桶前缀>?* → proxy → 远端文件服务器），
// 前端只发同源请求，不依赖后端 CORS 白名单，也不受本机无进程影响。
//   显式覆盖：FS_API_TARGET=http://<host>:<port> pnpm dev
//
// 默认指向 198:18080（system-api 内置的独立文件存储服务，实测 /local?config=true=200、
// /local?format=json=200，存储 Bean 名 = local）。原先默认 18082 指向监控后端内嵌的
// FileStorageServerFilter（Bean 名 localFileStorage），该实例已按「停重复实例」下线，
// 保留 18082 默认会让 /localFileStorage 探测直接 502。桶名需与目标服务的 Bean 名一致：
//   18080（system-api）→ local ；18082（监控内嵌）→ localFileStorage
// 桶名由 app.yaml otherConfig.filestorage.bucket 决定，两者要配套改。
const fileStorageTarget = process.env.FS_API_TARGET ?? "http://192.168.50.198:18080";

/**
 * 启动自检：把「代理指错后端」从静默变成可见。
 *
 * <p>为什么必须要有这个：dev 代理指错机器时**不一定报错**。目标端口没监听时
 * 返回「合法 JSON 但数据为空」；目标端口有**另一个实例**在跑时（198 上 8081 与
 * 8112 同时跑同款 jar 就是这样）返回的是**完全正常的 200 + 真实数据** ——
 * 页面能开、点什么都"正常"，但你测的是别人的代码。没有一条报错能提醒你。</p>
 *
 * <p>所以启动时主动打一行目标、再探一次真实接口，把「连不上」「通了但不是它」
 * 分开报出来。探不通只警告不阻断：共享环境里后端可能稍后才起，
 * 不该因为一次探测失败就让人起不来前端。</p>
 */
const apiTargetSelfCheck = (): PluginOption => ({
  name: "ms-api-target-self-check",
  apply: "serve",
  async configureServer() {
    // 显式设了 MS_API_TARGET 的人本来就知道自己指向哪，不该被啰嗦；
    // 需要提醒的恰恰是「没设、默默用了默认值」这种情况。
    const explicit = Boolean(process.env.MS_API_TARGET);
    const url = `${apiTarget}/ms/datasource/list`;
    const tag = explicit ? "[api-target]" : "[api-target][默认]";
    // eslint-disable-next-line no-console
    console.log(`\n${tag} dev 代理指向 ${apiTarget}${explicit ? "（来自 MS_API_TARGET）" : "（默认值，未设 MS_API_TARGET）"}`);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) {
        console.warn(`${tag} !! 探测 ${url} 返回 HTTP ${res.status} —— 代理可能指错实例`);
        return;
      }
      const body = await res.json() as { data?: unknown };
      const n = Array.isArray(body?.data) ? body.data.length : -1;
      if (explicit) {
        // eslint-disable-next-line no-console
        console.log(`${tag} 探测通了，返回 ${n} 条数据源`);
        return;
      }
      console.warn(
        `${tag} !! 探测通了，返回 ${n} 条数据源 —— 请确认这是**你要验收的那个实例**。`
        + "共享环境 198 上有**两个会话各自部署的同一个应用**（同款 jar）："
        + "8081 与 8112 都在监听、都返回 200 + 正常数据，"
        + "所以代理指错了**不会报任何错**，页面能开、点什么都「正常」，"
        + "但你测的是另一个实例的代码。验别的实例请显式指定："
        + "MS_API_TARGET=http://host:port pnpm dev",
      );
    } catch (e) {
      console.warn(`${tag} !! 探测 ${url} 失败：${String((e as Error)?.message ?? e)} —— 后端未起或端口不通`);
    }
  },
});

/**
 * dev 代理统一剥掉 `Origin` 头。
 *
 * <p>后端 `plugin.oauth.cors.allowed-origins` 是白名单（只列 8848 系地址），
 * 浏览器同源 POST 会带 `Origin: http://<本机端口>`，端口不在白名单时
 * Spring 直接回 403 `Invalid CORS request`（GET 不带 Origin 不受影响，
 * 这就是「读全绿、写全 403」的分裂）。dev 下页面与代理**同源**，
 * 浏览器根本不校验 ACAO 响应头，所以在进 proxy 前把 Origin 摘掉即可：
 * 任何端口都能开发，也不用动共享后端的白名单。</p>
 */
function dropProxyOrigin(): PluginOption {
  return {
    name: "ms-api-drop-proxy-origin",
    configureServer(server) {
      // configureServer 普通钩子注册的中间件**早于** vite proxy
      // （createVite 里的导航中间件同此机制），proxy 看到的已是无 Origin 的请求
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? "";
        if (
          url.startsWith("/ms/") ||
          url.startsWith("/v2/") ||
          url.startsWith("/api/device") ||
          /^\/(localFileStorage|local|ot|config|recycle|assets|static)(\/|$|\?)/.test(url)
        ) {
          delete req.headers.origin;
        }
        next();
      });
    },
  };
}

/**
 * 生产构建去重 element-plus。
 *
 * <p>问题（2026-10-09 冻结 dist 验收实测）：pnpm 按 peer 变体装了两棵**物理副本**
 * （`element-plus@2.14.3_...typescript@5.9.3_` 与 `..._typescript@6.0.3_`）——
 * apps/* 与 packages/ui 解析到前者，pages/datasource 解析到后者。
 * dev 由依赖预打包（optimizeDeps）天然合并为一份运行；
 * `vite build` 会把两棵都打进产物，于是出现**两个互相独立的 z-index 计数器**：
 * 嵌入弹窗（ReDialog，ui 副本）已到 2016，而「重新生成令牌」确认框
 * （MessageBox，datasource 副本）只拿到 2002 —— 确认框被弹窗盖住、按钮点不到。
 * 这类「MessageBox 叠在 ReDialog 上面」的交互在整个 datasource 控制台族都存在，
 * 不修就是一颗生产地雷。</p>
 *
 * <p>修法：`resolve.dedupe` 让所有 import 一律解析到 app 根那一份（源码完全同版，
 * 仅 peer 上下文不同），恢复单计数器。dev/构建都生效，对其它包无副作用。</p>
 */
function dedupeElementPlus(): PluginOption {
  return {
    name: "ms-dedupe-element-plus",
    config() {
      return { resolve: { dedupe: ["element-plus"] } };
    },
  };
}

export default createVite({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  plugins: [
    apiTargetSelfCheck(),
    dropProxyOrigin(),
    dedupeElementPlus(),
    // 文件预览（@file-viewer）资源接入：
    //   - preset 用 office（已安装 @file-viewer/preset-office）：写 "all" 会要求
    //     @file-viewer/preset-all，而该包未安装，插件 buildStart 直接抛未捕获异常、
    //     把 dev server 带崩（manualChunks/copyAssets 都够用 office 这一档）。
    //     非 office 的 pdf/text/typst/signature 等渲染器由各面板组件自行懒加载
    //     （inject:false，见 FvPanelBase/PreviewOfficePanel/FvTextPanel…），不依赖此处 preset。
    //   - copyAssets 把渲染器 worker/wasm/字体复制到 public（本仓库 publicDir 是工作区根
    //     public，见 createVite sharedPublic）；复制清单按实际安装的包走，与 preset 无关。
    //   - 渲染器注册由组件显式传入 preset 完成（见 PreviewOfficePanel），
    //     不注入虚拟模块，避免与自定义 dev HTML 模板中间件互相干扰。
    fileViewerRenderers({ inject: false, preset: "office", copyAssets: true }),
  ],
  // @pages/server、@pages/monitor 未收录在 createVite 共享 REPO_ALIAS，这里按 monorepo 惯例
  // （见 createVite: alias 值相对 WORKSPACE_ROOT 解析）应用本地补全。
  // 注意：业务代码以 "@pages/server/src/api" 形式引用，alias 目标应指向页面根（pages/server），
  // 使 "/src/..." 后缀落在真实的 pages/server/src/... 上；不可指向 pages/server/src（否则叠加成 src/src）。
  alias: {
    "@pages/server": "pages/server",
    "@pages/monitor": "pages/monitor",
    "@pages/project": "pages/project",
    "@pages/filesystem": "pages/filesystem",
    "@pages/datasource": "pages/datasource",
    "@pages/device": "pages/device",
  },
  server: {
    port: 8848,
    strictPort: true,
    watch: {
      // 插件每次 dev 启动都会 rm+cp 重写 public/vendor（约 27MB，含 17MB ppt 字体）。
      // Windows 下 chokidar 对仍在写入的大文件建 fs.watch → EBUSY → dev 进程崩溃，
      // 而监听这些插件生成的只读资产没有意义，故从 watcher 排除。
      ignored: [
        (p: string) =>
          /(^|[/\\])public[/\\]vendor([/\\]|$)/.test(p) ||
          /(^|[/\\])public[/\\]flyfish-viewer-assets\.json$/.test(p),
      ],
    },
    // 启动预编译：预热弹窗相关源码文件，首次点击弹窗不再现场 transform（避免 5s~1min 卡顿）
    warmup: {
      clientFiles: [
        "src/main.ts",
        "src/App.vue",
        "src/router.ts",
        "src/views/AssetsView.vue",
        "src/views/HostFormDialog.vue",
      ],
    },
    proxy: {
      // 后端 v2 基础接口：默认设置 /v2/setting/default、用户菜单 /v2/user/menu、
      // 布局 /v2/user/layout 等。缺失会导致启动期“远程登录页配置拉取失败 404”。
      "/v2": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 天气组件 IP 定位：freeipapi（HTTPS）
      "/freeip-api": {
        target: "https://freeipapi.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/freeip-api/, ""),
      },
      // 天气组件 IP 定位：ip-api（HTTP 免费版，HTTPS 返回 403）
      "/ip-api": {
        target: "http://ip-api.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ip-api/, ""),
      },
      "/ms/monitor/system": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/system": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/monitor": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 设备模块：device-starter 原生前缀，不在 /ms/* 体系内，需单独放行
      "/api/device": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 数据源中心（spring-support-datasource-hub-starter）
      "/ms/datasource": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/server": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/project": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ws/ms/server": {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
      },
      // tshark 抓包实时推送（socket.io，后端 plugin.socket.room[0].port）
      "/socket.io": {
        target: socketTarget,
        ws: true,
        changeOrigin: true,
      },
      // APM 观测后端（/api/apm 与 /agent 共用）。
      //
      // 实测（2026-10-02）：**8582 上没有任何进程监听**，所以这个缺省是死端口 ——
      // 请求会直接连接失败好在能看见。
      // 同时该主机上不存在 APM 观测后端：逐个探测 8086/8582/9848/9849/19180-19185/
      // 19380/19390，只有 8086 有响应，而那是 influxd（对任意路径返回 200 + 它的
      // HTML 落地页，响应头带 X-Influxdb-Build: OSS）。
      // 因此这里**不**把缺省改成任何远端地址：填 8086 会拿到 200 + HTML 这种
      // 垃圾数据，比死端口更难排查。改为显式可覆盖：
      //   APM_TARGET=http://<apm-host>:<port> pnpm dev
      // 待办：部署真实 APM 后端或确认该功能已下线，然后与 hotspot 应用统一该缺省
      // （hotspot 的 /api/apm 缺省是 8082→已改为可覆盖，两边数字本来就不一致）。
      "/api/apm": {
        target: apmTarget,
        changeOrigin: true,
      },
      "/agent": {
        target: apmTarget,
        changeOrigin: true,
      },
      "/monitor/api": {
        target: "http://127.0.0.1:19180",
        changeOrigin: true,
      },
      "/api/account": {
        target: "http://124.221.230.112:8080",
        changeOrigin: true,
      },

      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      // 文件存储服务器（FileStorageServerFilter，随监控后端同进程启动）。
      // 后端在 198，本机没有这个进程，所以必须走代理；请求前缀是桶名
      // （localFileStorage / local / ot / config 等），逐个列前缀最稳妥
      // （Vite proxy 的 key 用字符串前缀匹配最可靠，RegExp 形式在 v8 下有兼容坑）。
      "/localFileStorage": { target: fileStorageTarget, changeOrigin: true },
      "/local": { target: fileStorageTarget, changeOrigin: true },
      "/ot": { target: fileStorageTarget, changeOrigin: true },
      "/config": { target: fileStorageTarget, changeOrigin: true },
      "/recycle": { target: fileStorageTarget, changeOrigin: true },
    },
  },
  optimizeDeps: {
    include: [
      "element-plus",
      "@repo/theme",
      "@repo/ui",
      "@repo/ui/components/ReFilter/types",
      "@repo/ui/re-icon",
      "@repo/ui/re-input",
      "@repo/ui/re-kit",
      "@repo/ui/re-scrollbar",
      "@repo/ui/re-select",
      "@repo/ui/re-tag",
    ],
  },
});
