import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 系统管理
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxies({
    "/system/api": { target: "http://127.0.0.1:18175", changeOrigin: true },
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
