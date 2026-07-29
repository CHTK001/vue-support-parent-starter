import tailwindcssVite from "@tailwindcss/vite";
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .plugins(tailwindcssVite())
  .port(28849)
  .proxy("/api", "http://192.168.50.101:3000")
  .proxy("/admin/api", "http://192.168.50.101:3000")
  .proxy("/ws", "http://192.168.50.101:8082")
  .build();
