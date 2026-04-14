import { createViteConfig } from "@repo/build-config";
import type { Plugin } from "vite";
import pkg from "./package.json";
import { resolve } from "path";
import { createRequire } from "module";
import { readFileSync } from "fs";

const root = resolve(__dirname, "../..");
const require = createRequire(import.meta.url);
const elementPlusIconsImport = "@element-plus/icons-vue";
const elementPlusIconsRuntimeFile = "static/js/element-plus-icons-runtime.js";
const vueRuntimeFile = "static/js/vue-runtime.js";

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
export default createViteConfig(import.meta.url, pkg)
  .alias("@layout/default", resolve(root, "layout/default/src"))
  .alias("@pages/common", resolve(root, "pages/common"))
  .alias("@pages/device", resolve(root, "pages/device/src"))
  .alias("@pages/dict", resolve(root, "pages/dict/src"))
  .alias("@pages/email", resolve(root, "pages/email/src"))
  .alias("@pages/example", resolve(root, "pages/example/src"))
  .alias("@pages/job", resolve(root, "pages/job/src"))
  .alias("@pages/music", resolve(root, "pages/music/src"))
  .alias("@pages/panel", resolve(root, "pages/panel/src"))
  .alias("@pages/pay", resolve(root, "pages/pay/src"))
  .alias("@pages/project", resolve(root, "pages/project/src"))
  .alias("@pages/proxy", resolve(root, "pages/proxy/src"))
  .alias("@pages/setting", resolve(root, "pages/setting/src"))
  .alias("@pages/soft", resolve(root, "pages/soft/src"))
  .alias("@pages/sync", resolve(root, "pages/sync/src"))
  .alias("@pages/system", resolve(root, "pages/system/src"))
  .alias("@pages/tools", resolve(root, "pages/tools/src"))
  .alias("@pages/video", resolve(root, "pages/video/src"))
  .plugins(bundleElementPlusIconsRuntime())
  .proxy("/monitor/api/v1/music", "http://127.0.0.1:19171", true, {
    rewrite: (path) => path.replace(/^\/monitor\/api/, ""),
  })
  .proxyFromEnv(
    "/monitor/api",
    "VITE_MONITOR_API_TARGET",
    "http://127.0.0.1:19170",
  )
  .proxyFromEnv(
    "/socket.io",
    "VITE_MONITOR_SOCKET_TARGET",
    "http://127.0.0.1:29181",
  )
  .proxy("/api", "http://127.0.0.1:8080")
  .mockWhenEnv("VITE_ENABLE_FAKE_SERVER", ["mock"])
  .rollup({
    external: [
      "@tensorflow/tfjs",
      "@tensorflow/tfjs-core",
      "face-api.js",
      "pixel-ui",
      "pixel-ui/dist/index.css?url",
    ],
  })
  .manualChunks(manualChunks)
  .merge({
    ssr: {
      noExternal: ["@repo/core", "@layout/default"],
    },
  })
  .build();
