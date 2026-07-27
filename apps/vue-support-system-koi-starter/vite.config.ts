import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";
import Unocss from "unocss/vite";
import koiUnoConfig from "@layout/koi/unocss.config.mjs";

export default createViteConfig(import.meta.url, pkg)
  .fsAllowRelative("../../")
  .filterWarningIncludes("protobufjs/dist/minimal/protobuf.js", "Use of eval")
  .keepConsole()
  .chunkSizeWarningLimit(8000)
  .cssPreprocessor("scss", {
    additionalData: '@use "@layout/koi/styles/variables.scss" as *;'
  })
  .plugins(Unocss(koiUnoConfig))
  .proxies({
    "/api": {
      target: "http://127.0.0.1:8080",
      changeOrigin: true,
    }
  })
  .build();