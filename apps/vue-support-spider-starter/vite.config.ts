import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

/**
 * Spider Center 应用配置。
 *
 * <p>Vite 开发服务器：</p>
 * <ul>
 *   <li>主机：127.0.0.1，端口：19092</li>
 *   <li>代理：/spider-api → http://127.0.0.1:19091（后端 SpiderController）</li>
 * </ul>
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      {
        find: /^@repo\/utils$/,
        replacement: "G:/work/vue-support-parent-starter/packages/utils/src/index.ts",
      },
      {
        find: /^@repo\/ui$/,
        replacement: "G:/work/vue-support-parent-starter/packages/ui/src/index.ts",
      },
      {
        find: /^@repo\/ui\/(re-[a-z0-9-]+)$/,
        replacement: (matched) =>
          `G:/work/vue-support-parent-starter/packages/ui/src/components/${matched
            .split("/")
            .pop()
            .replace(/(^|-)([a-z])/g, (_, _sep, c) => c.toUpperCase())}/index.ts`,
      },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 19092,
    strictPort: false,
    proxy: {
      "/spider-api": {
        target: "http://127.0.0.1:19091",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/spider-api/, ""),
      },
    },
  },
});
