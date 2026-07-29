import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .fsAllowRelative("../../")
  .filterWarningIncludes("protobufjs/dist/minimal/protobuf.js", "Use of eval")
  .keepConsole()
  .chunkSizeWarningLimit(8000)
  .cssPreprocessor("scss", {
    additionalData: '@use "@layout/koi/styles/variable.scss" as *;'
  })
  .proxies({
    "/api": {
      target: "http://127.0.0.1:8080",
      changeOrigin: true,
    }
  })
  // 将 sortablejs 等第二轮发现的依赖加入首轮优化，避免触发第二轮优化时 safe-delete 崩溃
  .include(
    "sortablejs",
    "sm-crypto",
    "@microsoft/fetch-event-source",
    "screenfull",
    "nprogress",
    "china-area-data",
    "crypto-js",
    "devtools-detector",
    "localforage",
    "js-yaml",
    "@iconify/vue",
    "interactjs",
    "vuedraggable",
  )
  .build();