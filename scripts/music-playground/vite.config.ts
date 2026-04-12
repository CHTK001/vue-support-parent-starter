import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  resolve: {
    dedupe: ["vue", "vue-router"],
    alias: {
      "@repo/components": fileURLToPath(
        new URL("../../packages/components", import.meta.url),
      ),
      "@repo/utils": fileURLToPath(
        new URL("./src/shims/repo-utils.ts", import.meta.url),
      ),
    },
  },
  server: {
    proxy: {
      "/v1": {
        target: "http://127.0.0.1:19091",
        changeOrigin: true,
      },
    },
  },
  plugins: [vue()],
});
