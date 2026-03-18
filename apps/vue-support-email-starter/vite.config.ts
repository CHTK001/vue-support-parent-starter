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
  getSharedPublicConfig,
} from "../../packages/build-config/dist/index.mjs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "./package.json";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = mode;
  const localRoot = process.cwd();
  const env = loadEnv(newMode, localRoot);
  console.log("当前启动模式:" + newMode);
  console.log("Root:", localRoot);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
    wrapperEnv(env);

  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const alias = createAlias(import.meta.url);

  // 设置本地包的别名以避免解析问题
  alias["@layout/default"] = resolve(root, "layout/default/src");
  alias["@repo/core"] = resolve(root, "packages/core/src");

  // 构建 mock 路径
  const mockPath = resolve(currentFileDir, "./mock");

  return {
    base: VITE_PUBLIC_PATH,
    root: localRoot,
    ...getSharedPublicConfig(),
    resolve: {
      alias,
      dedupe: ["vite", "vue", "vue-router", "vue-i18n"],
      preserveSymlinks: true,
      conditions: ["import", "module", "browser", "default"],
    },
    // 服务端配置
    server: {
      // 端口号
      port: VITE_PORT || 5174,
      host: "0.0.0.0",
      // 本地跨域代理
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8080",
          changeOrigin: true,
        },
      },
      // 预热文件以提前转换和缓存结果
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"],
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@layout/default/styles/layout/variables.scss" as *;
            @use "@layout/default/styles/layout/mixin.scss";
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
      mockPath: ["mock"],
    }),
    // 依赖优化
    optimizeDeps: {
      include: [...include, "@babel/runtime/regenerator"],
      exclude,
    },
    build: {
      target: "es2020",
      sourcemap: false,
      minify: "terser",
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: [
            "console.log",
            "console.info",
            "console.debug",
            "console.warn",
            "console.error",
          ],
          passes: 3,
          dead_code: true,
          unused: true,
          collapse_vars: true,
          reduce_vars: true,
          reduce_funcs: true,
          inline: 2,
          keep_fargs: false,
          keep_fnames: false,
        },
        mangle: {
          properties: {
            regex: /^_/,
          },
          toplevel: true,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          // 静态资源分类打包
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        },
      },
    },
    define: {
      __APP_INFO__: JSON.stringify(createAppInfo(pkg)),
    },
  };
};
