import tailwindcssVite from "@tailwindcss/vite";
import { createViteConfig } from "@repo/build-config";
import type { Plugin } from "vite";
import pkg from "./package.json";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { createRequire } from "module";

const root = resolve(__dirname, "../..");
const require = createRequire(import.meta.url);
const elementPlusIconsImport = "@element-plus/icons-vue";
const elementPlusIconsRuntimeFile = "static/js/element-plus-icons-runtime.js";
const vueRuntimeFile = "static/js/vue-runtime.js";

const resolveRuntimeFile = (request: string, fallbackRelativePath: string) => {
  try {
    return require.resolve(request);
  } catch {
    const fallback = resolve(root, fallbackRelativePath);
    if (!existsSync(fallback)) {
      throw new Error(`Missing runtime file: ${request} / ${fallback}`);
    }
    return fallback;
  }
};

const vueRuntimeSource = readFileSync(
  resolveRuntimeFile(
    "vue/dist/vue.runtime.esm-browser.prod.js",
    "node_modules/vue/dist/vue.runtime.esm-browser.prod.js",
  ),
  "utf8",
);

const elementPlusIconsRuntimeSource = readFileSync(
  resolveRuntimeFile(
    "@element-plus/icons-vue/dist/index.min.js",
    "node_modules/@element-plus/icons-vue/dist/index.min.js",
  ),
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
    normalized.includes("/pages/ai/src/views/ai/") ||
    normalized.includes("/pages/ai/src/api/ai/") ||
    normalized.includes("/pages/ai/src/api/manage/project-ai-module")
  ) {
    return "ai-center";
  }

  return undefined;
};
export default createViteConfig(import.meta.url, pkg)
  .alias("@layout/default", resolve(root, "layout/default/src"))
  .alias("@layout/koi", resolve(root, "layout/koi/src"))
  .alias("@pages/ai", resolve(root, "pages/ai/src"))
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
  .alias("@pages/protocol", resolve(root, "pages/protocol/src"))
  .alias("@pages/proxy", resolve(root, "pages/proxy/src"))
  .alias("@pages/setting", resolve(root, "pages/setting/src"))
  .alias("@pages/soft", resolve(root, "pages/soft/src"))
  .alias("@pages/sync", resolve(root, "pages/sync/src"))
  .alias("@pages/system", resolve(root, "pages/system/src"))
  .alias("@pages/tools", resolve(root, "pages/tools/src"))
  .alias("@pages/video", resolve(root, "pages/video/src"))
  .alias("@pages/datalake", resolve(root, "pages/datalake/src"))
  .plugins(bundleElementPlusIconsRuntime())
  .proxy("/monitor/api/v1/music", "http://127.0.0.1:19171", true, {
    rewrite: (path) => path.replace(/^\/monitor\/api/, ""),
  })
  .proxy("/monitor/api/v1/job", "http://127.0.0.1:8080", false, {
    rewrite: (path) => path.replace(/^\/monitor\/api\/v1\/job/, "/job-console/api/default/job"),
  })
  .proxy("/monitor/api/soft", "http://127.0.0.1:18171", true, {
    rewrite: (path) => path.replace(/^\/monitor\/api/, "/soft-test/api"),
  })
  .proxy("/monitor/api/server", "http://127.0.0.1:18171", true, {
    rewrite: (path) => path.replace(/^\/monitor\/api/, "/soft-test/api"),
  })
  .proxy("/monitor/api/v2/ai", "http://127.0.0.1:19170/monitor/api", true, {
    rewrite: (path) => path.replace(/^\/monitor\/api/, ""),
  })
  .proxyFromEnv("/monitor/api/v2", "VITE_MONITOR_V2_API_TARGET", "http://127.0.0.1:58081", true, {
    rewrite: (path) => path.replace(/^\/monitor\/api\/v2/, "/v2"),
  })
  .proxy(
    "/monitor/api/v2/devops",
    "http://127.0.0.1:58080",
    true,
    {
      rewrite: (path) => path.replace(/^\/monitor\/api/, ""),
    },
  )
  .proxyFromEnv(
    "/monitor/api",
    "VITE_MONITOR_API_TARGET",
    "http://127.0.0.1:19170",
    true,
  )
  .proxyFromEnv(
    "/socket.io",
    "VITE_MONITOR_SOCKET_TARGET",
    "http://127.0.0.1:29181",
  )
  .proxy("/spider-api", "http://127.0.0.1:19091", true, {
    rewrite: (path) => path.replace(/^\/spider-api/, ""),
  })
  .proxy("/v2/ai", "http://127.0.0.1:19170/monitor/api")
  .proxyFromEnv("/v2", "VITE_MONITOR_V2_API_TARGET", "http://127.0.0.1:58081")
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
  .plugins(tailwindcssVite())
  .merge({
    ssr: {
      noExternal: ["@repo/core", "@layout/default", "@layout/koi"],
    },
  })
  .build();
