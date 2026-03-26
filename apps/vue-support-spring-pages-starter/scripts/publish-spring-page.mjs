import { execSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { appRoot, springPageTargets } from "./spring-page-targets.mjs";

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    target: process.env.SPRING_PAGE_TARGET || "",
    skipBuild: false,
    list: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (current === "--target" && args[index + 1]) {
      result.target = args[index + 1];
      index += 1;
      continue;
    }
    if (current === "--skip-build") {
      result.skipBuild = true;
      continue;
    }
    if (current === "--list") {
      result.list = true;
    }
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.list) {
    Object.entries(springPageTargets).forEach(([key, value]) => {
      console.log(`${key} -> ${value.pageKey} -> ${value.targetDir}`);
    });
    return;
  }

  const targetKey = args.target || "scheduler-job-console";
  const target = springPageTargets[targetKey];
  if (!target) {
    throw new Error(`未知发布目标: ${targetKey}`);
  }

  if (!args.skipBuild) {
    const maxOldSpaceSize = target.maxOldSpaceSize || "1024";
    execSync(
      `node ./scripts/run-vite-build.mjs --max-old-space-size=${maxOldSpaceSize} --page ${target.pageKey}`,
      {
        cwd: appRoot,
        stdio: "inherit",
        shell: true,
        env: {
          ...process.env,
          VITE_SPRING_PAGE_KEY: target.pageKey,
          ...(target.viteEnv || {}),
        },
      },
    );
  }

  const distDir = resolve(appRoot, "dist");
  if (!existsSync(distDir)) {
    throw new Error(`构建产物不存在: ${distDir}`);
  }

  await rm(target.targetDir, { force: true, recursive: true });
  await mkdir(target.targetDir, { recursive: true });
  await cp(distDir, target.targetDir, { force: true, recursive: true });

  console.log(`[publish] ${target.label}`);
  console.log(`[publish] page=${target.pageKey}`);
  console.log(`[publish] target=${target.targetDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
