import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .fsAllowRelative("../../")
  .filterWarningIncludes(
    "protobufjs/dist/minimal/protobuf.js",
    "Use of eval",
  )
  .keepConsole()
  .removeConsoleRelative("../../packages/utils/src/http/index.ts")
  .aggressiveTerser()
  .chunkSizeWarningLimit(8000)
  .manualChunkGroup(
    "project-ai",
    "/pages/project/src/views/ai/",
    "/pages/project/src/api/ai/",
    "/pages/project/src/api/manage/project-ai-module",
  )
  .proxyFromEnv(
    "/system/api",
    "VITE_SYSTEM_API_PROXY_TARGET",
    "http://172.16.0.40:18170",
  )
  .proxyFromEnv(
    "/tenant/api",
    "VITE_TENANT_API_PROXY_TARGET",
    "http://172.16.0.40:18171",
  )
  .proxyFromEnv(
    "/oauth",
    "VITE_OAUTH_PROXY_TARGET",
    "http://172.16.0.40:19180",
  )
  .mockWhenEnv("VITE_ENABLE_FAKE_SERVER", ["mock"])
  .build();
