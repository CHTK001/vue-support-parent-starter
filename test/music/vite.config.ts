import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(8866)
  .host("0.0.0.0")
  .proxy("/v1/music", "http://127.0.0.1:19171", true, {
    rewrite: (path) => path.replace(/^\/api/, ""),
  })
  .build();
