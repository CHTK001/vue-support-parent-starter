import { execSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { appRoot } from "./spring-page-targets.mjs";

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    page: process.env.VITE_SPRING_PAGE_KEY || "",
    maxOldSpaceSize: "3072",
    apiRoot: process.env.VITE_SPRING_API_ROOT || "",
    authBasePath: process.env.VITE_SPRING_AUTH_BASE_PATH || "",
  };
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (current === "--page" && args[index + 1]) {
      result.page = args[index + 1];
      index += 1;
      continue;
    }
    if (current.startsWith("--max-old-space-size=")) {
      result.maxOldSpaceSize = current.split("=")[1] || result.maxOldSpaceSize;
      continue;
    }
    if (current === "--api-root" && args[index + 1]) {
      result.apiRoot = args[index + 1];
      index += 1;
      continue;
    }
    if (current === "--auth-base-path" && args[index + 1]) {
      result.authBasePath = args[index + 1];
      index += 1;
    }
  }
  return result;
}

function mergeNodeOptions(existingOptions, maxOldSpaceSize) {
  const normalized = (existingOptions || "").trim();
  if (/(^|\s)--max-old-space-size(?:=|\s)\d+/i.test(normalized)) {
    return normalized;
  }
  return [normalized, `--max-old-space-size=${maxOldSpaceSize}`].filter(Boolean).join(" ");
}

async function main() {
  const args = parseArgs(process.argv);
  await rm(resolve(appRoot, "dist"), { force: true, recursive: true });
  execSync("pnpm exec vite build", {
    cwd: appRoot,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      NODE_OPTIONS: mergeNodeOptions(process.env.NODE_OPTIONS, args.maxOldSpaceSize),
      VITE_SPRING_PAGE_KEY: args.page || process.env.VITE_SPRING_PAGE_KEY || "job-console",
      VITE_SPRING_API_ROOT: args.apiRoot || process.env.VITE_SPRING_API_ROOT || "",
      VITE_SPRING_AUTH_BASE_PATH: args.authBasePath || process.env.VITE_SPRING_AUTH_BASE_PATH || "",
    },
  });
  execSync("node ./scripts/prune-dist.mjs", {
    cwd: appRoot,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
