import type { IncomingMessage, ServerResponse } from "node:http";
import type { NextFunction } from "connect";
import { createReadStream, existsSync, readdirSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PluginOption } from "vite";

import { fileViewerRenderers } from "@file-viewer/vite-plugin";

import { createVite } from "../../turbo/vite/createVite.ts";

/**
 * 在 {@code node_modules/.pnpm} 里定位某个 {@code @file-viewer} 渲染器
 * {@code dist/} 下的资产文件。
 *
 * <p> {@code @file-viewer/vite-plugin} 的 copyAssets 复制清单
 * （ {@code flyfish-viewer-assets.json} ）只覆盖了
 * {@code docx / pdf / ppt / pptx / xlsx} 这几组渲染器，
 * <b>漏掉了 {@code iwork / hangul / wordperfect}</b>。这三个渲染器
 * 的 worker 由渲染器自身按 {@code document.baseURI + vendor/<渲染器>/<文件>}
 * 拼出 URL 去请求（见 {@code @file-viewer/core} 的
 * {@code DEFAULT_FILE_VIEWER_*_WORKER_PATH}），缺了文件就会抛
 * 「iWork Worker failed to load.」并把面板降级成 iframe。</p>
 *
 * <p>这里从 {@code .pnpm} 内容寻址目录按 {@code @file-viewer+renderer-<名>@<版本>}
 * 前缀扫描，找到就把绝对路径记下来，由 {@link serveFileViewerOfficeWorkers}
 * 的 dev 中间件按需吐出去。不依赖版本号，升级渲染器也不用改这里。</p>
 *
 * @param renderer 渲染器短名（如 {@code iwork} / {@code hangul} / {@code wordperfect}）
 * @param file 渲染器 {@code dist/} 下的相对文件名
 * @return 命中文件的绝对路径；未安装或文件缺失时返回 {@code undefined}
 */
function findFileViewerRendererAsset(renderer: string, file: string): string | undefined {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i += 1) {
    const pnpmDir = join(dir, "node_modules", ".pnpm");
    if (existsSync(pnpmDir)) {
      const prefix = `@file-viewer+renderer-${renderer}@`;
      for (const entry of readdirSync(pnpmDir)) {
        if (!entry.startsWith(prefix)) continue;
        const candidate = join(
          pnpmDir,
          entry,
          "node_modules",
          "@file-viewer",
          `renderer-${renderer}`,
          "dist",
          file,
        );
        if (existsSync(candidate)) return candidate;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/**
 * dev 下补齐 copyAssets 漏掉的 office 渲染器 worker/wasm。
 *
 * <p>{@code @file-viewer/vite-plugin} 的资源中间件对清单里没有的路径会
 * {@code next()} 放行，所以这里用 {@code configureServer} 的 post 钩子
 * （排在自带中间件之后）接管 {@code /vendor/iwork|hangul|wordperfect/*}，
 * 直接从 {@code node_modules} 把对应文件 stream 出去。渲染器请求的 URL
 * （ {@code /vendor/<渲染器>/<文件>} ）与 {@code @file-viewer/core} 的
 * 默认路径完全一致，因此无需改任何组件代码。</p>
 *
 * <p>WordPerfect 的 worker 内部会 {@code import('libwpd.mjs')} 并 fetch
 * {@code libwpd.wasm}（都按 worker URL 相对解析），所以这三个文件要一起
 * serve；wasm 缺失时渲染器自己会降级成「有限文本预览」，不会报错。</p>
 */
function serveFileViewerOfficeWorkers(): PluginOption {
  const assets: Record<string, string> = {};
  const register = (renderer: string, file: string, urlPath: string): void => {
    const abs = findFileViewerRendererAsset(renderer, file);
    if (abs) {
      assets[urlPath] = abs;
    } else {
      console.warn(`[file-viewer-office-workers] 未找到 ${renderer}/${file}，该格式将退回内联解析`);
    }
  };
  register("iwork", "iwork.worker.js", "/vendor/iwork/iwork.worker.js");
  register("hangul", "hangul.worker.js", "/vendor/hangul/hangul.worker.js");
  register("wordperfect", "wordperfect.worker.js", "/vendor/wordperfect/wordperfect.worker.js");
  register("wordperfect", "libwpd.mjs", "/vendor/wordperfect/libwpd.mjs");
  register("wordperfect", "libwpd.wasm", "/vendor/wordperfect/libwpd.wasm");

  return {
    name: "serve-file-viewer-office-workers",
    apply: "serve",
    configureServer(server) {
      // 直接注册（而非 post 钩子）：让本中间件排在 @file-viewer 自带资源
      // 中间件之后、vite 内部 transform 中间件之前。vite 的 transform 对
      // 不存在的 .js 路径会直接 404，若放在 post 钩子里就永远轮不到本
      // 中间件接管 /vendor/iwork|hangul|wordperfect/*。
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
          const pathname = (req.url || "").split("?")[0];
          const hit = assets[pathname];
          if (hit) {
            res.statusCode = 200;
            res.setHeader(
              "Content-Type",
              hit.endsWith(".wasm") ? "application/wasm" : "text/javascript; charset=utf-8",
            );
            createReadStream(hit).pipe(res);
            return;
          }
          next();
        },
      );
    },
  };
}

// 后端实例：后台只跑在 Kali 上，本机不起后端进程，所以缺省值指向远端而不是 127.0.0.1。
// 与 vue-support-ai-starter / vue-support-system-starter 同一口径
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
/** 独立 ACME 后端：/monitor/api/** 的专用前缀（见 pages/server acmeApi.ts 的 BASE） */
const acmeTarget = process.env.ACME_API_TARGET ?? "http://101.200.205.64:19170";

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
const fileStorageTarget = process.env.FS_API_TARGET ?? "http://192.168.50.198:28080";

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
          /^\/(fs|localFileStorage|local|ot|config|recycle|assets|static)(\/|$|\?)/.test(url)
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
    //   - 页面已整体切到 @file-viewer/vue3-full（pages/filesystem 已安装
    //     @file-viewer/preset-all），因此这里 preset 用 "all"，让 copyAssets
    //     复制全量 worker/wasm/字体，含 archive 的 libarchive worker/wasm。
    //   - copyAssets 把渲染器 worker/wasm/字体复制到 public（本仓库 publicDir 是工作区根
    //     public，见 createVite sharedPublic）；vue3-full 组件已把全资产 base 设为 "/"，
    //     与实际 public/vendor/... 一致。
    //   - 渲染器注册由 vue3-full 默认 preset-all 与各面板显式 preset 共同完成
    //     （见 PreviewOfficePanel），不注入虚拟模块，避免与自定义 dev HTML 模板中间件互相干扰。
    fileViewerRenderers({ inject: false, preset: "all", copyAssets: true }),
    // copyAssets 复制清单漏了 iwork/hangul/wordperfect 的 worker/wasm，
    // 这里用 dev 中间件从 node_modules 直接补齐（见上方
    // serveFileViewerOfficeWorkers 头注）。只对 serve 生效，不影响 build。
    serveFileViewerOfficeWorkers(),
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
  /**
   * 依赖预构建缓存目录（默认 node_modules/.vite）。
   *
   * <p>多个 worktree 共用同一个 {@code node_modules}（junction）时，默认缓存也共用：
   * 某个实例因 lockfile 变化重新预构建，会让其他实例手里的旧 chunk 失效，表现为
   * {@code Failed to fetch dynamically imported module} / {@code 504 Outdated Optimize Dep}。</p>
   *
   * <p>并行开多个 dev server 时用 {@code VITE_CACHE_DIR=.vite-xxx} 各开一份缓存即可隔离。</p>
   */
  cacheDir: process.env.VITE_CACHE_DIR ? join(process.cwd(), process.env.VITE_CACHE_DIR) : undefined,
  server: {
    port: 8848,
    strictPort: true,
    /**
     * 允许读取 node_modules 的**真实路径**。
     *
     * <p>本仓库常在 worktree 里开发：worktree 的 {@code node_modules} 往往是指向主检出
     * 的 junction / 符号链接，vite 解析出的模块真实路径落在工作区根之外，默认
     * {@code server.fs.allow} 不放行 —— 表现为 {@code @fs/...} 请求被拒，
     * file-viewer 的动态 import 失败，预览整片回退到 iframe（「预览加载失败」）。</p>
     *
     * <p>这里用 {@code realpathSync} 把符号链接解成真实目录再放行，对普通检出无副作用。</p>
     */
    fs: {
      allow: (() => {
        const cwd = process.cwd();
        const real = (p: string): string => {
          try {
            return realpathSync(p);
          } catch {
            return p;
          }
        };
        const nm = real(join(cwd, "node_modules"));
        // apps/<app> → 仓库（worktree）根：默认 allow 会包含它，这里替换数组后必须补回，
        // 否则 @fs/<worktree>/packages/** 会被 403（worker / 字体 / 共享包全部加载失败）。
        const repoRoot = real(join(cwd, "..", ".."));
        // 同时放行 node_modules 本身与其上级（主检出根），覆盖 .pnpm 下的深层真实路径
        return [real(cwd), repoRoot, nm, dirname(nm)];
      })(),
    },
    watch: {
      // 插件每次 dev 启动都会 rm+cp 重写 public/vendor（约 27MB，含 17MB ppt 字体）。
      // Windows 下对仍在写入/被外部进程短暂锁定的大文件建 fs.watch → EBUSY →
      // dev 进程直接崩溃（exit 1）。public/wasm/cad/libredwg-web.wasm 正是这样崩的。
      // 这些纯静态资源不参与 HMR，监听无益且有害。
      // 注意：Vite 8 已换原生 node fs watcher，只认「正则/字符串」ignored，
      // 函数式回调不会生效；且这里会整体替换 createVite 工厂的 watch，
      // 必须把 factory 的 vendor/wasm/bcmap 规则一并带回。
      ignored: [
        /[/\\]vendor[/\\]/,
        /[/\\]wasm[/\\]/,
        /\.bcmap$/,
        /[/\\]flyfish-viewer-assets\.json$/,
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
      // 独立 ACME 后端：/monitor/api/**（ACME 证书管理）
      "/monitor/api": {
        target: acmeTarget,
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
      // 天气/台风组件，与共享包候选前缀一致；开发期也走代理，避免同源 404
      "/typhoon-api": {
        target: "https://typhoon.slt.zj.gov.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/typhoon-api/, "/Api"),
      },
      "/weather-api": {
        target: "https://api.open-meteo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weather-api/, ""),
      },
      "/geo-api": {
        target: "https://api.bigdatacloud.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geo-api/, ""),
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
      // 注意：不要加 ws:true。app.yaml 走 polling-only，加 ws:true 会让 vite 挂 WS 升级
      // 处理器干扰 HTTP 轮询代理；且 WS 升级会被 netty(SO_LINGER=0 硬关)重置。
      "/socket.io": {
        target: socketTarget,
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
      // 与上面的 ACME 前缀共用同一个目标：这里曾硬编码 http://127.0.0.1:19180，
      // 而 ACME 后端实际跑在 101.200.205.64:19170，dev 下 /monitor/api/** 全部
      // ECONNREFUSED → 页面拿到 502，ACME 账户/证书一律显示 0 条（看起来像数据丢了）。
      "/monitor/api": {
        target: acmeTarget,
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
      // 嵌入式形态挂载在应用端口 + path-prefix（默认 /fs），因此 /fs 同源代理到 API。
      "/fs": { target: apiTarget, changeOrigin: true },
      "/localFileStorage": { target: fileStorageTarget, changeOrigin: true },
      "/local": { target: fileStorageTarget, changeOrigin: true },
      "/ot": { target: fileStorageTarget, changeOrigin: true },
      "/config": { target: fileStorageTarget, changeOrigin: true },
      "/recycle": { target: fileStorageTarget, changeOrigin: true },
    },
  },
  optimizeDeps: {
    // @file-viewer/* 必须在这里显式列出，不能靠懒发现。
    //
    // 原因：这些渲染器全是 `import()` 动态加载的懒依赖，不在 include 里时
    // Vite 要等到**某个文件被打开时**才发现它们，于是运行中途触发
    // 「optimized dependencies changed. reloading」。重优化会重算 chunk 哈希，
    // 已打开页面里所有 `deps/@file-viewer_vue3.js?v=<旧哈希>` 的请求当场 404，
    // 于是 FvPanelBase / PreviewOfficePanel / FvTextPanel… 集体报
    // 「Failed to fetch dynamically imported module」并降级到兜底面板。
    // 表现就是：同一个 xlsx，第一次能渲染、刷新后变回 iframe/旧面板，
    // 动画也没了——被误判成「有的格式没接 file-viewer」，实际是依赖被优化掉了。
    // 显式 include 后启动即预打包，运行期不再变更。
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
      // ---- file-viewer 主体与各格式渲染器 ----
      "@file-viewer/vue3",
      "@file-viewer/vue3-full",
      "@file-viewer/preset-office",
      "@file-viewer/preset-all",
      "@file-viewer/renderer-3d",
      "@file-viewer/renderer-archive",
      "@file-viewer/renderer-binary",
      "@file-viewer/renderer-cad",
      "@file-viewer/renderer-chm",
      "@file-viewer/renderer-data",
      "@file-viewer/renderer-design",
      "@file-viewer/renderer-dicom",
      "@file-viewer/renderer-drawing",
      "@file-viewer/renderer-eda",
      "@file-viewer/renderer-email",
      "@file-viewer/renderer-epub",
      "@file-viewer/renderer-geo",
      "@file-viewer/renderer-image",
      "@file-viewer/renderer-media",
      "@file-viewer/renderer-mindmap",
      "@file-viewer/renderer-signature",
      "@file-viewer/renderer-text",
      "@file-viewer/renderer-typst",
      // 各渲染器拖进来的传递依赖（ag-psd / saxes 等）同样会被懒发现，
      // 一并列出，避免它们成为「压垮骆驼的最后一根稻草」
      "ag-psd",
      "saxes",
      // heic2any: CJS-only dep of @file-viewer/renderer-image. Its renderHeic
      // does `import('heic2any')` and takes the default export; without an
      // explicit include the lazy-discovered bundle has no default interop,
      // so the destructured value is undefined and HEIC/HEIF preview dies with
      // "heic2any is not a function". Listing it here makes the pre-bundle
      // emit a proper default export.
      "heic2any",
      // 表格渲染器底层：file-viewer 与业务侧必须解析到同一物理实例
      "e-virt-table/dist/index.es.js",
      // ---- CodeMirror（数据源中心的 SQL 编辑器）----
      // 与上面的 @file-viewer/* 同一个病，且后果一样严重：
      // DbSqlEditor.vue 静态 import @codemirror/*，但它自己只被
      // DatabaseManagerView.vue 动态引用，而后者又只被路由的 () => import() 加载。
      // 整条链上没有一处静态入口，优化器的 entries 扫描发现不到，
      // 于是 deps 缓存里永远没有 @codemirror_*.js（实测 401 个产物里一个都没有）。
      // 首次访问数据源管理页时浏览器去要 /deps/@codemirror_state.js，Vite 直接
      // 504（空响应体，2~6ms 内返回），动态导入失败 ——
      // 表现是「数据库管理 / Redis 管理 / InfluxDB / Neo4j / MongoDB … 全部打不开」，
      // 路由只留一句 Vue Router warn，页面一片空白。
      // 显式列出后启动即预打包，运行期不再变。
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/commands",
      "@codemirror/autocomplete",
      "@codemirror/language",
      "@codemirror/lang-sql",
      // ---- @novnc/novnc（远程控制台的 VNC 客户端）----
      // 与 @codemirror/* 同一条链：路由 () => import('TerminalView.vue')
      // → TerminalView → ScVncDirectViewer.vue，而后者**静态** import RFB。
      // 整条链没有一处静态入口，优化器的 entries 扫描发现不到 @novnc/novnc，
      // deps 缓存里就没有 @novnc_novnc.js。
      // 首次加载 TerminalView 时浏览器去要 /deps/@novnc_novnc.js?v=<哈希>，
      // Vite 返回 504（Outdated Optimize Dep），动态导入随之失败 ——
      // 表现是控制台页白屏 + pageerror
      // 「Failed to fetch dynamically imported module: .../TerminalView.vue」。
      // 而且同一趟里还会连带两次：console 那条 504 与 requestfailed 的 ERR_ABORTED，
      // 一条故障报成三条。显式列出后启动即预打包，运行期不再变。
      "@novnc/novnc",
    ],
  },
});
