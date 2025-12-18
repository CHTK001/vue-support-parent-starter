import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// 独立构建配置 - 用于生成 doc-v2.html
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
        // 输出为单个文件，方便嵌入
        manualChunks: undefined,
        entryFileNames: "doc-v2.js",
        chunkFileNames: "doc-v2-[name].js",
        assetFileNames: "doc-v2-[name].[ext]",
      },
    },
    // 内联资源
    assetsInlineLimit: 100000,
    cssCodeSplit: false,
  },
  server: {
    port: 3100,
    open: true,
  },
});
