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
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
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
