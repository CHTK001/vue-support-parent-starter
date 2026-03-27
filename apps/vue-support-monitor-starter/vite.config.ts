import { createViteConfig } from "@repo/build-config";
import type { ConfigEnv, UserConfigExport } from "vite";
import pkg from "./package.json";
import { resolve } from "path";
const root = resolve(__dirname, "../..");

const manualChunks = (id: string) => {
  const normalized = id.replace(/\\/g, "/");

  if (
    normalized.includes("/pages/project/src/views/ai/") ||
    normalized.includes("/pages/project/src/api/ai/") ||
    normalized.includes("/pages/project/src/api/manage/project-ai-module")
  ) {
    return "project-ai";
  }

  if (!normalized.includes("/node_modules/")) {
    return undefined;
  }

  if (
    normalized.includes("/vue/") ||
    normalized.includes("/vue-router/") ||
    normalized.includes("/pinia/") ||
    normalized.includes("/vue-i18n/") ||
    normalized.includes("/@vueuse/")
  ) {
    return "framework";
  }

  if (
    normalized.includes("/element-plus/") ||
    normalized.includes("/@element-plus/") ||
    normalized.includes("/plus-pro-components/")
  ) {
    return "element";
  }

  if (
    normalized.includes("/echarts/") ||
    normalized.includes("/@antv/g6/") ||
    normalized.includes("/@kjgl77/datav-vue3/")
  ) {
    return "charts";
  }

  if (
    normalized.includes("/codemirror/") ||
    normalized.includes("/prismjs/") ||
    normalized.includes("/markdown-it/") ||
    normalized.includes("/highlight.js/") ||
    normalized.includes("/@wangeditor/") ||
    normalized.includes("/diff2html/") ||
    normalized.includes("/json-editor-vue3/")
  ) {
    return "editor";
  }

  if (
    normalized.includes("/video.js/") ||
    normalized.includes("/hls.js/") ||
    normalized.includes("/viewerjs/") ||
    normalized.includes("/v-viewer/") ||
    normalized.includes("/@microsoft/fetch-event-source/") ||
    normalized.includes("/@mlc-ai/web-llm/")
  ) {
    return "media";
  }

  if (
    normalized.includes("/xterm/") ||
    normalized.includes("/xterm-addon-") ||
    normalized.includes("/@xterm/") ||
    normalized.includes("/@novnc/") ||
    normalized.includes("/guacamole-common-js/") ||
    normalized.includes("/websockify/") ||
    normalized.includes("/mqtt/")
  ) {
    return "remote";
  }

  return "vendor";
};

const baseConfig = createViteConfig(import.meta.url, pkg)
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
  .build();

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
