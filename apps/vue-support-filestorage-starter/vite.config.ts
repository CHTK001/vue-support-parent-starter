import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileViewerRenderers } from "@file-viewer/vite-plugin";
import UnoCSS from "unocss/vite";
import {
  presetWind3,
  presetAttributify,
  presetIcons,
  presetTypography,
  transformerDirectives,
  transformerVariantGroup,
  type UserConfig as UnoConfig,
} from "unocss";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { uiExplicitAliases } from "../../turbo/vite/createVite.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(root, "../..");
/** 共享工厂目录（turbo/vite，events polyfill 等 vendored 资产所在） */
const FACTORY_DIR = path.resolve(WORKSPACE_ROOT, "turbo/vite");

/** @repo/utils 源码直接引入，避免包构建依赖链 */
const REPO_ALIAS: Record<string, string> = {
  // 子路径别名必须排在父前缀之前（对象保序，先匹配先赢）——
  // 与 turbo/vite/createVite.ts 的动态 ReXxx / theme/koi 别名同口径
  "@repo/app": path.resolve(WORKSPACE_ROOT, "turbo/app/src"),
  "@repo/ui/re-dialog": path.resolve(WORKSPACE_ROOT, "packages/ui/src/components/ReDialog/index.ts"),
  "@repo/theme/koi": path.resolve(WORKSPACE_ROOT, "packages/theme/src/themes/koi"),
  "@repo/utils": path.resolve(WORKSPACE_ROOT, "packages/utils/src"),
  "@repo/config": path.resolve(WORKSPACE_ROOT, "packages/config/src"),
  "@repo/core": path.resolve(WORKSPACE_ROOT, "packages/core/src"),
  "@repo/pages": path.resolve(WORKSPACE_ROOT, "packages/pages/src"),
  // @repo/core 源码内部引用了 @repo/pinia / @repo/pages 等但未声明依赖（既有缺陷），
  // 本应用自身不使用 pinia；这里源码直引补上解析，否则构建失败。
  // 完整清单见 turbo/vite/createVite.ts 的统一别名表。
  "@repo/pinia": path.resolve(WORKSPACE_ROOT, "packages/pinia/src"),
  "@repo/theme": path.resolve(WORKSPACE_ROOT, "packages/theme/src"),
  "@repo/ui": path.resolve(WORKSPACE_ROOT, "packages/ui/src"),
  "@repo/re-map": path.resolve(WORKSPACE_ROOT, "packages/ui/re-map"),
  "@repo/languages": path.resolve(WORKSPACE_ROOT, "packages/languages/src"),
  "@repo/work": path.resolve(WORKSPACE_ROOT, "packages/work/src"),
  "@repo/assets": path.resolve(WORKSPACE_ROOT, "packages/assets/src"),
  "@repo/images": path.resolve(WORKSPACE_ROOT, "packages/images/src"),
  "@repo/env": path.resolve(WORKSPACE_ROOT, "packages/env/src"),
  "@pages/filesystem": path.resolve(WORKSPACE_ROOT, "pages/filesystem/src"),
};

/**
 * 解析别名表：包级正则别名（echarts 兼容 / events polyfill）与 UI 组件的
 * kebab/compact 子路径别名（动态生成）在前，手写 @repo/* 源码别名在后——
 * 先匹配先赢，子路径不会被父前缀截胡。
 */
const REPO_ALIAS_ENTRIES = [
  // ol-echarts 以 `import echarts from 'echarts'`（CJS default）引用，
  // ESM 版 echarts 无 default 导出：指向同口径的兼容 shim（见 echarts-compat）
  { find: /^echarts$/, replacement: path.resolve(WORKSPACE_ROOT, "packages/ui/src/shared/echarts-compat") },
  // Node 内建 events 的浏览器 polyfill：@cornerstonejs/core（DICOM 面板）间接 require('events')
  { find: /^events$/, replacement: path.resolve(FACTORY_DIR, "events-polyfill.js") },
  ...uiExplicitAliases(),
  ...Object.entries(REPO_ALIAS).map(([find, replacement]) => ({ find, replacement })),
];

/**
 * 文件服务器（FileStorageServerFilter）地址。
 *
 * <p>本前端不打包、只在本地 pnpm dev 运行，而后端在远程 192.168.50.198:8787，
 * 故代理目标需随部署环境变化。默认值写 127.0.0.1:18080 保持「本机后端」场景不变；
 * 联调远程时用 `FS_SERVER=http://192.168.50.198:8787 pnpm dev` 覆盖，
 * 无需改代码。</p>
 */
const FS_SERVER = process.env.FS_SERVER || "http://127.0.0.1:18080";

/** UnoCSS 内联配置：与 turbo/vite/createVite.ts 共享基线一致，供 @repo/app 的 virtual:uno.css 入口解析 */
function unoConfig(): UnoConfig {
  return {
    presets: [
      presetWind3(),
      presetAttributify(),
      presetIcons({ scale: 1.2, warn: true }),
      presetTypography(),
    ],
    transformers: [transformerVariantGroup(), transformerDirectives()],
    content: {
      filesystem: [
        path.resolve(WORKSPACE_ROOT, "apps/vue-support-filestorage-starter/**/*.{vue,ts,tsx,js,jsx,html}"),
        path.resolve(WORKSPACE_ROOT, "pages/**/*.{vue,ts,tsx,js,jsx,html}"),
        path.resolve(WORKSPACE_ROOT, "packages/**/*.{vue,ts,tsx,js,jsx,html}"),
      ],
    },
  };
}

export default defineConfig({
  root,
  plugins: [
    vue(),
    UnoCSS(unoConfig()),
    // 文件预览（@file-viewer）渲染器资源复制；注册由组件显式 preset 完成，见 PreviewOfficePanel
    fileViewerRenderers({ inject: false, preset: "all", copyAssets: true }),
  ],
  resolve: {
    alias: REPO_ALIAS_ENTRIES,
  },
  css: {
    preprocessorOptions: {
      // koi 主题 SCSS 变量全局注入（与 turbo/vite/createVite.ts 的
      // scssAdditionalData 同口径）：ReDialog 等共享组件的样式依赖
      // $aside-header-height 这类变量，缺失时构建直接失败。
      scss: {
        additionalData: `@use "${path
          .join(WORKSPACE_ROOT, "packages/theme/src/themes/koi/styles/variable.scss")
          .replace(/\\/g, "/")}" as *;`,
      },
    },
  },
  build: {
    outDir: path.resolve(root, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      // 多页入口：index.html = 文件管理页（后端 static/index.html），
      // preview.html = 统一文件预览入口（后端 static/preview/index.html，
      // 由 FileStorageServerFilter.readPreviewShell 读取并注入引导参数）。
      // 两个入口共享 assets 目录，构建产物经 scripts/sync-to-fs-server.ps1 同步。
      input: {
        main: path.resolve(root, "index.html"),
        preview: path.resolve(root, "preview.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  base: "/",
  server: {
    proxy: {
      // 压缩包 / CAD 预览都走这几条路径，target 由 FS_SERVER 决定
      "/ot": { target: FS_SERVER, changeOrigin: true },
      "/config": { target: FS_SERVER, changeOrigin: true },
      "/local": { target: FS_SERVER, changeOrigin: true },
    },
    watch: {
      // @file-viewer 插件每次 dev 启动都会 rm+cp 把渲染器资源写入 public/vendor
      // （约 27MB，含 17MB 的 ppt 字体）。Windows 下 chokidar 会对这些仍在写入
      // 的大文件建 fs.watch 句柄，触发 EBUSY 并使 dev server 进程直接崩溃。
      // public/vendor 是插件生成的只读资产，监听其变化没有意义，故排除。
      // public/wasm 同理（CAD LibreDWG 等大 WASM，Windows watch 同样 EBUSY）。
      ignored: [
        (p: string) =>
          /(^|[/\\])public[/\\]vendor([/\\]|$)/.test(p) ||
          /(^|[/\\])public[/\\]wasm([/\\]|$)/.test(p) ||
          /(^|[/\\])public[/\\]flyfish-viewer-assets\.json$/.test(p),
      ],
    },
  },
});
