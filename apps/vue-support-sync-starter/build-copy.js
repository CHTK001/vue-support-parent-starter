import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 将构建产物复制到后台项目的静态资源目录
 */
function copyDistToBackend() {
  const distDir = path.resolve(__dirname, "dist");
  const targetDir = path.resolve(__dirname, "../../../spring-sync-app/src/main/resources/static");

  if (!fs.existsSync(distDir)) {
    console.error("构建目录不存在:", distDir);
    process.exit(1);
  }

  // 确保目标目录存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 复制文件
  function copyRecursive(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursive(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  // 清空目标目录
  if (fs.existsSync(targetDir)) {
    fs.readdirSync(targetDir).forEach((file) => {
      const filePath = path.join(targetDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    });
  }

  // 复制构建产物
  copyRecursive(distDir, targetDir);
  console.log("✅ 构建产物已复制到后台项目:", targetDir);
}

copyDistToBackend();

