import tailwindcssVite from "@tailwindcss/vite";
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

const proxyTarget = process.env.VITE_PROJECT_API_TARGET || "http://127.0.0.1:58088";

export default createViteConfig(import.meta.url, pkg)
  .plugins(tailwindcssVite())
  .port(8871)
  .host("0.0.0.0")
  .proxy("/v1", proxyTarget)
  .proxy("/v2", proxyTarget)
  .build();
