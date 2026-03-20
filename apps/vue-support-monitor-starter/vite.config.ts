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
<<<<<<< HEAD
    root,
    resolve: {
      alias: {
        ...createAlias(import.meta.url),
      },
      dedupe: ["vue", "vue-router", "vue-i18n"],
      // 确保正确解析 node_modules 中的包路径
      preserveSymlinks: false,
      // 支持 package.json 的 exports 字段
      conditions: ["import", "module", "browser", "default"],
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      headers: {
        // 允许 CSS Houdini Paint Worklet 使用 data: URL（@mmt817/pixel-ui 需要）
        // 允许 data: 字体 URL（加密字体 FontFace.load() 需要）
        "Content-Security-Policy": "worker-src data: blob: 'self'; font-src data: blob: 'self' *",
      },
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy: {
        "/monitor/api": {
          target: "http://172.16.2.226:19170",
          ws: true,
          changeOrigin: true,
          timeout: 60000, // 60秒超时
          proxyTimeout: 60000, // 代理超时
        },
      },
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"],
      },
    },
    customLogger: logger,
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          //引入的less全局变量，来自于开源组件ayin-color和ayin-lessmixins，访问https://www.npmjs.com/package/ayin-color 查看相关信息
        },
        scss: {
          additionalData: `
            @use "@repo/assets/styles/layout/default/variables.scss" as *;
            @use "@repo/assets/styles/layout/default/mixin.scss";
          `,
        },
      },
    },
    plugins,
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include,
      exclude,
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "esnext",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url),
        },
        external: ["@element-plus/icons-vue"],
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          // 手动分割代码块，优化加载性能
          manualChunks(id) {
            // 将 node_modules 中的大依赖单独打包
            if (id.includes("node_modules")) {
              // mermaid 相关
              if (id.includes("mermaid")) {
                return "vendor-mermaid";
              }
              // codemirror 相关
              if (id.includes("codemirror")) {
                return "vendor-codemirror";
              }
              // xterm 相关
              if (id.includes("xterm")) {
                return "vendor-xterm";
              }
              // cytoscape 相关
              if (id.includes("cytoscape")) {
                return "vendor-cytoscape";
              }
              // echarts 相关
              if (id.includes("echarts") || id.includes("zrender")) {
                return "vendor-echarts";
              }
              // element-plus 相关
              if (id.includes("element-plus")) {
                return "vendor-element-plus";
              }
              // vue 核心
              if (id.includes("vue") && !id.includes("node_modules/@vue")) {
                return "vendor-vue";
              }
              // 其他 node_modules 依赖
              return "vendor";
            }
          },
        },
      },
    },
  };
};
=======
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
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
