import { getPluginsList } from "./build/plugins";
import { include, exclude } from "./build/optimize";
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import { root, alias, wrapperEnv, pathResolve, __APP_INFO__ } from "./build/utils";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = "development"; //convertEnv(mode);
  const env = loadEnv(newMode, root);
  console.log("当前启动模式:" + newMode);
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } = wrapperEnv(loadEnv(mode, root));
  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy: {
        "/agent": {
          target: "http://127.0.0.1:18954",
          changeOrigin: true
        }
      },
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@repo/assets/style/layout/default/variables.scss" as *;
            @use "@repo/assets/style/layout/default/mixin.scss";
          `
        }
      }
    },
    plugins: getPluginsList(VITE_CDN, VITE_COMPRESSION),
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
      target: "es2015",
      sourcemap: false,
      minify: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      terserOptions: {
        compress: {
          drop_console: true
        }
      },
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
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
      __APP_INFO__: JSON.stringify(__APP_INFO__),
      __APP_ENV__: JSON.stringify(newMode)
    }
  };
};
