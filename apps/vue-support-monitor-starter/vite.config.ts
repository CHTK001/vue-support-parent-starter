import { createViteConfig } from "@repo/build-config";
import { createLogger } from "vite";
import { prismjsPlugin } from "vite-plugin-prismjs";
import { codeInspectorPlugin } from "code-inspector-plugin";
import svgLoader from "vite-svg-loader";
import removeNoMatch from "vite-plugin-router-warn";
import pkg from "./package.json";

// 创建自定义 logger 过滤 color-adjust 警告
const logger = createLogger();
const originalWarn = logger.warn;
logger.warn = (msg, options) => {
  if (msg.includes("color-adjust")) return;
  originalWarn(msg, options);
};

/**
 * Vite 配置 - 监控系统
 * 使用链式 API 简化配置，包含特殊插件和配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/monitor/api", "http://172.16.2.226:19170")
  .include(
    "rete",
    "rete-vue-plugin",
    "rete-connection-plugin",
    "rete-area-plugin",
    "rete-context-menu-plugin",
    "rete-render-utils",
    "rete-auto-arrange-plugin",
    "rete-connection-reroute-plugin",
    "rete-minimap-plugin",
  )
  .target("esnext")
  .logger(logger)
  .plugins(
    prismjsPlugin({
      languages: "all",
      plugins: [
        "line-numbers",
        "line-highlight",
        "inline-color",
        "copy-to-clipboard",
        "highlight-keywords",
        "show-language",
        "download-button",
        "data-uri-highlight",
      ],
      theme: "okaidia",
      css: true,
    }),
    codeInspectorPlugin({
      bundler: "vite",
      hideConsole: true,
    }),
    removeNoMatch(),
    svgLoader(),
  )
  .cssPreprocessor("less", {
    javascriptEnabled: true,
  })
  .cssPreprocessor("scss", {
    additionalData: `
      @use "@layout/default/styles/layout/variables.scss" as *;
      @use "@layout/default/styles/layout/mixin.scss";
    `,
    silenceDeprecations: ["color-functions", "global-builtin", "import"],
  })
  .defines({
    "process.env": {},
    global: "globalThis",
  })
  .rollup({
    input: {
      index: "./index.html",
    },
    external: ["@element-plus/icons-vue"],
    output: {
      chunkFileNames: "static/js/[name]-[hash].js",
      entryFileNames: "static/js/[name]-[hash].js",
      assetFileNames: "static/[ext]/[name]-[hash].[ext]",
      manualChunks(id) {
        if (id.includes("node_modules")) {
          if (id.includes("mermaid")) return "vendor-mermaid";
          if (id.includes("codemirror")) return "vendor-codemirror";
          if (id.includes("xterm")) return "vendor-xterm";
          if (id.includes("cytoscape")) return "vendor-cytoscape";
          if (id.includes("echarts") || id.includes("zrender"))
            return "vendor-echarts";
          if (id.includes("element-plus")) return "vendor-element-plus";
          if (id.includes("vue") && !id.includes("node_modules/@vue"))
            return "vendor-vue";
          return "vendor";
        }
      },
    },
  })
  .build();
