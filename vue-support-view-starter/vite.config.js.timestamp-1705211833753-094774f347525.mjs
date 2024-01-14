// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///H:/workspace/vue-support-parent-starter/vue-support-view-starter/node_modules/.pnpm/vite@5.0.11_sass@1.58.3/node_modules/vite/dist/node/index.js";
import vue from "file:///H:/workspace/vue-support-parent-starter/vue-support-view-starter/node_modules/.pnpm/@vitejs+plugin-vue@4.6.2_vite@5.0.11_vue@3.4.13/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { createHtmlPlugin } from "file:///H:/workspace/vue-support-parent-starter/vue-support-view-starter/node_modules/.pnpm/vite-plugin-html@3.2.1_vite@5.0.11/node_modules/vite-plugin-html/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///H:/workspace/vue-support-parent-starter/vue-support-view-starter/vite.config.js";
var htmlParams = {
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
      filename: "markdown.html",
      // filename 默认是template文件名，就是index.html
      entry: "/src/markdown.js",
      template: "markdown.html"
    },
    {
      filename: "text.html",
      // filename 默认是template文件名，就是index.html
      entry: "/src/text.js",
      template: "text.html"
    },
    {
      filename: "xml.html",
      // filename 默认是template文件名，就是index.html
      entry: "/src/xml.js",
      template: "xml.html"
    },
    {
      filename: "file/json.html",
      // filename 默认是template文件名，就是index.html
      entry: "/src/json.js",
      template: "json.html"
    },
    {
      filename: "file/excel.html",
      entry: "/src/excel.js",
      template: "excel.html"
    },
    {
      filename: "file/word.html",
      entry: "/src/word.js",
      template: "word.html"
    }
  ]
};
var vite_config_default = defineConfig({
  base: "./",
  minify: "terser",
  plugins: [vue(), createHtmlPlugin(htmlParams)],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  chunkSizeWarningLimit: 5e3,
  terserOptions: {
    // 生产环境移除console
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  },
  optimizeDeps: {
    exclude: []
  },
  rollupOptions: {
    input: {},
    output: {
      manualChunks(id) {
        if (id.includes("node_modules")) {
          return id.toString().split("node_modules/")[1].split("/")[0].toString();
        }
      },
      chunkFileNames: (chunkInfo) => {
        const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/") : [];
        const fileName = facadeModuleId[facadeModuleId.length - 2] || "[name]";
        return `js/${fileName}/[name].[hash].js`;
      }
    }
  },
  server: {
    host: "0.0.0.0",
    "/admin/api": {
      target: "http://localhost:18170",
      changeOrigin: true,
      rewrite: (path) => path
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJIOlxcXFx3b3Jrc3BhY2VcXFxcdnVlLXN1cHBvcnQtcGFyZW50LXN0YXJ0ZXJcXFxcdnVlLXN1cHBvcnQtdmlldy1zdGFydGVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJIOlxcXFx3b3Jrc3BhY2VcXFxcdnVlLXN1cHBvcnQtcGFyZW50LXN0YXJ0ZXJcXFxcdnVlLXN1cHBvcnQtdmlldy1zdGFydGVyXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9IOi93b3Jrc3BhY2UvdnVlLXN1cHBvcnQtcGFyZW50LXN0YXJ0ZXIvdnVlLXN1cHBvcnQtdmlldy1zdGFydGVyL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSBcIm5vZGU6dXJsXCI7XG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgdnVlIGZyb20gXCJAdml0ZWpzL3BsdWdpbi12dWVcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjcmVhdGVIdG1sUGx1Z2luIH0gZnJvbSBcInZpdGUtcGx1Z2luLWh0bWxcIjtcblxuY29uc3QgaHRtbFBhcmFtcyA9IHtcbiAgY29sbGFwc2VXaGl0ZXNwYWNlOiB0cnVlLFxuICBrZWVwQ2xvc2luZ1NsYXNoOiB0cnVlLFxuICByZW1vdmVDb21tZW50czogdHJ1ZSxcbiAgcmVtb3ZlUmVkdW5kYW50QXR0cmlidXRlczogdHJ1ZSxcbiAgcmVtb3ZlU2NyaXB0VHlwZUF0dHJpYnV0ZXM6IHRydWUsXG4gIHJlbW92ZVN0eWxlTGlua1R5cGVBdHRyaWJ1dGVzOiB0cnVlLFxuICB1c2VTaG9ydERvY3R5cGU6IHRydWUsXG4gIG1pbmlmeUNTUzogdHJ1ZSxcbiAgcGFnZXM6IFtcbiAgICB7XG4gICAgICBmaWxlbmFtZTogXCJtYXJrZG93bi5odG1sXCIsIC8vIGZpbGVuYW1lIFx1OUVEOFx1OEJBNFx1NjYyRnRlbXBsYXRlXHU2NTg3XHU0RUY2XHU1NDBEXHVGRjBDXHU1QzMxXHU2NjJGaW5kZXguaHRtbFxuICAgICAgZW50cnk6IFwiL3NyYy9tYXJrZG93bi5qc1wiLFxuICAgICAgdGVtcGxhdGU6IFwibWFya2Rvd24uaHRtbFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgZmlsZW5hbWU6IFwidGV4dC5odG1sXCIsIC8vIGZpbGVuYW1lIFx1OUVEOFx1OEJBNFx1NjYyRnRlbXBsYXRlXHU2NTg3XHU0RUY2XHU1NDBEXHVGRjBDXHU1QzMxXHU2NjJGaW5kZXguaHRtbFxuICAgICAgZW50cnk6IFwiL3NyYy90ZXh0LmpzXCIsXG4gICAgICB0ZW1wbGF0ZTogXCJ0ZXh0Lmh0bWxcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIGZpbGVuYW1lOiBcInhtbC5odG1sXCIsIC8vIGZpbGVuYW1lIFx1OUVEOFx1OEJBNFx1NjYyRnRlbXBsYXRlXHU2NTg3XHU0RUY2XHU1NDBEXHVGRjBDXHU1QzMxXHU2NjJGaW5kZXguaHRtbFxuICAgICAgZW50cnk6IFwiL3NyYy94bWwuanNcIixcbiAgICAgIHRlbXBsYXRlOiBcInhtbC5odG1sXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICBmaWxlbmFtZTogXCJmaWxlL2pzb24uaHRtbFwiLCAvLyBmaWxlbmFtZSBcdTlFRDhcdThCQTRcdTY2MkZ0ZW1wbGF0ZVx1NjU4N1x1NEVGNlx1NTQwRFx1RkYwQ1x1NUMzMVx1NjYyRmluZGV4Lmh0bWxcbiAgICAgIGVudHJ5OiBcIi9zcmMvanNvbi5qc1wiLFxuICAgICAgdGVtcGxhdGU6IFwianNvbi5odG1sXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICBmaWxlbmFtZTogXCJmaWxlL2V4Y2VsLmh0bWxcIixcbiAgICAgIGVudHJ5OiBcIi9zcmMvZXhjZWwuanNcIixcbiAgICAgIHRlbXBsYXRlOiBcImV4Y2VsLmh0bWxcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIGZpbGVuYW1lOiBcImZpbGUvd29yZC5odG1sXCIsXG4gICAgICBlbnRyeTogXCIvc3JjL3dvcmQuanNcIixcbiAgICAgIHRlbXBsYXRlOiBcIndvcmQuaHRtbFwiLFxuICAgIH0sXG4gIF0sXG59O1xuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6IFwiLi9cIixcbiAgbWluaWZ5OiBcInRlcnNlclwiLFxuICBwbHVnaW5zOiBbdnVlKCksIGNyZWF0ZUh0bWxQbHVnaW4oaHRtbFBhcmFtcyldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoXCIuL3NyY1wiLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMDAsXG4gIHRlcnNlck9wdGlvbnM6IHtcbiAgICAvLyBcdTc1MUZcdTRFQTdcdTczQUZcdTU4ODNcdTc5RkJcdTk2NjRjb25zb2xlXG4gICAgY29tcHJlc3M6IHtcbiAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogW10sXG4gIH0sXG4gIHJvbGx1cE9wdGlvbnM6IHtcbiAgICBpbnB1dDoge30sXG4gICAgb3V0cHV0OiB7XG4gICAgICBtYW51YWxDaHVua3MoaWQpIHtcbiAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIGlkXG4gICAgICAgICAgICAudG9TdHJpbmcoKVxuICAgICAgICAgICAgLnNwbGl0KFwibm9kZV9tb2R1bGVzL1wiKVsxXVxuICAgICAgICAgICAgLnNwbGl0KFwiL1wiKVswXVxuICAgICAgICAgICAgLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBjaHVua0ZpbGVOYW1lczogKGNodW5rSW5mbykgPT4ge1xuICAgICAgICBjb25zdCBmYWNhZGVNb2R1bGVJZCA9IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZFxuICAgICAgICAgID8gY2h1bmtJbmZvLmZhY2FkZU1vZHVsZUlkLnNwbGl0KFwiL1wiKVxuICAgICAgICAgIDogW107XG4gICAgICAgIGNvbnN0IGZpbGVOYW1lID0gZmFjYWRlTW9kdWxlSWRbZmFjYWRlTW9kdWxlSWQubGVuZ3RoIC0gMl0gfHwgXCJbbmFtZV1cIjtcbiAgICAgICAgcmV0dXJuIGBqcy8ke2ZpbGVOYW1lfS9bbmFtZV0uW2hhc2hdLmpzYDtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gICAgXCIvYWRtaW4vYXBpXCI6IHtcbiAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjE4MTcwXCIsXG4gICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aCxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBYLFNBQVMsZUFBZSxXQUFXO0FBRTdaLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUVoQixTQUFTLHdCQUF3QjtBQUw4TSxJQUFNLDJDQUEyQztBQU9oUyxJQUFNLGFBQWE7QUFBQSxFQUNqQixvQkFBb0I7QUFBQSxFQUNwQixrQkFBa0I7QUFBQSxFQUNsQixnQkFBZ0I7QUFBQSxFQUNoQiwyQkFBMkI7QUFBQSxFQUMzQiw0QkFBNEI7QUFBQSxFQUM1QiwrQkFBK0I7QUFBQSxFQUMvQixpQkFBaUI7QUFBQSxFQUNqQixXQUFXO0FBQUEsRUFDWCxPQUFPO0FBQUEsSUFDTDtBQUFBLE1BQ0UsVUFBVTtBQUFBO0FBQUEsTUFDVixPQUFPO0FBQUEsTUFDUCxVQUFVO0FBQUEsSUFDWjtBQUFBLElBQ0E7QUFBQSxNQUNFLFVBQVU7QUFBQTtBQUFBLE1BQ1YsT0FBTztBQUFBLE1BQ1AsVUFBVTtBQUFBLElBQ1o7QUFBQSxJQUNBO0FBQUEsTUFDRSxVQUFVO0FBQUE7QUFBQSxNQUNWLE9BQU87QUFBQSxNQUNQLFVBQVU7QUFBQSxJQUNaO0FBQUEsSUFDQTtBQUFBLE1BQ0UsVUFBVTtBQUFBO0FBQUEsTUFDVixPQUFPO0FBQUEsTUFDUCxVQUFVO0FBQUEsSUFDWjtBQUFBLElBQ0E7QUFBQSxNQUNFLFVBQVU7QUFBQSxNQUNWLE9BQU87QUFBQSxNQUNQLFVBQVU7QUFBQSxJQUNaO0FBQUEsSUFDQTtBQUFBLE1BQ0UsVUFBVTtBQUFBLE1BQ1YsT0FBTztBQUFBLE1BQ1AsVUFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsRUFDUixTQUFTLENBQUMsSUFBSSxHQUFHLGlCQUFpQixVQUFVLENBQUM7QUFBQSxFQUM3QyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsdUJBQXVCO0FBQUEsRUFDdkIsZUFBZTtBQUFBO0FBQUEsSUFFYixVQUFVO0FBQUEsTUFDUixjQUFjO0FBQUEsTUFDZCxlQUFlO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUM7QUFBQSxFQUNaO0FBQUEsRUFDQSxlQUFlO0FBQUEsSUFDYixPQUFPLENBQUM7QUFBQSxJQUNSLFFBQVE7QUFBQSxNQUNOLGFBQWEsSUFBSTtBQUNmLFlBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixpQkFBTyxHQUNKLFNBQVMsRUFDVCxNQUFNLGVBQWUsRUFBRSxDQUFDLEVBQ3hCLE1BQU0sR0FBRyxFQUFFLENBQUMsRUFDWixTQUFTO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsY0FBTSxpQkFBaUIsVUFBVSxpQkFDN0IsVUFBVSxlQUFlLE1BQU0sR0FBRyxJQUNsQyxDQUFDO0FBQ0wsY0FBTSxXQUFXLGVBQWUsZUFBZSxTQUFTLENBQUMsS0FBSztBQUM5RCxlQUFPLE1BQU0sUUFBUTtBQUFBLE1BQ3ZCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxNQUNaLFFBQVE7QUFBQSxNQUNSLGNBQWM7QUFBQSxNQUNkLFNBQVMsQ0FBQyxTQUFTO0FBQUEsSUFDckI7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
