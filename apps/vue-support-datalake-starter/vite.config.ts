import tailwindcssVite from "@tailwindcss/vite";
import { createViteConfig } from "@repo/build-config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "./package.json";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

export default createViteConfig(import.meta.url, pkg)
  .port(8853)
  .host("0.0.0.0")
  .proxy("/v2", "http://127.0.0.1:58081") // Backend: Datalake API
  .alias("@repo/components/ScFlowEditor", resolve(__dirname, "../../packages/components/ScFlowEditor"))
  .plugins(tailwindcssVite())
  .build();
