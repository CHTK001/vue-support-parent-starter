#!/usr/bin/env node

import { execaCommand } from "@repo/node";
import { mkdir, copyFile, cp } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const rendererDist = join(rootDir, "test", "music", "dist");
const electronBuildDir = join(rootDir, "electron", "build");
const rendererOutDir = join(electronBuildDir, "renderer");
const backendOutDir = join(electronBuildDir, "backend");
const backendJarOut = join(backendOutDir, "music-server.jar");

async function runDev() {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL || "http://127.0.0.1:8866";
  await execaCommand("pnpm exec electron ./electron/main.cjs", {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      ELECTRON_RENDERER_URL: rendererUrl,
    },
  });
}

async function prepareRenderer() {
  if (process.env.ELECTRON_SKIP_RENDERER_BUILD !== "true") {
    await execaCommand("pnpm --filter music-test-app run build", {
      cwd: rootDir,
      stdio: "inherit",
    });
  }
  await mkdir(rendererOutDir, { recursive: true });
  await cp(rendererDist, rendererOutDir, { recursive: true, force: true });
}

async function prepareBackend() {
  const jarPath = process.env.MUSIC_BACKEND_JAR;
  if (!jarPath) {
    throw new Error(
      "缺少 MUSIC_BACKEND_JAR 环境变量，请指向后端可运行 jar，例如 spring-api-support-common-music-demo-*.jar",
    );
  }
  await mkdir(backendOutDir, { recursive: true });
  await copyFile(resolve(jarPath), backendJarOut);
}

async function runPack(args) {
  await prepareRenderer();
  await prepareBackend();
  const targetFlags = args.filter((arg) => ["--win", "--mac", "--linux"].includes(arg));
  const command = [
    "pnpm exec electron-builder",
    "--config electron/electron-builder.json",
    ...targetFlags,
  ].join(" ");
  await execaCommand(command, {
    cwd: rootDir,
    stdio: "inherit",
  });
}

async function main() {
  const command = process.argv[2];
  if (!command || !["dev", "pack"].includes(command)) {
    console.error("Usage: node scripts/electron-run.mjs [dev|pack] [--win|--mac|--linux]");
    process.exit(1);
  }

  if (command === "dev") {
    await runDev();
    return;
  }

  await runPack(process.argv.slice(3));
}

main().catch((error) => {
  console.error("[electron-run] 失败:", error);
  process.exit(1);
});
