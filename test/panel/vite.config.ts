import { resolve } from "node:path";
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

const root = resolve(__dirname, "../..");

export default createViteConfig(import.meta.url, pkg)
  .alias("@pages/panel", resolve(root, "pages/panel/src"))
  .port(8868)
  .host("0.0.0.0")
  .proxy("/v1/panel", "http://127.0.0.1:58080")
  .build();
