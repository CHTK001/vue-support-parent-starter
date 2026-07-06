import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .port(8876)
  .host("0.0.0.0")
  // 系统 API 代理 — 后端 system 服务，端口 18170，context-path: /system/api
  .proxy("/system/api", "http://127.0.0.1:18170")
  // OAuth 代理 — 后端 oauth 服务
  .proxy("/oauth", "http://127.0.0.1:19180")
  // 外部化 onnxruntime-web — @imgly/background-removal 的动态导入导致 rollup 无法解析
  .merge({
    build: {
      rollupOptions: {
        external: [/^onnxruntime-web/],
      },
    },
  })
  .build();