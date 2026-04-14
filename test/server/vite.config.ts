import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(8867)
  .host("0.0.0.0")
  .proxy("/server", "http://127.0.0.1:19170")
  .proxy("/soft", "http://127.0.0.1:19170")
  .build();
