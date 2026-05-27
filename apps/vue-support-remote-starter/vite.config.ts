import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(8849)
  .proxy("/api", "http://127.0.0.1:8083")
  .proxy("/admin/api", "http://127.0.0.1:3000")
  .build();
