import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { createAlias } from "../../packages/build-config/dist/index.mjs";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      ...createAlias(import.meta.url),
      "vue-i18n": fileURLToPath(new URL("./node_modules/vue-i18n/index.js", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
