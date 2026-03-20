import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 同步系统
 * 使用链式 API 简化配置
 *
 * 注意：本应用不依赖 @repo/font-encryption，已在 rollupOptions.external 中排除
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://127.0.0.1:8080")
  .target("es2015")
  .build();
