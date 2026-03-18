import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 支付系统
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://localhost:8080")
  .build();
