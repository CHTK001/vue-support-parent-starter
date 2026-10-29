import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(root, "../..");

/** 共享包源码直连，避免依赖各包的构建产物（与 pages/filesystem 同口径） */
const REPO_ALIAS: Record<string, string> = {
  "@repo/core": path.resolve(WORKSPACE_ROOT, "packages/core/src"),
  "@repo/ui": path.resolve(WORKSPACE_ROOT, "packages/ui/src"),
  "@repo/utils": path.resolve(WORKSPACE_ROOT, "packages/utils/src"),
};

/**
 * @pages/docker —— Docker 独立页面包
 *
 * <p>库模式构建：宿主 app 通过 {@code createDockerRoutes()} 挂载，
 * 产物不打包 vue / element-plus / @repo/*（由宿主提供单实例）。</p>
 */
export default defineConfig({
  root,
  plugins: [vue()],
  resolve: {
    alias: Object.entries(REPO_ALIAS).map(([find, replacement]) => ({ find, replacement })),
  },
  build: {
    outDir: path.resolve(root, "dist"),
    emptyOutDir: true,
    lib: {
      entry: path.resolve(root, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["vue", "vue-router", "element-plus", "@repo/core", "@repo/ui", "@repo/utils"],
    },
  },
});
