import { fileURLToPath } from "node:url";
import { createViteConfig } from "@repo/build-config";
import { loadEnv, type ConfigEnv, type UserConfigExport } from "vite";
import pkg from "./package.json";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
const appRoot = fileURLToPath(new URL("./", import.meta.url));
const removeConsoleHttpEntry = fileURLToPath(
  new URL("../../packages/utils/src/http/index.ts", import.meta.url),
);
const protobufEvalWarning = (message: string) =>
  message.includes("protobufjs/dist/minimal/protobuf.js") &&
  message.includes("Use of eval");
const manualChunks = (id: string) => {
  const normalized = id.replace(/\\/g, "/");

  if (
    normalized.includes("/pages/project/src/views/ai/") ||
    normalized.includes("/pages/project/src/api/ai/") ||
    normalized.includes("/pages/project/src/api/manage/project-ai-module")
  ) {
    return "project-ai";
  }
  return undefined;
};

const resolveEnableFakeServer = (mode: string) => {
  const env = loadEnv(mode, appRoot, "");
  return (
    process.env.VITE_ENABLE_FAKE_SERVER === "true" ||
    env.VITE_ENABLE_FAKE_SERVER === "true"
  );
};

const createBuilder = (enableFakeServer: boolean) => {
  const builder = createViteConfig(import.meta.url, pkg)
    .fsAllow(workspaceRoot)
    .filterWarnings(protobufEvalWarning)
    .removeConsole(false)
    .removeConsoleExternal(removeConsoleHttpEntry)
    .aggressiveTerser()
    .merge({
      build: {
        minify: "terser",
        chunkSizeWarningLimit: 8000,
        rollupOptions: {
          output: {
            manualChunks,
          },
        },
      },
    });

  if (!enableFakeServer) {
    builder.proxies({
      "/system/api": { target: "http://127.0.0.1:18170", changeOrigin: true },
      "/tenant/api": { target: "http://127.0.0.1:18171", changeOrigin: true },
    });
  }

  if (enableFakeServer) {
    builder.mock(["mock"]);
  }

  return builder;
};

export default (env: ConfigEnv): UserConfigExport =>
  createBuilder(resolveEnableFakeServer(env.mode)).build()(env);
