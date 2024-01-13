import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { createHtmlPlugin } from "vite-plugin-html";

const htmlParams = {
  collapseWhitespace: true,
  keepClosingSlash: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  pages: [
    {
      filename: "markdown.html", // filename 默认是template文件名，就是index.html
      entry: "/src/markdown.js",
      template: "markdown.html",
    },
    {
      filename: "text.html", // filename 默认是template文件名，就是index.html
      entry: "/src/text.js",
      template: "text.html",
    },
    {
      filename: "xml.html", // filename 默认是template文件名，就是index.html
      entry: "/src/xml.js",
      template: "xml.html",
    },
    {
      filename: "file/fileView.html", // filename 默认是template文件名，就是index.html
      entry: "/src/fileView.js",
      template: "fileView.html",
    },
    {
      filename: "file/json.html", // filename 默认是template文件名，就是index.html
      entry: "/src/json.js",
      template: "json.html",
    },
  ],
};
// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  minify: "terser",
  plugins: [vue(), createHtmlPlugin(htmlParams)],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  chunkSizeWarningLimit: 5000,
  terserOptions: {
    // 生产环境移除console
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
  optimizeDeps: {
    exclude: [],
  },
  rollupOptions: {
    input: {},
    output: {
      manualChunks(id) {
        if (id.includes("node_modules")) {
          return id
            .toString()
            .split("node_modules/")[1]
            .split("/")[0]
            .toString();
        }
      },
      chunkFileNames: (chunkInfo) => {
        const facadeModuleId = chunkInfo.facadeModuleId
          ? chunkInfo.facadeModuleId.split("/")
          : [];
        const fileName = facadeModuleId[facadeModuleId.length - 2] || "[name]";
        return `js/${fileName}/[name].[hash].js`;
      },
    },
  },
  server: {
    host: "0.0.0.0",
    "/admin/api": {
      target: "http://localhost:18170",
      changeOrigin: true,
      rewrite: (path) => path,
    },
  },
});
