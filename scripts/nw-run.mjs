#!/usr/bin/env node

/**
 * NW.js 统一启动脚本
 * 替代 Tauri，实现真正的统一配置管理
 */

import { execaCommand } from "@repo/node";
import { select, cancel, isCancel, confirm } from "@clack/prompts";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

async function getApps() {
  const appsDir = join(rootDir, "apps");
  const entries = await readdir(appsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

async function generateNWConfig(appName, appDir) {
  // 读取基础配置
  const baseConfigPath = join(rootDir, "nw-shared", "package.base.json");
  const baseConfig = JSON.parse(await readFile(baseConfigPath, "utf-8"));

  // 读取应用的 package.json 获取应用信息
  const appPackagePath = join(appDir, "package.json");
  const appPackage = JSON.parse(await readFile(appPackagePath, "utf-8"));

  // 合并配置
  const nwConfig = {
    ...baseConfig,
    name: appPackage.name || appName,
    version: appPackage.version || "1.0.0",
    description: appPackage.description || baseConfig.description,
    window: {
      ...baseConfig.window,
      title: appPackage.description || appName,
    },
  };

  // 写入 NW.js 配置到应用的 dist 目录
  const distDir = join(appDir, "dist");
  if (!existsSync(distDir)) {
    await mkdir(distDir, { recursive: true });
  }

  const nwPackagePath = join(distDir, "package.json");
  await writeFile(nwPackagePath, JSON.stringify(nwConfig, null, 2), "utf-8");

  return nwPackagePath;
}

async function runDev(appName) {
  const appDir = join(rootDir, "apps", appName);

  console.log(`\n🔨 构建应用: ${appName}...`);

  // 先构建应用
  try {
    await execaCommand(`pnpm --filter=${appName} run build`, {
      stdio: "inherit",
      cwd: rootDir,
    });
  } catch (error) {
    console.error(`\n❌ 构建失败:`, error.message);
    process.exit(1);
  }

  console.log(`\n📝 生成 NW.js 配置...`);

  // 生成 NW.js 配置
  await generateNWConfig(appName, appDir);

  console.log(`\n🚀 启动 NW.js 应用...\n`);

  // 启动 NW.js
  const distDir = join(appDir, "dist");
  try {
    await execaCommand(`npx nw ${distDir}`, {
      stdio: "inherit",
      cwd: rootDir,
    });
  } catch (error) {
    console.error(`\n❌ 启动失败:`, error.message);
    process.exit(1);
  }
}

async function runBuild(appName) {
  const appDir = join(rootDir, "apps", appName);

  console.log(`\n🔨 构建应用: ${appName}...`);

  // 构建应用
  try {
    await execaCommand(`pnpm --filter=${appName} run build`, {
      stdio: "inherit",
      cwd: rootDir,
    });
  } catch (error) {
    console.error(`\n❌ 构建失败:`, error.message);
    process.exit(1);
  }

  console.log(`\n📝 生成 NW.js 配置...`);

  // 生成 NW.js 配置
  await generateNWConfig(appName, appDir);

  console.log(`\n📦 打包 NW.js 应用...`);

  // 打包 NW.js 应用
  const distDir = join(appDir, "dist");
  const outputDir = join(appDir, "nw-build");

  try {
    await execaCommand(
      `npx nwbuild --mode=build --version=latest --flavor=normal --platform=win --arch=x64 --out=${outputDir} ${distDir}`,
      {
        stdio: "inherit",
        cwd: rootDir,
      },
    );
    console.log(`\n✅ 打包完成！输出目录: ${outputDir}`);
  } catch (error) {
    console.error(`\n❌ 打包失败:`, error.message);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  if (!command || !["dev", "build"].includes(command)) {
    console.error("Usage: node nw-run.mjs [dev|build]");
    process.exit(1);
  }

  const apps = await getApps();

  const selectedApp = await select({
    message: `选择要${command === "dev" ? "运行" : "打包"}的应用:`,
    options: apps.map((app) => ({
      label: app,
      value: app,
    })),
  });

  if (isCancel(selectedApp) || !selectedApp) {
    cancel("👋 操作已取消");
    process.exit(0);
  }

  if (command === "dev") {
    await runDev(selectedApp);
  } else {
    await runBuild(selectedApp);
  }
}

main();
