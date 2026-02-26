import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 获取共享 public 目录的配置
 * 用于让所有应用访问根目录的 public 文件夹
 */
export function getSharedPublicConfig() {
  // 获取项目根目录（从 packages/build-config 向上两级）
  const currentDir = fileURLToPath(new URL(".", import.meta.url));
  const rootPublicDir = resolve(currentDir, "../../../public");

  return {
    publicDir: rootPublicDir,
  };
}
