import type { IncomingMessage, ServerResponse } from "node:http";
import type { NextFunction } from "connect";
import { createReadStream, existsSync, readdirSync, realpathSync } from "node:fs";
import { dirname, join, isAbsolute } from "node:path";
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

/**
 * dev 下补位「统一预览壳」的构建产物请求。
 *
 * <p>临时链接预览（{@code /fs/ot/{token}?preview=true}）返回的壳是
 * {@code apps/vue-support-filestorage-starter} 的构建产物，按 {@code base:"/"} 打包：
 * 入口 chunk 在 HTML 里由后端改写成挂载前缀（{@code /fs/assets/*}），但 chunk 之间
 * {@code import("/assets/xxx.js")} 的路径是**烘进 JS 的根绝对路径**，HTML 改写碰不到。
 * 生产态这些根路径由文件存储过滤器的 classpath 静态白名单兜住（8082 直连因此正常）；
 * dev 下根 {@code /assets} 归 Vite，工作区 {@code public/assets} 只有 avatar-frames，
 * 于是 404 → 「Unable to preload CSS」→ 临时链接整页渲染失败。</p>
 *
 * <p>这里只把 dev 下 <b>没有被 public 命中</b> 的 {@code /assets/*} 转发到后端同一前缀
 * （{@code apiTarget + /fs/assets/*}），不新增根路径语义，也不影响 build 产物。</p>
 */
function servePreviewShellAssets(): PluginOption {
  // 工作区 publicDir（createVite 的 sharedPublic）是仓库根 public，app 内 public 仅作兜底。
  const publicDirs = [join(process.cwd(), "../../public"), join(process.cwd(), "public")];

  return {
    name: "serve-preview-shell-assets",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
          const raw = req.url || "";
          const pathname = raw.split("?")[0];
          if (!pathname.startsWith("/assets/")) {
            next();
            return;
          }
          const owned = publicDirs.some((dir) => existsSync(join(dir, decodeURIComponent(pathname))));
          if (owned) {
            next();
            return;
          }
          void (async () => {
            try {
              const upstream = await fetch(`${apiTarget}/fs${raw}`);
              res.statusCode = upstream.status;
              const type = upstream.headers.get("content-type");
              if (type) {
                res.setHeader("Content-Type", type);
              }
              res.end(Buffer.from(await upstream.arrayBuffer()));
            } catch (err) {
              next(err as Error);
            }
          })();
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
//      MS_API_TARGET=https://8082-agqwy3tplnv4xakvlmllio7goq.instabox.tech pnpm dev
//
// 端口：29612 是 socket.io 推送端口（与 --plugin.socket.room[0].port=29612 一致）。
// 注意此前缺省写的 29181 是**错的端口**，即使把主机改成远端，socket 推送仍然连不上。
// 当前真实环境是 instabox sandbox：后端跑在 agqwy3tplnv4xakvlmllio7goq 那台机器的 8082，
// 对外通过 published 端口域名暴露（https://<port>-<machineId>.instabox.tech）。
//
// 关于用户提到的 https://18082-agqwy3tplnv4xakvlmllio7goq.instabox.tech：
// 实测该端口**已发布但 sandbox 内没有进程在监听**，任意路径都返回
//   502 Nothing is listening on this port in the sandbox. Start an HTTP server on port 18082.
// 同一台机器的 8082 才是真正在跑的后端（/v2/user/login 200、/ms/server/host 返回真实主机）。
// 所以这里默认指向 8082；等那台机器的 18082 起了服务（前端/网关），
// 用 MS_API_TARGET=https://18082-agqwy3tplnv4xakvlmllio7goq.instabox.tech 覆盖即可。
const INSTABOX_BACKEND = "https://8082-agqwy3tplnv4xakvlmllio7goq.instabox.tech";
const apiTarget = process.env.MS_API_TARGET ?? INSTABOX_BACKEND;
// 模板后端：spring-support-template-starter（被 message/eduai 两个后台承载）
const templateApiTarget = process.env.TEMPLATE_API_TARGET ?? "http://192.168.50.198:18170";

/**
 * 由 API 目标推导 socket.io 目标：同主机 + 29612 端口。
 *
 * <p>主机必须跟着 MS_API_TARGET 走。以前这里把主机也硬编码成 192.168.50.198，
 * 于是只要 MS_API_TARGET 指到别处（SSH 隧道、另一台机器），`/socket.io`
 * 仍然打向那台不可达的 LAN 机器，浏览器控制台里就是一条
 * `http://localhost:8848/socket.io/?EIO=4&transport=polling ... 502`，
 * 而且看不出是代理指错了 —— 与 API 已经切到隧道这一事实完全对不上。</p>
 *
 * <p>解析失败时退回历史默认值，行为与改动前一致。</p>
 *
 * @param api API 代理目标
 */
function deriveSocketTarget(api: string): string {
  try {
    const u = new URL(api);
    // instabox 的 published 域名把端口编码在子域里（<port>-<machineId>.instabox.tech），
    // 这种主机名**不能再拼 :29612**（会变成 https://xxx:29612 的非法地址），
    // 而要换成 29612 对应的 published 域名。普通主机仍按 host:29612 推导。
    const m = /^(\d+)-(.+\.instabox\.tech)$/i.exec(u.hostname);
    if (m) return `${u.protocol}//29612-${m[2]}`;
    return `${u.protocol}//${u.hostname}:29612`;
  } catch {
    return "https://29612-agqwy3tplnv4xakvlmllio7goq.instabox.tech";
  }
}

const socketTarget = process.env.MS_SOCKET_TARGET ?? deriveSocketTarget(apiTarget);
/** ACME 证书：已并入主后端进程（monitor 后端依赖 spring-api-support-monitor-starter），
 *  /monitor/api/** 默认与其它接口共用同一个 apiTarget；
 *  只有把 ACME 单独部署时才用 ACME_API_TARGET 覆盖。 */
const acmeTarget = process.env.ACME_API_TARGET ?? apiTarget;

/** APM 观测后端地址；实测 8582 无监听，故不预置远端缺省，详见下方注释 */
const apmTarget = process.env.APM_TARGET ?? INSTABOX_BACKEND;

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
const fileStorageTarget = process.env.FS_API_TARGET ?? INSTABOX_BACKEND;

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
    // socket.io 推送（tshark 抓包实时流）是**独立端口**，与 API 主机同源但端口不同，
    // 浏览器里它表现为「/socket.io 502」而 API 一切正常 —— 这条日志就是给人对照用的。
    // eslint-disable-next-line no-console
    console.log(`${tag} /socket.io 代理指向 ${socketTarget}${process.env.MS_SOCKET_TARGET ? "（来自 MS_SOCKET_TARGET）" : "（默认由 API 主机推导）"} —— 若该实例未启用 plugin.socket.room，此路径必然连不上，属预期`);
  },
});

/**
 * 指向**外部**服务的 `/api/**` 前缀：它们的 CORS 口径不归本应用后端管，
 * Origin 必须原样转发，不能被 {@link dropProxyOrigin} 摘掉。
 *
 * <p>目前只有两条（见下方 `server.proxy`）：</p>
 * <ul>
 *   <li>{@code /api/account} → {@code 124.221.230.112:8080}（历史账号服务）</li>
 *   <li>{@code /api/template} → {@code TEMPLATE_API_TARGET}（独立模板后端）</li>
 * </ul>
 *
 * <p>末尾的 {@code (?:\/|$|\?)} 不能省：{@code /api/accounts}（统一账号管理，
 * 落在本应用后端）也以 {@code /api/account} 开头，少了它就会让真正的自己人
 * 继续带着 Origin 去撞 CORS。</p>
 */
const EXTERNAL_API_PATH = /^\/api\/(?:account|template)(?:\/|$|\?)/;

/**
 * 该 URL 是否打到**本应用后端**的 `/api/**`。
 *
 * @param url 请求路径（含 query）
 * @returns 属于本应用后端的 API 返回 true
 */
function isFirstPartyApi(url: string): boolean {
  return url.startsWith("/api/") && !EXTERNAL_API_PATH.test(url);
}

/**
 * dev 代理统一剥掉 `Origin` 头。
 *
 * <p>后端 CORS 是白名单制（`plugin.api.cors.allowed-origins`）：浏览器每次
 * POST/PUT/DELETE 都会带 `Origin: http://<本机端口>`，而代理的
 * `changeOrigin: true` 又把 `Host` 改成了后端自己的 host:port，于是
 * `CorsUtils.isCorsRequest` 判定 Origin 与 Host 不同源；白名单里没有这个
 * 来源时 Spring 直接回 403 `Invalid CORS request`。**GET 不带 Origin，
 * 所以读全绿、写全 403** —— 这正是「渠道列表正常、点『绑定账号』报 403」的
 * 成因：`POST /api/channels/kilo/start-login` 被 CORS 层挡下，前端只拿到
 * `Request failed with status code 403`。dev 下页面与代理**同源**，
 * 浏览器根本不校验 ACAO 响应头，所以在进 proxy 前把 Origin 摘掉即可：
 * 任何端口都能开发，也不用动共享后端的白名单。</p>
 *
 * <p>为什么按 `/api/**` 整体判断，而不是继续逐个列举前缀：`/api/device`、
 * `/api/apm` 都是历史上同一类 403 补出来的痕迹，补一个前缀只救一个页面；
 * 而 `@pages/channel` 一被复用进本应用就带着 `/api/channels`、`/api/accounts`
 * 两组写接口撞同一堵墙。</p>
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
          // Actuator 也归本应用后端（同 /api/**）：读接口是 GET 不带 Origin，
          // 但写接口（POST /actuator/loggers/{name} 改日志级别）会带
          // Origin: http://127.0.0.1:8848，而后端 CORS 白名单里没有 dev 端口，
          // 于是 403 Invalid CORS request —— 表现为「下拉选了新级别但什么都没发生」。
          url.startsWith("/actuator") ||
          isFirstPartyApi(url) ||
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

/**
 * 是否开启代理调试日志（默认关闭，由 {@code MS_DEBUG_PROXY=1} 打开）。
 *
 * <p>默认关闭不是省磁盘，而是**断开一条自激回路**：调试日志把 stdout 重定向进
 * Vite root 里的 {@code dev-*.log}，而这个文件本身落在 watcher 监听范围内 ——
 * 每写一行日志 → 文件 mtime 变化 → watcher 触发 → 整页 reload → 浏览器重新加载
 * → 又是一轮请求 → 又写日志……</p>
 *
 * <p>实测本次会话仅 dev-8848-acc.log 就涨到 4.1MB，日志里 348 次 {@code page reload}
 * 与 39 次 {@code -> 504 (Outdated Request)} 全部由这条回路放大。
 * 「点菜单很慢、页面出不来」不是浏览器慢，是 dev server 被自己的日志拖住了。</p>
 */
const DEBUG_PROXY = process.env.MS_DEBUG_PROXY === "1";

/**
 * [临时调试] 在 vite proxy 之前/之后记录代理请求的全貌，找到 `200 null` 的源头.
 *
 * <p>默认关闭，见 {@link DEBUG_PROXY} 的说明。</p>
 */
function debugProxyLogger(): PluginOption {
  return {
    name: "debug-proxy-logger",
    apply: "serve",
    configureServer(server) {
      if (!DEBUG_PROXY) return;
      const t0 = Date.now();
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? "";
        console.log(`[DBG] BEFORE-PROXY ${Date.now()-t0}ms ${req.method} ${url} accept=${req.headers.accept}`);
        const origEnd = _res.end.bind(_res);
        let ended = false;
        _res.end = (...args: any[]) => {
          if (!ended) {
            ended = true;
            console.log(`[DBG] AFTER-PROXY ${Date.now()-t0}ms ${req.method} ${url} -> ${_res.statusCode}`);
          }
          return origEnd(...args);
        };
        return next();
      });
    },
  };
}

export default createVite({
  appName: "vue-support-monitor-starter",
  title: "监控管理平台",
  plugins: [
    debugProxyLogger(),
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
    // 【资产已作为源码提交 public/vendor（2026-10-24）】：
    //   - iwork/hangul/wordperfect 及其它渲染器资产全部落盘并入库，
    //     dev/build 都直接读 public/vendor，插件无需再复制（copyAssets:false）。
    //   - apply:'build' + copyAssets:false：build 时保留插件的 chunk 分组能力，
    //     但不复制资产（publicDir 会从源码带进 dist/vendor）。
    //   - dev 由下面 serveFileViewerOfficeWorkers 中间件做兜底（资产已在，正常不触发）。
    {
      ...fileViewerRenderers({ inject: false, preset: "all", copyAssets: false }),
      apply: 'build' as const,
    },
    // copyAssets 复制清单漏了 iwork/hangul/wordperfect 的 worker/wasm，
    // 这里用 dev 中间件从 node_modules 直接补齐（见上方
    // serveFileViewerOfficeWorkers 头注）。只对 serve 生效，不影响 build。
    serveFileViewerOfficeWorkers(),
    // 临时链接预览壳的 chunk 用根绝对 /assets/*（见 servePreviewShellAssets 头注），
    // dev 下转发到后端同一前缀，否则 dev 8899 打开临时链接必然白屏。
    servePreviewShellAssets(),
  ],
  // @pages/server、@pages/monitor 未收录在 createVite 共享 REPO_ALIAS，这里按 monorepo 惯例
  // （见 createVite: alias 值相对 WORKSPACE_ROOT 解析）应用本地补全。
  // 作业 / 采集 / 消息 / 签到 / 任务 / 成就六个页面包已从 monitor 撤出（后端无对应 starter，
  // 菜单点开即 404），因此也不再声明 alias 与 workspace 依赖；恢复时需连同
  // src/router/index.ts 的 import 一起加回。
  // 注意：业务代码以 "@pages/server/src/api" 形式引用，alias 目标应指向页面根（pages/server），
  // 使 "/src/..." 后缀落在真实的 pages/server/src/... 上；不可指向 pages/server/src（否则叠加成 src/src）。
  alias: {
    "@pages/server": "pages/server",
    "@pages/system": "pages/system",
    "@pages/monitor": "pages/monitor",
    "@pages/project": "pages/project",
    "@pages/room": "pages/room",
    "@pages/filesystem": "pages/filesystem",
    "@pages/datasource": "pages/datasource",
    "@pages/debug": "pages/debug",
    "@pages/device": "pages/device",
    "@pages/docker": "pages/docker",
    // pages/tunnel 已交付：内网穿透路由（单页面 TunnelPage，提供方在页内选）
    "@pages/tunnel": "pages/tunnel",
    // 账号管理（含模板管理 / 消息模板）的前端源码已并入后端项目
    // spring-support-account-starter/web；宿主只挂路由，页面本体、API、路由声明
    // 都在该包里（包名 @account/web）。
    "@account/web": "../spring-support-parent-starter/spring-support-account-starter/web",
    // APM 观测台：页面根（业务以 "@pages/apm/src/..." 引用，alias 必须指向 pages/apm）
    "@pages/apm": "pages/apm",
    // 渠道管理页：直接复用 @pages/channel 的完整页面（品牌表 / 绑定 SSE / 模型开关 /
    // ChatClient / 文生图），宿主不再自建 api/channel.ts 与绑定逻辑。
    // createVite 的 REPO_ALIAS 把 @pages/channel 指到 pages/channel/src，与这里的
    // 「指向页面根、业务写 @pages/channel/src/...」口径不一致，故本地覆盖为页面根。
    "@pages/channel": "pages/channel",
    // @pages/channel 的页头 import '@/components/ui/RePageHead.vue'（仓库根 tsconfig
    // 的 "@/*" 约定，指向 pages/ai/src）。monitor 自身没有 "@/..." 引用，这里只是让
    // 被复用的页面包能解析，与 system / eduai 等宿主的接法一致。
    "@": "pages/ai/src",
  },
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
        // 账号管理前端源码在后端仓（spring-support-account-starter/web），位于本工作区
        // 之外；不放行时 dev 对 @fs/<外部绝对路径> 一律 403（页面白屏、sourcemap 报错）。
        const accountWeb = real(join(cwd, "..", "..", "..", "spring-support-parent-starter", "spring-support-account-starter", "web"));
        // 同时放行 node_modules 本身与其上级（主检出根），覆盖 .pnpm 下的深层真实路径
        return [real(cwd), repoRoot, nm, dirname(nm), accountWeb];
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
        // ---- E2E 产物目录：写一次就触发一次整页 reload ----
        // Playwright 的 html reporter 把报告写进 <app>/playwright-report/，
        // 每次跑完一轮用例都改写这里的 index.html 与 trace/*.html。
        // Vite 8 对**任何**落在 root 内的 .html 变更都判定为「客户端 HTML 变了」
        // （见 vite/dist/node/chunks/node.js 的 isClientHtmlChange），于是发
        // full-reload → 正在打开的页面被整页刷掉 → 页面重新拉全部模块 →
        // 用例与人工操作互相打断。实测本次会话因此产生 348 次 page reload。
        // test-results/ 同理（trace/截图产物）。这两个目录不是源码，不参与 HMR，
        // 忽略掉即可。Vite 自带的默认忽略只含 test-results/，不含 playwright-report/。
        /[/\\]playwright-report[/\\]/,
        /[/\\]test-results[/\\]/,
      ],
    },
    // 启动预编译：预热入口与首屏视图源码文件，首次加载不再现场 transform（避免 5s~1min 卡顿）。
    // 注意：monitor 是壳应用（main.ts 里 import "@pages/xxx"），src 下没有 views/ 目录；
    // 路径必须真实存在，否则 vite 启动即报 Failed to load url ... Does the file exist?
    warmup: {
      clientFiles: [
        "src/main.ts",
        "src/App.vue",
        "src/router/index.ts",
        "src/components/ProcessHost.vue",
        // 壳应用真实业务首屏（@pages/monitor），相对 app root 解析
        "../../pages/monitor/src/views/WorkbenchView.vue",
        "../../pages/monitor/src/views/AlarmsView.vue",
        "../../pages/monitor/src/views/OnlineNodesView.vue",
      ],
    },
    proxy: {
      // 后端 v2 基础接口：默认设置 /v2/setting/default、用户菜单 /v2/user/menu、
      // 布局 /v2/user/layout 等。缺失会导致启动期“远程登录页配置拉取失败 404”。
      "/v2": {
        target: apiTarget,
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log(`[DBG] PROXY-REQ ${req.method} ${req.url}`);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log(`[DBG] PROXY-RES ${req.method} ${req.url} -> ${proxyRes.statusCode} len=${proxyRes.headers["content-length"]} type=${proxyRes.headers["content-type"]}`);
          });
          proxy.on("error", (err, req, res) => {
            console.log(`[DBG] PROXY-ERR ${req?.url} ${err.message}`);
          });
        },
      },
      // 独立 ACME 后端：/monitor/api/**（ACME 证书管理）
      "/monitor/api": {
        target: acmeTarget,
        changeOrigin: true,
      },      // 天气组件 IP 定位：freeipapi（HTTPS）
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
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log(`[DBG] PROXY-REQ ${req.method} ${req.url}`);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log(`[DBG] PROXY-RES ${req.method} ${req.url} -> ${proxyRes.statusCode} len=${proxyRes.headers["content-length"]} type=${proxyRes.headers["content-type"]}`);
          });
          proxy.on("error", (err, req, res) => {
            console.log(`[DBG] PROXY-ERR ${req?.url} ${err.message}`);
          });
        },
      },
      // 设备模块：device-starter 原生前缀，不在 /ms/* 体系内，需单独放行
      "/api/device": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 模板模块：template-starter 运行时在 message/eduai（192.168.50.198:18170）
      // 本侧走 TEMPLATE_API_TARGET 指向的 template 后端（可被 TEMPLATE_API_TARGET 覆盖）
      "/api/template": {
        target: templateApiTarget,
        changeOrigin: true,
      },
      // CDP 调试中心（/ms/cdp REST + /ws/cdp WebSocket，后端在 monitor 进程内）
      // dev 下通过 MS_API_TARGET 覆盖目标（默认指向 instabox，本机集成跑到 127.0.0.1:8082）
      "/ms/cdp": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ws/cdp": {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
      },
      // 数据源中心（spring-support-datasource-hub-starter）
      "/ms/datasource": {
        target: apiTarget,
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log(`[DBG] PROXY-REQ ${req.method} ${req.url} host=${req.headers.host} origin=${req.headers.origin} authok=${(req.headers.authorization || "").slice(0, 20)}`);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const len = (proxyRes.headers["content-length"] || 0);
            console.log(`[DBG] PROXY-RES ${req.method} ${req.url} -> ${proxyRes.statusCode} len=${len} type=${proxyRes.headers["content-type"]}`);
          });
          proxy.on("error", (err, req, res) => {
            console.log(`[DBG] PROXY-ERR ${req?.url} ${String(err)}`);
          });
        },
      },
      "/ms/server": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ms/project": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 内网穿透统一入口（spring-support-tunnel-starter 的 /ms/tunnel）。
      // 缺这一条时 dev 下请求会落到 Vite 自身 → 404，页面表现为「提供方加载失败」。
      "/ms/tunnel": {
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
      // Spring Actuator：监控大屏的 Actuator 卡片直接读端点（/actuator/health、
      // /actuator/metrics/... 等）。后端（spring-support-monitor-starter）没有
      // context-path，端点就在站点根下；dev 必须显式代理，否则 Vite 会把
      // /actuator/** 当成前端路由回 index.html（表现为“拿到一坨 HTML 解析失败”）。
      "/actuator": {
        target: apiTarget,
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
      // 统一账号（/api/accounts，spring-support-account-starter）在 monitor 后端自身。
      // 必须排在下面的 /api/account 之前：Vite 代理按前缀首个匹配生效，
      // 否则 /api/accounts 会被 /api/account 抢到外部账号服务上（404 / 串数据）。
      "/api/accounts": {
        target: apiTarget,
        changeOrigin: true,
      },
      // 渠道管理（/api/channels，spring-support-account-starter 的渠道控制器）同样在
      // monitor 后端自身。**必须显式声明**：下面 /api 的缺省目标是 127.0.0.1:8080
      // （本机没有进程），漏了这条渠道页一打开就是 502、渠道清单全空 —— 页面本身
      // 复用 @pages/channel，接口契约只认 /api/channels。
      "/api/channels": {
        target: apiTarget,
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
  // 以下 UserConfig 级字段必须放进 config：createVite 只透传 server / config，
  // 顶层 cacheDir / optimizeDeps 会被工厂忽略（见 createVite.ts CreateViteOptions）。
  config: {
    // 依赖预构建缓存目录：默认落到 app 内 .vite-cache（独立于 node_modules/.vite，
    // 不随 node_modules 重建/清理丢失，也不被多 worktree 共用的 junction 缓存污染）。
    // 需要把缓存放到别的盘时：VITE_CACHE_DIR=E:/vite-cache/monitor pnpm dev
    cacheDir: process.env.VITE_CACHE_DIR
      ? isAbsolute(process.env.VITE_CACHE_DIR)
        ? process.env.VITE_CACHE_DIR
        : join(process.cwd(), process.env.VITE_CACHE_DIR)
      : join(process.cwd(), ".vite-cache"),
    // @file-viewer/* 必须显式列入 optimizeDeps.include，不能靠懒发现。
    // 原因：这些渲染器全是 `import()` 动态加载的懒依赖，不在 include 里时
    // Vite 要等到**某个文件被打开时**才发现它们，于是运行中途触发
    // 「optimized dependencies changed. reloading」。重优化会重算 chunk 哈希，
    // 已打开页面里所有 `deps/@file-viewer_vue3.js?v=<旧哈希>` 的请求当场 404，
    // 于是 FvPanelBase / PreviewOfficePanel / FvTextPanel… 集体报
    // 「Failed to fetch dynamically imported module」并降级到兜底面板。
    // 表现就是：同一个 xlsx，第一次能渲染、刷新后变回 iframe/旧面板，
    // 动画也没了——被误判成「有的格式没接 file-viewer」，实际是依赖被优化掉了。
    // 显式 include 后启动即预打包，运行期不再变更。
    optimizeDeps: {
      // @repo/assets 提供 koi 本地图标 sprite（svgSprite.ts 用 import.meta.glob 收集
      // icons/*.svg）。它是 workspace 源码，绝不能进依赖预构建：预构建（esbuild/rolldown）
      // 不处理 `import.meta.glob` 这种 Vite 编译期表达式，产物里会残留原样调用、运行时返回
      // 空对象 —— setupSvgSprite 于是注入一个「空 sprite」并把 injected 置 true，此后所有
      // <use xlink:href="#icon-koi-*"> 都引不到 symbol，表现为菜单图标 / 面包屑图标 /
      // 标签页固定(pin)图标全部空白（而 element-plus 图标、Iconify 图标正常）。
      // @repo/theme 也在 include 里且会内联 assets，故一并排除，确保 framework → assets
      // 整条链都走源码、glob 才能正常展开。
      exclude: ["@repo/assets"],
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
      // ---- file-viewer 主体与各格式渲染器（关键：必须用 `宿主包 > 依赖` 嵌套语法）----
      // Vite 的 optimizeDeps.include 解析基准是 **本 app root**（createOptimizeDepsIncludeResolver
      // 里的 environment.getTopLevelConfig().root），解析走 resolvePackageData(id, root) ——
      // 它只沿 root 向上找 node_modules。pnpm 是 isolated 布局：这些依赖物理装在
      // <宿主包>/node_modules/ 下（@pages/filesystem、@pages/server、@pages/device、packages/ui），
      // 本 app root 的 node_modules 里根本不存在。于是裸写 "@file-viewer/vue3" 必然
      // 解析失败，每次 dev 启动打印 64 行 "Failed to resolve dependency: X, present in
      // client 'optimizeDeps.include'"，且这些依赖**完全没进预构建白名单**。
      //
      // 解法：Vite 支持 `pkg > nestedDep` 嵌套语法。解析器先用 root 解析 `pkg`（@pages/xxx
      // 是本 app 的 workspace 依赖，root 可解析），得到其真实目录，再用该目录为基准解析
      // `> ` 后面的依赖 —— 正好命中 pnpm 隔离目录。实测全列表解析通过。
      //
      // 这些渲染器全是 `import()` 动态加载的懒依赖，不在 include 里时 Vite 要等到
      // 某个文件被打开时才发现它们，于是运行中途触发
      // 「optimized dependencies changed. reloading」。重优化会重算 chunk 哈希，
      // 已打开页面里所有 `deps/@file-viewer_vue3.js?v=<旧哈希>` 的请求当场 404，
      // 于是 FvPanelBase / PreviewOfficePanel / FvTextPanel… 集体报
      // 「Failed to fetch dynamically imported module」并降级到兜底面板。
      // 表现就是：同一个 xlsx，第一次能渲染、刷新后变回 iframe/旧面板，
      // 动画也没了——被误判成「有的格式没接 file-viewer」，实际是依赖被优化掉了。
      // 显式 include 后启动即预打包，运行期不再变更。
      "@file-viewer/preset-all",
      "@pages/filesystem > @file-viewer/vue3",
      "@pages/filesystem > @file-viewer/vue3-full",
      "@pages/filesystem > @file-viewer/preset-office",
      "@pages/filesystem > @file-viewer/renderer-3d",
      "@pages/filesystem > @file-viewer/renderer-archive",
      "@pages/filesystem > @file-viewer/renderer-binary",
      "@pages/filesystem > @file-viewer/renderer-cad",
      "@pages/filesystem > @file-viewer/renderer-chm",
      "@pages/filesystem > @file-viewer/renderer-data",
      "@pages/filesystem > @file-viewer/renderer-design",
      "@pages/filesystem > @file-viewer/renderer-dicom",
      "@pages/filesystem > @file-viewer/renderer-drawing",
      "@pages/filesystem > @file-viewer/renderer-eda",
      "@pages/filesystem > @file-viewer/renderer-email",
      "@pages/filesystem > @file-viewer/renderer-epub",
      "@pages/filesystem > @file-viewer/renderer-geo",
      "@pages/filesystem > @file-viewer/renderer-image",
      "@pages/filesystem > @file-viewer/renderer-media",
      "@pages/filesystem > @file-viewer/renderer-mindmap",
      "@pages/filesystem > @file-viewer/renderer-signature",
      "@pages/filesystem > @file-viewer/renderer-text",
      "@pages/filesystem > @file-viewer/renderer-typst",
      // 各渲染器拖进来的传递依赖（ag-psd / saxes 等）同样会被懒发现，
      // 一并列出，避免它们成为「压垮骆驼的最后一根稻草」。
      // saxes / heic2any 是 @file-viewer/renderer-archive、renderer-image 的**传递依赖**，
      // 连 @pages/filesystem 自己的 node_modules 顶层都没有，故再嵌一层。
      "@pages/filesystem > ag-psd",
      "@pages/filesystem > @file-viewer/renderer-archive > saxes",
      // heic2any: CJS-only dep。Its renderHeic does `import('heic2any')` and takes the
      // default export; without an explicit include the lazy-discovered bundle has no
      // default interop, so the destructured value is undefined and HEIC/HEIF preview
      // dies with "heic2any is not a function". Listing it here makes the pre-bundle
      // emit a proper default export.
      "@pages/filesystem > @file-viewer/renderer-archive > heic2any",
      // 表格渲染器底层：file-viewer 与业务侧必须解析到同一物理实例
      "@pages/filesystem > e-virt-table/dist/index.es.js",
      // ---- CodeMirror（数据源中心的 SQL 编辑器）----
      // DbSqlEditor.vue 静态 import @codemirror/*。这些**恰好在本 app root 的
      // node_modules 顶层存在**（monitor 直接依赖），故用裸 id 即可解析。
      // 与 @file-viewer/* 同一个病（只在懒加载链上、entries 扫描发现不到），
      // 不列出则首次访问数据源管理页时触发「optimized dependencies changed.
      // reloading」，当场 504，动态导入失败 —— 表现是数据库/Redis/InfluxDB/
      // Neo4j/MongoDB 管理页集体打不开、路由只留一句 Vue Router warn、页面空白。
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/commands",
      "@codemirror/autocomplete",
      "@codemirror/language",
      "@codemirror/lang-sql",
      // ---- @novnc/novnc（远程控制台的 VNC 客户端）----
      // 与 @codemirror/* 同一条链：路由 () => import('TerminalView.vue')
      // → TerminalView → ScVncDirectViewer.vue，而后者**静态** import RFB。
      // 物理装在 @pages/server/node_modules 下，故用嵌套语法。
      // 首次加载 TerminalView 时浏览器去要 /deps/@novnc_novnc.js?v=<哈希>，
      // Vite 返回 504（Outdated Optimize Dep），动态导入随之失败 ——
      // 表现是控制台页白屏 + pageerror
      // 「Failed to fetch dynamically imported module: .../TerminalView.vue」。
      // 而且同一趟里还会连带两次：console 那条 504 与 requestfailed 的 ERR_ABORTED，
      // 一条故障报成三条。显式列出后启动即预打包，运行期不再变。
      "@pages/server > @novnc/novnc",
      // ---- hls.js / flv.js（设备视频）----
      // ReVideo.vue 里改成 `await import('hls.js')` / `import('flv.js')`
      // 按需加载后，优化器在启动扫描时看不到它们（只有动态 import，且组件本身也在
      // 懒加载路由里）。物理装在 @pages/device/node_modules 下，故用嵌套语法。
      // 不显式 include，第一次播视频时就会触发
      // 「optimized dependencies changed. reloading」，当场 504，播放器报
      // 「Failed to fetch dynamically imported module」。列出后启动即预打包。
      "@pages/device > hls.js",
      "@pages/device > flv.js",
      // ---- vxe-pc-ui 的深导入子路径 ----
      // ReTable.vue 用 `vxe-pc-ui/es/tooltip` 替掉整包入口，避免 5MB 整库进首屏；
      // 但子路径同样不在 entries 扫描范围（ReTable 只被懒加载页面引用），
      // 不写进 include 会变成运行期懒发现触发重优化。物理装在 packages/ui/node_modules
      // 下（@repo/ui 是 workspace 源码包，依赖在它自己的 node_modules），故用嵌套语法。
      "@repo/ui > vxe-table",
      "@repo/ui > @vxe-ui/core",
      "@repo/ui > vxe-pc-ui/es/tooltip",
      // ---- 其余「懒发现」依赖（第一次进对应页面才触发重优化 + 整页 reload）----
      // 同一类病：只在懒加载链上、entries 扫描发现不到。实测每条都会在首次访问时
      // 打一行「dependency optimized: X」+「optimized dependencies changed. reloading」，
      // 已打开页面当场全量刷新。全部预打包后运行期不再变更。
      // 物理位置（pnpm isolated）：依赖装在各 workspace 源码包自己的 node_modules 下，
      // 故统一用 `宿主包 > 依赖` 嵌套语法。实测全列表解析通过。
      "@repo/theme > qrcode",              // 教育AI/渠道/AI 连接器二维码
      "@pages/system > grid-layout-plus",  // 监控卡片网格拖拽布局
      "@repo/ui/re-map > @turf/turf",      // 台风风圈多边形（re-map 子目录的依赖）
      "@repo/ui > three",                  // 3D 视图
      "@repo/ui > three/addons/controls/OrbitControls.js",
      "@repo/ui > three/addons/loaders/GLTFLoader.js",
      "@repo/ui > @antv/g6",               // 关系图谱
      "@repo/ui > motion",                 // 动效
      "@repo/ui > sortablejs",             // 拖拽排序
      "@repo/ui > vxe-pc-ui",              // vxe 整包（ReTable 兜底时才用到）
      "@pages/filesystem > three",         // 文件预览 3D 渲染器用的 three（另一实例）
      "@pages/filesystem > sortablejs",
      "@pages/server > sortablejs",
    ],
    },
  },
});
