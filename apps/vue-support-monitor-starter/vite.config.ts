import path from "path";
import { type ConfigEnv, loadEnv, type UserConfigExport } from "vite";
import { exclude, include } from "./build/optimize";
import { getPluginsList } from "./build/plugins";
import { alias, pathResolve, root, wrapperEnv } from "./build/utils";

// 声明压缩类型
type ViteCompression = "none" | "gzip" | "brotli" | "both" | "gzip-clear" | "brotli-clear" | "both-clear";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = mode;
  const env = loadEnv(newMode, root);
  console.log("当前启动模式:" + newMode);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } = wrapperEnv(loadEnv(mode, root));

  // 确保 VITE_COMPRESSION 的类型正确
  const compression = VITE_COMPRESSION as ViteCompression;

  return {
    base: VITE_PUBLIC_PATH,
    define: {
      // 把源码里所有 `process.env` 替换成对象字面量
      "process.env": {},
      // 若还读 global
      global: "globalThis",
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_CONFIG__: JSON.stringify(env),
      __APP_INFO__: JSON.stringify({
        pkg: {
          name: "vue-support-monitor-starter",
          version: "1.0.0",
          dependencies: {},
          devDependencies: {}
        },
        lastBuildTime: new Date().toISOString()
      }),
      __APP_ENV__: JSON.stringify(newMode),
    },
    root,
    resolve: {
      alias,
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
        less: {
          javascriptEnabled: true,
          //引入的less全局变量，来自于开源组件ayin-color和ayin-lessmixins，访问https://www.npmjs.com/package/ayin-color 查看相关信息
        },
        scss: {
        },
      },
    },
    plugins: getPluginsList(VITE_CDN, compression),
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
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
        },
      },
    },
  };
};
