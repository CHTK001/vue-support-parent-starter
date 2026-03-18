import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 系统管理
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
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
  .build();
