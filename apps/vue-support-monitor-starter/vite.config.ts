import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

const config = createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://127.0.0.1:8080")
  .include("@repo/core", "@layout/default")
  .build();

// 确保别名在库中的代码中也被应用
(config as any).ssr = {
  noExternal: ["@repo/core", "@layout/default"],
};

export default config;
