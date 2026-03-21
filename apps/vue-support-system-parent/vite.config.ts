import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";
import { defineConfig, mergeConfig } from "vite";
import { resolve } from "node:path";

// 工作区根目录
const workspaceRoot = resolve(__dirname, "../../");

const baseConfig = createViteConfig(import.meta.url, pkg)
  .proxies({
    "/system/api": { target: "http://127.0.0.1:18170", changeOrigin: true },
    "/tenant/api": { target: "http://127.0.0.1:18171", changeOrigin: true },
  })
  .include(
    "rete",
    "rete-vue-plugin",
    "rete-connection-plugin",
    "rete-area-plugin",
    "rete-context-menu-plugin",
    "rete-render-utils",
    "rete-auto-arrange-plugin",
    "rete-connection-reroute-plugin",
    "rete-minimap-plugin",
    "@babel/runtime/regenerator",
    "@pixelium/web-vue",
    "three",
  )
  .mock(["mock"])
  .terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: [
        "console.log",
        "console.info",
        "console.debug",
        "console.warn",
        "console.error",
      ],
      passes: 3,
      dead_code: true,
      unused: true,
      collapse_vars: true,
      reduce_vars: true,
      reduce_funcs: true,
      inline: 2,
      keep_fargs: false,
      keep_fnames: false,
    },
    mangle: {
      properties: {
        regex: /^_/,
      },
      toplevel: true,
    },
    format: {
      comments: false,
    },
  })
  .build();

export default defineConfig((env) => {
  const resolved = typeof baseConfig === "function" ? baseConfig(env) : baseConfig;
  return mergeConfig(resolved, {
    server: {
      fs: {
        allow: [workspaceRoot],
      },
    },
  });
});
