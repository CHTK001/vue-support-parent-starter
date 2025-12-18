import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// 独立构建配置 - 用于生成策略管理独立页面
export default defineConfig({
  plugins: [vue()],
  root: resolve(__dirname, "standalone"),
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: resolve(__dirname, "dist-standalone"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "standalone/index.html"),
      output: {
        entryFileNames: "strategy.js",
        chunkFileNames: "strategy-[name].js",
        assetFileNames: "strategy-[name].[ext]",
      },
    },
    assetsInlineLimit: 100000,
    cssCodeSplit: false,
  },
  server: {
    port: 3101,
    open: true,
  },
});
