import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 邮件系统
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .port(5174)
  .proxy("/api", "http://127.0.0.1:8080")
  .build();
