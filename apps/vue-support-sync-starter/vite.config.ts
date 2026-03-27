import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

export default createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://127.0.0.1:8080")
  .target("es2015")
  .cssPreprocessor("scss", {
    additionalData: `
      @use "@layout/default/styles/layout/variables.scss" as *;
      @use "@layout/default/styles/layout/mixin.scss" as *;
    `,
  })
  .packageAlias(
    "@element-plus/icons-vue",
    "@element-plus/icons-vue/dist/index.js",
  )
  .packageAlias(
    "@microsoft/fetch-event-source",
    "@microsoft/fetch-event-source/lib/esm/index.js",
  )
  .packageAlias(
    "vue-i18n",
    "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
  )
  .packageAlias(
    "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
    "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
  )
  .build();
