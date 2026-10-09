import { fileViewerRenderers } from "@file-viewer/vite-plugin";
import { createVite } from "../../turbo/vite/createVite.ts";

export default createVite({
  appName: "vue-support-system-starter",
  title: "系统管理平台",
  publicDir: "../../public",
  plugins: [
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
    "@pages/collect": "pages/collect",
    "@pages/job": "pages/job",
    "@pages/datasource": "pages/datasource",
  },
  server: {
    port: 8096,
    strictPort: true,
    watch: {
      // 插件每次 dev 启动都会 rm+cp 重写 public/vendor（约 27MB，含 17MB ppt 字体）。
      // Windows 下 chokidar 对仍在写入的大文件建 fs.watch → EBUSY → dev 进程崩溃，
      // 而监听这些插件生成的只读资产没有意义，故从 watcher 排除（与 monitor 同口径）。
      ignored: [
        (p: string) =>
          /(^|[/\\])public[/\\]vendor([/\\]|$)/.test(p) ||
          /(^|[/\\])public[/\\]flyfish-viewer-assets\.json$/.test(p),
      ],
    },
    proxy: {
      // 系统管理控制台后端：部署在 192.168.50.198 的 API（context-path /system/api）。
      // 前端本地跑，后端在 198，故代理指向远端而不是 localhost。
      // SYSTEM_API_TARGET 可覆盖：本机若有 18170 隧道/本地实例保持默认，
      // E2E 等直连 198 场景用 SYSTEM_API_TARGET=http://192.168.50.198:18170。
      "/system/api": {
        target: process.env.SYSTEM_API_TARGET ?? "http://127.0.0.1:18170",
        changeOrigin: true,
      },
      // 文件存储服务器：pdf.js viewer 入口 /preview-vendor/* 是 FileStorageServerFilter
      // 的 classpath 静态资源。注意它只在 18082 上托管（18080 只有 /local /ot 等桶 API，
      // /preview-vendor 404），故默认指向 18082。本应用文件内容由 localStorage 直连
      // 后端（18080），但 viewer.html 是同源路径，不代理会在 dev 下 404、
      // 原生 PDF 预览白屏（与 monitor 同口径）。
      //
      // ⚠️⚠️ 临时 rewrite：pdf.js 图标/locale 404 补偿，198 重新部署后必须删除 ⚠️⚠️
      // 远端 18082 的 preview-vendor/pdf/viewer 下是 images/images/、locale/locale/
      // 双层嵌套（打包时多套了一层），pdf.js 按 flat 路径取 images/*.svg → 404 →
      // 顶部工具条图标全缺。spring 仓库源码与 target/classes 已拍平，但 198 上跑的
      // 仍是旧 jar。这里把 flat 请求改写回 nested 作过渡补偿。
      // **重新部署 198（拍平后的资产）后删掉下面的 rewrite** ——
      // 届时服务端已是 flat，再改写会让所有图标反过来 404。
      "/preview-vendor": {
        target: process.env.FS_API_TARGET ?? "http://192.168.50.198:18082",
        changeOrigin: true,
        rewrite: (path: string) =>
          path
            .replace(
              /^\/preview-vendor\/pdf\/viewer\/images\/(?!images\/)/,
              "/preview-vendor/pdf/viewer/images/images/",
            )
            .replace(
              /^\/preview-vendor\/pdf\/viewer\/locale\/(?!locale\/)/,
              "/preview-vendor/pdf/viewer/locale/locale/",
            ),
      },
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