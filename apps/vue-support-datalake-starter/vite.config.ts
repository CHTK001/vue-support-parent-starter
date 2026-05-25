import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(8853)
  .host("0.0.0.0")
  .proxy("/v2", "http://127.0.0.1:58081")
  .build();
