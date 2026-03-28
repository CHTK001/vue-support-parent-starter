import { createViteConfig } from "@repo/build-config";
import type { ConfigEnv, Plugin, UserConfigExport } from "vite";
import pkg from "./package.json";
import { resolve } from "path";
import { createRequire } from "module";
import { readFileSync } from "fs";

const root = resolve(__dirname, "../..");
const require = createRequire(import.meta.url);
const elementPlusIconsImport = "@element-plus/icons-vue";
const elementPlusIconsRuntimeFile = "static/js/element-plus-icons-runtime.js";
const vueRuntimeFile = "static/js/vue-runtime.js";
const enableFakeServer = process.env.VITE_ENABLE_FAKE_SERVER === "true";

const vueRuntimeSource = readFileSync(
  require.resolve("vue/dist/vue.runtime.esm-browser.prod.js"),
  "utf8",
);

const elementPlusIconsRuntimeSource = readFileSync(
  require.resolve("@element-plus/icons-vue/dist/index.min.js"),
  "utf8",
)
  .replaceAll('from"vue"', 'from"./vue-runtime.js"')
  .replaceAll("from'vue'", 'from"./vue-runtime.js"');

function bundleElementPlusIconsRuntime(): Plugin {
  return {
    name: "bundle-element-plus-icons-runtime",
    enforce: "post",
    generateBundle(_, bundle) {
      this.emitFile({
        type: "asset",
        fileName: vueRuntimeFile,
        source: vueRuntimeSource,
      });
      this.emitFile({
        type: "asset",
        fileName: elementPlusIconsRuntimeFile,
        source: elementPlusIconsRuntimeSource,
      });

      for (const item of Object.values(bundle)) {
        if (item.type !== "chunk") continue;
        if (!item.code.includes(elementPlusIconsImport)) continue;
        item.code = item.code
          .replaceAll(
            `"${elementPlusIconsImport}"`,
            '"./element-plus-icons-runtime.js"',
          )
          .replaceAll(
            `'${elementPlusIconsImport}'`,
            '"./element-plus-icons-runtime.js"',
          );
      }
    },
  };
}

const manualChunks = (id: string) => {
  const normalized = id.replace(/\\/g, "/");

  if (
    normalized.includes("/pages/project/src/views/ai/") ||
    normalized.includes("/pages/project/src/api/ai/") ||
    normalized.includes("/pages/project/src/api/manage/project-ai-module")
  ) {
    return "project-ai";
  }

  return undefined;
};

const builder = createViteConfig(import.meta.url, pkg)
  .proxy("/api", "http://127.0.0.1:8080")
  .alias("@layout/default", resolve(root, "layout/default/src"))
  .alias("@pages/common", resolve(root, "pages/common"))
  .alias("@pages/dict", resolve(root, "pages/dict/src"))
  .alias("@pages/example", resolve(root, "pages/example/src"))
  .alias("@pages/pay", resolve(root, "pages/pay/src"))
  .alias("@pages/project", resolve(root, "pages/project/src"))
  .alias("@pages/proxy", resolve(root, "pages/proxy/src"))
  .alias("@pages/setting", resolve(root, "pages/setting/src"))
  .alias("@pages/system", resolve(root, "pages/system/src"))
  .alias("@pages/video", resolve(root, "pages/video/src"))
  .plugins(bundleElementPlusIconsRuntime());

if (enableFakeServer) {
  builder.mock(["mock"]);
}

const baseConfig = builder.build();

export default (env: ConfigEnv): UserConfigExport => {
  const config = baseConfig(env);
  config.build = {
    ...(config.build ?? {}),
    rollupOptions: {
      ...(config.build?.rollupOptions ?? {}),
      output: {
        ...(config.build?.rollupOptions &&
        !Array.isArray(config.build.rollupOptions.output)
          ? config.build.rollupOptions.output
          : {}),
        manualChunks,
      },
    },
  };
  config.ssr = {
    noExternal: ["@repo/core", "@layout/default"],
  };
  return config;
};
