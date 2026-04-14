import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

const proxyTarget =
  process.env.VITE_SPIDER_TEST_PROXY_TARGET || "http://127.0.0.1:19091";

export default createViteConfig(import.meta.url, pkg)
  .port(8868)
  .host("0.0.0.0")
  .proxy("/v1/spider", proxyTarget)
  .build();
