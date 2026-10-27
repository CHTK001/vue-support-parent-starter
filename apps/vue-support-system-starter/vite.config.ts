import { fileViewerRenderers } from "@file-viewer/vite-plugin";
import { createVite, SHARED_PUBLIC_DIR } from "../../turbo/vite/createVite.ts";
import type { PluginOption, ProxyOptions } from "vite";

const sharedPublicDir = SHARED_PUBLIC_DIR.replace(/\\/g, "/").replace(/\/+$/, "");

/**
 * 第一方豁免标记（与 packages/utils/src/http.ts 的 FIRST_PARTY_MARKER 保持一致）。
 *
 * 后端 ApiRequestDecodeBodyAdvice 会把 HeadlessChrome / 自动化 UA 判为爬虫并回 403
 * 「检测到爬虫或自动化客户端访问」，豁免条件是 X-Trace-Id 与 X-Requested-With
 * 两个字段的取值都以该标记结尾（见 UserAgent.isSpider 的判定口径）。
 * dev 代理在此补齐这两个头，令被代理请求与真实浏览器发起的请求等价。
 * 仅 dev 生效，生产不经此代理。
 */
const FIRST_PARTY_MARKER = "-7f3a";

/**
 * dev 代理出口补齐第一方豁免头，并剥掉 Origin。
 *
 * 两件事必须一起做，缺一不可：
 *
 * 1) 剥掉 Origin —— 后端 plugin.oauth.cors.allowed-origins 是白名单（只含 8848 系地址）。
 *    浏览器同源 POST 会带 `Origin: http://<本机端口>`，本应用 dev 端口 8096 不在白名单里，
 *    Spring 直接回 403 `Invalid CORS request`（GET 不带 Origin 不受影响，于是表现为
 *    「读全绿、登录进不去」）。dev 下页面与代理同源，浏览器根本不校验 ACAO 响应头，
 *    所以在 proxyReq 前把 Origin 摘掉即可。这与 monitor 应用 dropProxyOrigin 插件同口径。
 *
 * 2) 补第一方标记 —— 无头浏览器无法改写 UA（Fetch 规范把 User-Agent 列为 forbidden
 *    header，JS 写入被静默丢弃），而 /v2/setting/default 这类登录前的配置拉取不走
 *    带第一方头的 http 封装，于是被 UA 规则判成爬虫回 403。
 */
function systemProxyHeaders(): PluginOption {
  return {
    name: "system-api-proxy-headers",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith("/system/api") || req.url?.startsWith("/v2")) {
          delete req.headers.origin;
          delete req.headers.referer;
          req.headers["x-trace-id"] = `e2e-${Date.now().toString(16)}${FIRST_PARTY_MARKER}`;
          req.headers["x-requested-with"] = `XMLHttpRequest${FIRST_PARTY_MARKER}`;
        }
        next();
      });
    },
  };
}

/**
 * dev 代理响应剥掉 Set-Cookie 的 Secure 标志（仅 serve 生效）。
 *
 * <p>后端经公网 https 访问时 `request.isSecure()=true`，OauthCsrfFilter 下发的
 * XSRF-TOKEN cookie 会带 Secure 属性；dev 页面跑在 http://localhost:8096，
 * 浏览器按规范丢弃 Secure cookie，登录 POST 缺 cookie 必然 403。这里在代理
 * 回写前剥掉 Secure，令 dev 浏览器能保存该 cookie（配合前端 double-submit
 * 注入 X-CSRF-TOKEN 头完成 CSRF 校验）。生产前端同样走 https，不受影响。</p>
 */
function stripSecureCookie(proxy: ProxyOptions): ProxyOptions {
  const configure = proxy.configure;
  return {
    ...proxy,
    configure(proxyServer, options) {
      configure?.(proxyServer, options);
      proxyServer.on("proxyRes", (proxyRes) => {
        const setCookie = proxyRes.headers["set-cookie"];
        if (Array.isArray(setCookie)) {
          proxyRes.headers["set-cookie"] = setCookie.map((c) => c.replace(/;\s*Secure/gi, ""));
        }
      });
    },
  };
}

export default createVite({
  appName: "vue-support-system-starter",
  title: "系统管理平台",
  publicDir: "../../public",
  plugins: [
    // dev 代理补第一方豁免头 + 剥 Origin（仅 serve 生效，见上方 systemProxyHeaders 注释）
    systemProxyHeaders(),
    // 文件预览（@file-viewer）资源接入：与 monitor / standalone / ai-guada 一致。
    //   - copyAssets 把渲染器 worker/wasm/字体复制到工作区根 public（本应用 publicDir 指向它）；
    //   - 渲染器注册由 PreviewOfficePanel 显式传 preset 完成，inject:false 不注入虚拟模块。
    fileViewerRenderers({ inject: false, preset: "office", copyAssets: true }),
  ],
  /*
   * CSS 压缩器切换：vite(rolldown) 默认用 lightningcss 压缩，本仓库在「合并后的样式」上会报
   * `Unexpected token Semicolon`（逐文件压缩、以及 dist 里 102 个 CSS 产物全部累加后压缩都复现不到，
   * 说明只在该压缩产物路径上）。改用 esbuild 压缩：既保留 CSS 压缩，又避开 lightningcss 的这条缺陷。
   * 待 lightningcss 侧定位后可以移除本项。
   */
  config: {
    build: { cssMinify: "esbuild" },
  },
  // @pages/collect、@pages/datasource 未收录在 createVite 共享 REPO_ALIAS
  // （REPO_ALIAS 里的 @pages/* 指向 pages/xxx/src，@pages/system 等同理）。
  // 但本应用入口 import "@pages/job"、而 pages/collect 的路由树里用深路径引用
  // "@pages/datasource/src/views/*.vue"，后者只有在 alias 指向包根时才能解析：
  //   "@pages/datasource/views/X.vue"     -> pages/datasource/views/X.vue      ✗ 不存在
  //   "@pages/datasource/src/views/X.vue" -> pages/datasource/src/views/X.vue  ✓
  // alias 优先于包 exports（见 createVite 的 { ...REPO_ALIAS, ...options.alias }），
  // 故补齐后与 monitor / hotspot / collect-scheduler 三个应用的写法保持一致。
  // 别漏：漏 @pages/datasource 会让 collect 的 routes 桶文件 transform 500，
  // 连带 pages/collect 整包加载失败，调度管理页白屏并渲染成 [object Promise]。
  alias: {
    // pages/ai 的页面（ModelsPage 等）用 `@/` 指向 pages/ai/src（其自身约定，见 ai-guada
    // vite 的 `@ -> pages/ai/src`）。本应用自身走相对路径 + @repo/*，不用 `@/`，故 `@`
    // 仅服务 pages/ai 子树；`@` 只匹配 `@/…`，不影响 @repo/*、@pages/*。
    "@": "pages/ai/src",
    "@pages/collect": "pages/collect",
    "@pages/job": "pages/job",
    "@pages/datasource": "pages/datasource",
  },
  server: {
    port: 8096,
    strictPort: true,
    watch: {
      // copyAssets 每次 dev 启动都会重写根 publicDir（vendor/*、wasm/cad|data|model|typst、
      // flyfish-viewer-assets.json 等）。Windows 下 chokidar 对仍在写入的文件建 fs.watch
      // → EBUSY → dev 进程直接崩溃（实测崩点 public/wasm/typst/fonts/LibertinusSerif-Bold.otf）。
      // 根 public 整体不作为 HMR 源，精确排除 SHARED_PUBLIC_DIR，避免误忽略 apps/*/public
      // 等源码维护的静态资产；曾按目录逐个列举，新增 typst 字体后再次 EBUSY。
      ignored: [
        (p: string) => {
          const normalized = p.replace(/\\/g, "/").replace(/\/+$/, "");
          return normalized === sharedPublicDir || normalized.startsWith(`${sharedPublicDir}/`);
        },
      ],
    },
    proxy: {
      // 系统管理控制台后端：部署在 192.168.50.198 的 API（context-path /system/api）。
      // 前端本地跑，后端在 198，故代理指向远端而不是 localhost。
      // SYSTEM_API_TARGET 可覆盖：本机若有 18170 隧道/本地实例保持默认，
      // E2E 等直连 198 场景用 SYSTEM_API_TARGET=http://192.168.50.198:18170。
      "/system/api": stripSecureCookie({
        target: process.env.SYSTEM_API_TARGET ?? "http://127.0.0.1:18170",
        changeOrigin: true,
      }),
      // AI 提供商管理（pages/ai 的模型管理页）内嵌后，其 apiService 以 `/v2` 为基址
      // （web 模式见 pages/ai/src/services/ApiService.ts）。系统后端 context-path 为
      // /system/api，ai-starter 的 /v2/** 端点落在 /system/api/v2/** 下，故把 /v2 代理到
      // 系统后端并补上 context-path。仅 pages/ai 子树用 /v2；本应用自身走 /system/api，
      // 两者前缀不重叠。/v2 与 /system/api 都指向同一 SYSTEM_API_TARGET。
      "/v2": stripSecureCookie({
        target: process.env.SYSTEM_API_TARGET ?? "http://127.0.0.1:18170",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/v2/, "/system/api/v2"),
      }),
      // pages/ai 模型管理页的 adminApi（rootHttp，baseURL 为空）直接调 `/api/providers`
      // 等管理端点（见 pages/ai/src/services/modules/model.api.ts），这些端点在 ai-starter
      // 的 manage/api 控制器下（@RequestMapping("/api")）。内嵌到系统后端后它们落在
      // /system/api/api/** 下，故 /api 代理到系统后端并补 context-path 与 /api 前缀。
      // 仅 pages/ai 子树用 /api；本应用自身走 /system/api 与 /v2，前缀不重叠。
      "/api": stripSecureCookie({
        target: process.env.SYSTEM_API_TARGET ?? "http://127.0.0.1:18170",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/system/api/api"),
      }),
      // 天气：Open-Meteo 免费天气 API（无需 key）
      "/weather-api": {
        target: "https://api.open-meteo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weather-api/, ""),
      },
      // 天气：BigDataCloud 反向地理编码
      "/geo-api": {
        target: "https://api.bigdatacloud.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/geo-api/, ""),
      },
      // 天气：freeipapi IP 定位
      "/freeip-api": {
        target: "https://freeipapi.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/freeip-api/, ""),
      },
      // 天气：ip-api IP 定位（HTTP 免费版，HTTPS 返回 403）
      "/ip-api": {
        target: "http://ip-api.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ip-api/, ""),
      },
      // 台风：浙江省水利厅台风网开放接口（后台未实现 /v2/typhoon/* 时的兜底数据源）
      "/typhoon-api": {
        target: "https://typhoon.slt.zj.gov.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/typhoon-api/, "/Api"),
      },
    },
  },
});