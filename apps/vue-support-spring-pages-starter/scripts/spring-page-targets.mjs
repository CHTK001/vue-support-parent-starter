import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
export const appRoot = resolve(scriptRoot, "..");
const workspaceRoot = resolve(appRoot, "..", "..");
const springApiRoot = resolve(workspaceRoot, "..", "spring-support-api-parent");
const springSupportRoot = resolve(
  workspaceRoot,
  "..",
  "spring-support-parent-starter",
);

export const springPageTargets = {
  "scheduler-job-console": {
    label: "Scheduler Job Console",
    pageKey: "job-console",
    maxOldSpaceSize: "1024",
    viteEnv: {
      VITE_SPRING_API_ROOT: "../job-console/api/",
    },
    targetDir: resolve(
      springApiRoot,
      "spring-api-support-scheduler-starter",
      "src",
      "main",
      "resources",
      "static",
      "job-console",
    ),
  },
  "payment-ops-console": {
    label: "Payment Operations Console",
    pageKey: "payment-console",
    maxOldSpaceSize: "1024",
    viteEnv: {
      VITE_SPRING_API_ROOT: "../api/ops/",
    },
    targetDir: resolve(
      springApiRoot,
      "spring-api-support-payment-starter",
      "src",
      "main",
      "resources",
      "static",
      "payment-console",
    ),
  },
  "proxy-console": {
    label: "Proxy Orchestration Console",
    pageKey: "proxy-console",
    maxOldSpaceSize: "3072",
    viteEnv: {
      VITE_SPRING_API_ROOT: "../proxy/",
    },
    targetDir: resolve(
      springSupportRoot,
      "spring-support-proxy-starter",
      "src",
      "main",
      "resources",
      "static",
      "proxy-console",
    ),
  },
  "strategy-console": {
    label: "Strategy Console",
    pageKey: "strategy-console",
    maxOldSpaceSize: "1024",
    viteEnv: {
      VITE_SPRING_API_ROOT: "../v2/strategy/",
      VITE_SPRING_AUTH_BASE_PATH: "../v2/strategy/auth/",
    },
    targetDir: resolve(
      springSupportRoot,
      "spring-support-strategy-starter",
      "src",
      "main",
      "resources",
      "static",
      "strategy-console",
    ),
  },
  "sync-data-console": {
    label: "Sync Data Console",
    pageKey: "sync-data-console",
    maxOldSpaceSize: "1024",
    viteEnv: {
      VITE_SPRING_API_ROOT: "../v1/sync/",
      VITE_SPRING_AUTH_BASE_PATH: "../v1/sync/auth/",
    },
    targetDir: resolve(
      springSupportRoot,
      "spring-support-sync-data-starter",
      "src",
      "main",
      "resources",
      "static",
      "sync-data-console",
    ),
  },
};
