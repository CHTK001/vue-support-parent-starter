import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .proxy("/v2/loki", "http://127.0.0.1:19999")
  .proxy("/system/api", "http://127.0.0.1:19999")
  .build();
