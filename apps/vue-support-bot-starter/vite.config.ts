import { createViteConfig } from "../../packages/build-config/dist/index.mjs";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(8878)
  .host("0.0.0.0")
  .proxy("/v2/ai/bot", "http://127.0.0.1:18866")
  .build();