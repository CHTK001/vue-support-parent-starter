<<<<<<< HEAD
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { root as projectRoot, wrapperEnv, pathResolve, createAlias, createAppInfo, getPluginsList, include, exclude, getSharedPublicConfig } from "@repo/build-config";
import pkg from "./package.json";

// 当前应用的根目录（vite.config.ts 所在目录）
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), ".");

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = "development"; //convertEnv(mode);
  const env = loadEnv(newMode, appRoot);
  console.log("当前启动模式:" + newMode);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } = wrapperEnv(loadEnv(mode, appRoot));
  const alias = createAlias(import.meta.url);

  return {
    base: VITE_PUBLIC_PATH,
    root: appRoot,
    ...getSharedPublicConfig(),
    resolve: {
      alias,
      dedupe: ["vue", "vue-router", "vue-i18n"],
      preserveSymlinks: false
=======
import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

/**
 * Vite 配置 - 热点系统
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxy("/agent", "http://127.0.0.1:18954")
  .cssPreprocessor("scss", {
    api: "modern-compiler",
    additionalData: `
      @use "@layout/default/styles/layout/variables.scss" as *;
      @use "@layout/default/styles/layout/mixin.scss";
    `,
    silenceDeprecations: ["color-functions", "global-builtin", "import"]
  })
  .terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ["console.log", "console.info", "console.debug", "console.warn", "console.error"],
      passes: 3,
      dead_code: true,
      unused: true,
      collapse_vars: true,
      reduce_vars: true,
      reduce_funcs: true,
      inline: 2,
      keep_fargs: false,
      keep_fnames: false
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
    },
    mangle: {
      properties: {
        regex: /^_/
      },
      toplevel: true,
      reserved: [],
      keep_classnames: false,
      keep_fnames: false
    },
<<<<<<< HEAD
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
          additionalData: `
            @use "@repo/assets/styles/layout/default/variables.scss" as *;
            @use "@repo/assets/styles/layout/default/mixin.scss";
          `,
          silenceDeprecations: ["color-functions", "global-builtin", "import"]
        }
      }
    },
    plugins: getPluginsList({
      VITE_CDN,
      VITE_COMPRESSION,
      i18nPaths: [pathResolve("../locales/**", import.meta.url), pathResolve("@repo/config/locales/**", import.meta.url)]
    }),
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include,
      exclude
    },
    build: {
      // 确保未启用某些实验性功能导致问题
      commonjsOptions: {
        include: [/node_modules/]
      },
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      // 需要支持 BigInt（例如部分依赖/插件会输出 BigInt 字面量）
      target: "es2020",
      sourcemap: false,
      minify: "terser",
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug", "console.warn", "console.error"],
          passes: 3,
          dead_code: true,
          unused: true,
          collapse_vars: true,
          reduce_vars: true,
          reduce_funcs: true,
          inline: 2,
          keep_fargs: false,
          keep_fnames: false
        },
        mangle: {
          properties: {
            regex: /^_/
          },
          toplevel: true,
          reserved: [],
          keep_classnames: false,
          keep_fnames: false
        },
        format: {
          comments: false,
          beautify: false,
          ascii_only: false
        }
      },
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
        external: ["@element-plus/icons-vue"],
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]"
        }
      }
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_CONFIG__: JSON.stringify(env),
      __APP_INFO__: JSON.stringify(createAppInfo(pkg)),
      __APP_ENV__: JSON.stringify(newMode)
=======
    format: {
      comments: false,
      beautify: false,
      ascii_only: false
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
    }
  })
  .build();
