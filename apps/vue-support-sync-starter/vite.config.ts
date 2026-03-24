import { createViteConfig } from "../../packages/build-config/src/standard-config";
import pkg from "./package.json";
import { defineConfig, mergeConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = fileURLToPath(new URL(".", import.meta.url));

/**
 * Vite 配置 - 同步系统
 * 使用链式 API 简化配置
 *
 * 注意：本应用不依赖 @repo/font-encryption，已在 rollupOptions.external 中排除
 */
const baseConfig = createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://127.0.0.1:8080")
  .target("es2015")
  .build();

export default defineConfig((env) => {
  const resolved = typeof baseConfig === "function" ? baseConfig(env) : baseConfig;
  return mergeConfig(resolved, {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
          additionalData: `
            @use "@layout/default/styles/layout/variables.scss" as *;
            @use "@layout/default/styles/layout/mixin.scss" as *;
          `,
          silenceDeprecations: ["color-functions", "global-builtin", "import"],
        },
      },
    },
    resolve: {
      alias: {
        "@element-plus/icons-vue": resolve(
          currentDir,
          "./node_modules/@element-plus/icons-vue/dist/index.js",
        ),
        "@microsoft/fetch-event-source": resolve(
          currentDir,
          "./node_modules/@microsoft/fetch-event-source/lib/esm/index.js",
        ),
        "vue-i18n": resolve(
          currentDir,
          "./node_modules/vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
        ),
        "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js": resolve(
          currentDir,
          "./node_modules/vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
        ),
      },
    },
  });
});
