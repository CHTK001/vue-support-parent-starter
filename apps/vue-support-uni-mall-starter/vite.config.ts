import { resolve } from "node:path";
import { defineConfig } from "vite";
import uniPluginModule from "@dcloudio/vite-plugin-uni";

type UniPluginFactory = typeof import("@dcloudio/vite-plugin-uni").default;

const uniFactory =
  (uniPluginModule as unknown as { default?: UniPluginFactory }).default
  ?? (uniPluginModule as unknown as UniPluginFactory);

export default defineConfig({
  plugins: uniFactory(),
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@layout/uni": resolve(__dirname, "../../layout/uni/src"),
    },
  },
  server: {
    host: "0.0.0.0",
    fs: {
      allow: [resolve(__dirname, "../..")],
    },
  },
  build: {
    outDir: "dist",
  },
});
