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
} from "../../packages/build-config/dist/index.mjs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "./package.json";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = mode;
  // const env = loadEnv(newMode, root);
  const localRoot = process.cwd();
  const env = loadEnv(newMode, localRoot);
  console.log("当前启动模式:" + newMode);
  console.log("Root:", localRoot);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } = wrapperEnv(env);
  
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const baseAlias = createAlias(import.meta.url);
  
  // 使用数组形式的别名配置，确保更具体的别名优先匹配
  // Vite 会按数组顺序匹配别名，所以更具体的路径要放在前面
  const alias = [
    // 最具体的别名放在最前面
    { find: "@repo/core/directives", replacement: resolve(root, "packages/core/src/directives/index.ts") },
    { find: "@layout/default", replacement: resolve(root, "layout/default/src") },
    // 然后添加基础别名
    ...Object.entries(baseAlias).map(([find, replacement]) => ({ find, replacement })),
    // 覆盖 @repo/core 指向 src 目录（放在后面，避免覆盖更具体的别名）
    { find: "@repo/core", replacement: resolve(root, "packages/core/src") },
  ];

  // 构建 mock 路径（相对于 vite.config.ts 文件）
  const mockPath = resolve(currentFileDir, "./mock");

  return {
    base: VITE_PUBLIC_PATH,
    root: localRoot,
    resolve: {
      alias,
      dedupe: ["vite", "vue", "vue-router", "vue-i18n"],
      preserveSymlinks: true,
      conditions: ["import", "module", "browser", "default"],
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
      mockPath: ["mock"],
    }),
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include: [
        ...include,
        "rete",
        "rete-vue-plugin",
        "rete-connection-plugin",
        "rete-area-plugin",
        "rete-context-menu-plugin",
        "rete-render-utils",
        "rete-auto-arrange-plugin",
        "rete-connection-reroute-plugin",
        "rete-minimap-plugin",
        "@babel/runtime/regenerator"
      ],
      exclude,
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "es2015",
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
      // Monaco Editor 需要 process.env 对象
      "process.env": JSON.stringify({
        NODE_ENV: mode,
        VSCODE_TEXTMATE_DEBUG: false,
      }),
    },
  };
};
