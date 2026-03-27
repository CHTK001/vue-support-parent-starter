import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 热点系统
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/agent", "http://127.0.0.1:18954")
  .aggressiveTerser()
  .build();
