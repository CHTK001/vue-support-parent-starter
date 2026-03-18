import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 监控系统
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/monitor/api", "http://172.16.2.226:19170")
  .include(
    "rete",
    "rete-vue-plugin",
    "rete-connection-plugin",
    "rete-area-plugin",
  )
  .target("esnext")
  .build();
