<<<<<<< HEAD
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@layout/default": resolve(__dirname, "../../layout/default/src"),
      "@repo": resolve(__dirname, "../../packages"),
      "@repo/app-root": resolve(__dirname, "../../packages/app-root/src"),
      "@repo/assets": resolve(__dirname, "../../packages/assets"),
      "@repo/codec-wasm": resolve(__dirname, "../../packages/codec-wasm"),
      "@repo/components": resolve(__dirname, "../../packages/components"),
      "@repo/config": resolve(__dirname, "../../packages/config"),
      "@repo/core": resolve(__dirname, "../../packages/core"),
      "@repo/module": resolve(__dirname, "../../packages/module"),
      "@repo/plugins": resolve(__dirname, "../../packages/plugins"),
      "@repo/pages": resolve(__dirname, "../../packages/pages"),
      "@repo/utils": resolve(__dirname, "../../packages/utils"),
    },
    dedupe: ["vue", "vue-router"],
    preserveSymlinks: true,
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      external: [
        "@repo/font-encryption",
        "@pixelium/web-vue",
        "@pixelium/web-vue/dist/font.css?url",
        "@pixelium/web-vue/dist/normalize.css?url",
        "@pixelium/web-vue/dist/pixelium-vue.css?url",
      ],
      output: {
        manualChunks: {
          "element-plus": ["element-plus"],
        },
      },
    },
  },
});
=======
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 支付系统
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://localhost:8080")
  .build();
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
