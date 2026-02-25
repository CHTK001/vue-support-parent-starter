import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  wrapperEnv,
  pathResolve,
  createAlias,
  createAppInfo,
  getPluginsList,
  include,
  exclude,
} from "@repo/build-config";
import pkg from "./package.json";

// 当前应用的根目录（vite.config.ts 所在目录）
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), ".");

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = mode;
  const env = loadEnv(newMode, appRoot);
  console.log("当前启动模式:" + newMode);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } = wrapperEnv(env);

  return {
    base: VITE_PUBLIC_PATH,
    root: appRoot,
    resolve: {
      alias: createAlias(import.meta.url),
      dedupe: ["vue", "vue-router", "vue-i18n"],
      preserveSymlinks: false,
    },
    server: {
      port: VITE_PORT,
      host: "0.0.0.0",
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
    optimizeDeps: {
      include,
      exclude,
    },
    build: {
      target: "es2015",
      sourcemap: false,
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

