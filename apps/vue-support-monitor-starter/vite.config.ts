import {
  type ConfigEnv,
  loadEnv,
  type UserConfigExport,
  createLogger,
} from "vite";
import {
  root,
  wrapperEnv,
  pathResolve,
  createAlias,
  createAppInfo,
  getPluginsList,
  include,
  exclude,
} from "@repo/build-config";
import pkg from "./package.json";

// 创建自定义logger过滤color-adjust警告
const logger = createLogger();
const originalWarn = logger.warn;
logger.warn = (msg, options) => {
  if (msg.includes("color-adjust")) return;
  originalWarn(msg, options);
};

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = mode;
  const env = loadEnv(newMode, root);
  console.log("当前启动模式:" + newMode);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
    wrapperEnv(env);

  return {
    base: VITE_PUBLIC_PATH,
    define: {
      // 把源码里所有 `process.env` 替换成对象字面量
      "process.env": {},
      // 若还读 global
      global: "globalThis",
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_CONFIG__: JSON.stringify(env),
      __APP_INFO__: JSON.stringify(createAppInfo(pkg)),
      __APP_ENV__: JSON.stringify(newMode),
    },
    root,
    resolve: {
      alias: {
        ...createAlias(import.meta.url),
      },
      dedupe: ["vue", "vue-router", "vue-i18n"],
      // 确保正确解析 node_modules 中的包路径
      preserveSymlinks: false,
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
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
            @use "@repo/assets/style/layout/default/variables.scss" as *;
            @use "@repo/assets/style/layout/default/mixin.scss";
          `,
        },
      },
    },
    plugins: getPluginsList({
      VITE_CDN,
      VITE_COMPRESSION,
      i18nPaths: [
        pathResolve("../locales/**", import.meta.url),
        pathResolve("@repo/config/locales/**", import.meta.url),
      ],
    }),
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
