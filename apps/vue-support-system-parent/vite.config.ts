import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
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

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = mode;
  const env = loadEnv(newMode, root);
  console.log("当前启动模式:" + newMode);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } = wrapperEnv(env);

  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias: createAlias(import.meta.url),
      dedupe: ["vue", "vue-router", "vue-i18n"],
      preserveSymlinks: false,
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy: {
        "/system/api": {
          target: "http://127.0.0.1:18170",
          changeOrigin: true,
        },
        "/tenant/api": {
          target: "http://127.0.0.1:18171",
          changeOrigin: true,
        },
      },
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"],
      },
    },
    css: {
      preprocessorOptions: {
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
      target: "es2015",
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
          manualChunks: (id) => {
            // 将大型依赖拆分为独立 chunk
            if (id.includes("node_modules")) {
              // Element Plus
              if (id.includes("element-plus")) {
                return "vendor-element-plus";
              }
              // Vue 核心
              if (id.includes("vue") && !id.includes("vue-router") && !id.includes("vue-i18n")) {
                return "vendor-vue";
              }
              // Vue Router
              if (id.includes("vue-router")) {
                return "vendor-vue-router";
              }
              // Vue I18n
              if (id.includes("vue-i18n")) {
                return "vendor-vue-i18n";
              }
              // VueUse
              if (id.includes("@vueuse")) {
                return "vendor-vueuse";
              }
              // PureAdmin
              if (id.includes("@pureadmin")) {
                return "vendor-pureadmin";
              }
              // Tippy.js
              if (id.includes("tippy.js")) {
                return "vendor-tippy";
              }
              // Vue Grid Layout
              if (id.includes("vue-grid-layout")) {
                return "vendor-grid-layout";
              }
              // 其他 node_modules
              return "vendor";
            }
          },
        },
      },
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_CONFIG__: JSON.stringify(env),
      __APP_INFO__: JSON.stringify(createAppInfo(pkg)),
      __APP_ENV__: JSON.stringify(newMode),
    },
  };
};
