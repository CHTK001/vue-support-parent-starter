import { fileURLToPath } from "node:url";
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
const removeConsoleHttpEntry = fileURLToPath(
  new URL("../../packages/utils/src/http/index.ts", import.meta.url),
);
const enableFakeServer = process.env.VITE_ENABLE_FAKE_SERVER === "true";
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

const builder = createViteConfig(import.meta.url, pkg)
  .proxies({
    "/system/api": { target: "http://127.0.0.1:18170", changeOrigin: true },
    "/tenant/api": { target: "http://127.0.0.1:18171", changeOrigin: true },
  })
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

if (enableFakeServer) {
  builder.mock(["mock"]);
}

export default builder.build();
