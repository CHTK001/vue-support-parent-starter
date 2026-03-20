import { createViteConfig } from "@repo/build-config";
import pkg from "./package.json";

<<<<<<< HEAD
export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = mode;
  // const env = loadEnv(newMode, root);
  const localRoot = process.cwd();
  const env = loadEnv(newMode, localRoot);
  console.log("当前启动模式:" + newMode);
  console.log("Root:", localRoot);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
    wrapperEnv(env);

  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const alias = createAlias(import.meta.url);

  // 构建 mock 路径（相对于 vite.config.ts 文件）
  const mockPath = resolve(currentFileDir, "./mock");

  return {
    base: VITE_PUBLIC_PATH,
    root: localRoot,
    ...getSharedPublicConfig(),
    resolve: {
      alias,
      dedupe: ["vite", "vue", "vue-router", "vue-i18n", "three"],
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
        "/system/api": {
          target: "http://127.0.0.1:18175",
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
            @use "@repo/assets/styles/layout/default/variables.scss" as *;
            @use "@repo/assets/styles/layout/default/mixin.scss";
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
=======
/**
 * Vite 配置 - 系统管理
 * 使用链式 API 简化配置
 */
export default createViteConfig(import.meta.url, pkg)
  .proxies({
    "/system/api": { target: "http://127.0.0.1:18170", changeOrigin: true },
    "/tenant/api": { target: "http://127.0.0.1:18171", changeOrigin: true },
  })
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
    "@babel/runtime/regenerator",
    "@pixelium/web-vue",
    "three",
  )
  .mock(["mock"])
  .terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: [
        "console.log",
        "console.info",
        "console.debug",
        "console.warn",
        "console.error",
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
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
  })
  .build();
