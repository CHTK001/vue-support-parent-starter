import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileViewerRenderers } from "@file-viewer/vite-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(root, "../..");

/** @repo/utils 源码直接引入，避免包构建依赖链 */
const REPO_ALIAS: Record<string, string> = {
  "@repo/utils": path.resolve(WORKSPACE_ROOT, "packages/utils/src"),
  "@repo/config": path.resolve(WORKSPACE_ROOT, "packages/config/src"),
  "@pages/filesystem": path.resolve(WORKSPACE_ROOT, "pages/filesystem/src"),
};

/**
 * 文件服务器（FileStorageServerFilter）地址。
 *
 * <p>本前端不打包、只在本地 pnpm dev 运行，而后端在远程 192.168.50.198:8787，
 * 故代理目标需随部署环境变化。默认值写 127.0.0.1:18080 保持「本机后端」场景不变；
 * 联调远程时用 `FS_SERVER=http://192.168.50.198:8787 pnpm dev` 覆盖，
 * 无需改代码。</p>
 */
const FS_SERVER = process.env.FS_SERVER || "http://127.0.0.1:18080";

export default defineConfig({
  root,
  plugins: [
    vue(),
    // 文件预览（@file-viewer）渲染器资源复制；注册由组件显式 preset 完成，见 PreviewOfficePanel
    fileViewerRenderers({ inject: false, preset: "all", copyAssets: true }),
  ],
  resolve: {
    alias: Object.entries(REPO_ALIAS).map(([find, replacement]) => ({
      find,
      replacement,
    })),
  },
  build: {
    outDir: path.resolve(root, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(root, "index.html"),
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
      ignored: [
        (p: string) =>
          /(^|[/\\])public[/\\]vendor([/\\]|$)/.test(p) ||
          /(^|[/\\])public[/\\]flyfish-viewer-assets\.json$/.test(p),
      ],
    },
  },
});
