import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ["vue", "vue-router", "pinia"],
      dts: "src/auto-imports.d.ts"
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: "src/components.d.ts"
    }),
    {
      name: "copy-logos",
      closeBundle() {
        const src = resolve(__dirname, "../../packages/logos");
        const dest = resolve(__dirname, "dist");
        if (fs.existsSync(src)) {
          const dirs = fs.readdirSync(src, { withFileTypes: true });
          for (const d of dirs) {
            if (!d.isDirectory()) continue;
            const from = resolve(src, d.name);
            const to = resolve(dest, d.name);
            fs.cpSync(from, to, { recursive: true, force: true });
          }
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  publicDir: ["public", resolve(__dirname, "../../packages/logos")],
  server: {
    port: 5173,
    host: "0.0.0.0",
fs: {
      allow: [resolve(__dirname, "src"), resolve(__dirname, "../../packages/logos"), resolve(__dirname, "../../node_modules")]
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
