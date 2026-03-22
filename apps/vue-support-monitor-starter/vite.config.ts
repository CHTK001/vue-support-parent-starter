import { createViteConfig } from "@repo/build-config";
import type { ConfigEnv, UserConfigExport } from "vite";
import pkg from "./package.json";
import { resolve } from "path";

const root = resolve(__dirname, "../..");

const baseConfig = createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://127.0.0.1:8080")
  .alias("@layout/default", resolve(root, "layout/default/src"))
  .alias("@pages/common", resolve(root, "pages/common"))
  .alias("@pages/dict", resolve(root, "pages/dict/src"))
  .alias("@pages/example", resolve(root, "pages/example/src"))
  .alias("@pages/pay", resolve(root, "pages/pay/src"))
  .alias("@pages/project", resolve(root, "pages/project/src"))
  .alias("@pages/setting", resolve(root, "pages/setting/src"))
  .alias("@pages/system", resolve(root, "pages/system/src"))
  .alias("@pages/video", resolve(root, "pages/video/src"))
  .build();

export default (env: ConfigEnv): UserConfigExport => {
  const config = baseConfig(env);
  config.ssr = {
    noExternal: ["@repo/core", "@layout/default"],
  };
  return config;
};
