import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
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
 */
const FS_SERVER = process.env.FS_SERVER || "http://127.0.0.1:18080";

export default defineConfig({
  root,
  plugins: [vue()],
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
      "/ot": { target: FS_SERVER, changeOrigin: true },
      "/config": { target: FS_SERVER, changeOrigin: true },
      "/local": { target: FS_SERVER, changeOrigin: true },
    },
  },
});