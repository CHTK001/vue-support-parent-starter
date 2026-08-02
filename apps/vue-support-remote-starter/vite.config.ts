import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcssVite from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const STUB = path.resolve(__dirname, "stubs");

export default defineConfig({
  plugins: [
    vue(),
    tailwindcssVite(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      // 本应用不需要其它 app 才用到的 layout/login alias，给空 stub 避免 500
      { find: "@layout/koi", replacement: path.resolve(STUB, "layout/koi/index.vue") },
      { find: "@layout/bigscreen", replacement: path.resolve(STUB, "layout/bigscreen/index.vue") },
      { find: "@repo/login/themes/koi/index.vue", replacement: path.resolve(STUB, "login/themes/koi/index.vue") },
      // pages 业务模块：先匹配 xxx/src，再匹配 xxx（带子路径时）
      { find: /^@pages\/([^/]+)$/, replacement: path.resolve(ROOT, "pages/$1/src") },
      { find: /^@pages\/([^/]+)\/(.+)$/, replacement: path.resolve(ROOT, "pages/$1/src/$2") },
      // layouts
      { find: "@layout/default", replacement: path.resolve(ROOT, "layout/default/src") },
      // packages
      { find: "@repo/components/ReIcon", replacement: path.resolve(ROOT, "packages/components/ReIcon") },
      { find: /^@repo\/components\/(.+)$/, replacement: path.resolve(ROOT, "packages/components-standalone/$1") },
      { find: "@repo/components", replacement: path.resolve(ROOT, "packages/components") },
      { find: "@repo/utils", replacement: path.resolve(ROOT, "packages/utils") },
      { find: "@repo/config", replacement: path.resolve(ROOT, "packages/config") },
      { find: "@repo/core", replacement: path.resolve(ROOT, "packages/core") },
      { find: "@repo/assets", replacement: path.resolve(ROOT, "packages/assets") },
      { find: /^@repo\/([^/]+)$/, replacement: path.resolve(ROOT, "packages/$1") },
      { find: /^@repo\/(.+)$/, replacement: path.resolve(ROOT, "packages/$1") },
      // codec-wasm
      { find: "@repo/codec-wasm", replacement: path.resolve(ROOT, "packages/codec-wasm/src/index.js") },
      // common pages
      { find: /^@repo\/common-pages\/(.+)$/, replacement: path.resolve(ROOT, "pages/common/$1") },
      { find: "@repo/common-pages", replacement: path.resolve(ROOT, "pages/common") },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 7788,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/admin/api": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/ws": { target: "ws://127.0.0.1:8082", changeOrigin: true, ws: true },
    },
  },
});