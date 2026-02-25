import {
  type ConfigEnv,
  loadEnv,
  type UserConfigExport,
  type PluginOption,
  createLogger,
} from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dayjs from "dayjs";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import { vitePluginFakeServer } from "vite-plugin-fake-server";
import { prismjsPlugin } from "vite-plugin-prismjs";
import { codeInspectorPlugin } from "code-inspector-plugin";
import topLevelAwait from "vite-plugin-top-level-await";
import svgLoader from "vite-svg-loader";
import removeNoMatch from "vite-plugin-router-warn";
import {
  createAlias as createBuildAlias,
} from "@repo/build-config";
import pkg from "./package.json";

const pathResolve = (dir = ".", metaUrl = import.meta.url) => {
  const currentFileDir = dirname(fileURLToPath(metaUrl));
  return resolve(currentFileDir, dir);
};

// 当前应用的根目录（vite.config.ts 所在目录）
const root = pathResolve(".", import.meta.url);

const createAlias = (metaUrl: string): Record<string, string> => {
  const buildAlias = createBuildAlias(metaUrl);
  // monorepo 根目录（apps/vue-support-monitor-starter 的上上级目录）
  const repoRoot = pathResolve("../..", metaUrl);
  return {
    ...buildAlias,
    "@repo/core/directives": resolve(repoRoot, "packages/core/src/directives/index.ts"),
    "@": pathResolve("./src", metaUrl),
  };
};

const createAppInfo = (packageJson: {
  name: string;
  version: string;
  engines?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}) => ({
  pkg: packageJson,
  lastBuildTime: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
});

const wrapperEnv = (envConf: Record<string, string>): any => {
  const ret: Record<string, any> = {
    VITE_PORT: 8848,
    VITE_PUBLIC_PATH: "",
    VITE_ROUTER_HISTORY: "",
    VITE_CDN: false,
    NODE_ENV: "",
    VITE_HIDE_HOME: "false",
    VITE_COMPRESSION: "none",
    VITE_API_PREFIX: "",
    VITE_API_URL: "",
  };

  for (const envName of Object.keys(envConf)) {
    let realName = envConf[envName].replace(/\\n/g, "\n");
    realName = realName === "true" ? true : realName === "false" ? false : realName;
    if (envName === "VITE_PORT") {
      realName = Number(realName);
    }
    ret[envName] = realName;
    if (typeof realName === "string") {
      process.env[envName] = realName;
    } else if (typeof realName === "object") {
      process.env[envName] = JSON.stringify(realName);
    }
  }
  return ret;
};

const include = [
  "qs",
  "dayjs",
  "axios",
  "pinia",
  "vue-i18n",
  "@vueuse/core",
  "@pureadmin/utils",
  "responsive-storage",
];

const exclude = [
  "@iconify-icons/ep",
  "@iconify-icons/ri",
  "@iconify-icons/bi",
  "@iconify-icons/simple-icons",
  "@iconify-icons/meteocons",
  "@iconify-icons/line-md",
  "@iconify-icons/humbleicons",
  "@iconify-icons/mingcute",
  "@iconify-icons/devicon",
  "@iconify-icons/pixelarticons",
  "@pureadmin/theme/dist/browser-utils",
  "@techui/scifi",
];

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
  const { VITE_PORT, VITE_PUBLIC_PATH } = wrapperEnv(env);

  const lifecycle = process.env.npm_lifecycle_event;
  const plugins: PluginOption[] = [
    vue(),
    // jsx、tsx语法支持
    vueJsx(),
    // WASM 顶层 await 支持
    topLevelAwait({
      promiseExportName: "__tla",
      promiseImportName: (i) => `__tla_${i}`,
    }),
    prismjsPlugin({
      languages: "all",
      plugins: [
        "line-numbers",
        "line-highlight",
        "inline-color",
        "copy-to-clipboard",
        "highlight-keywords",
        "show-language",
        "download-button",
        "data-uri-highlight",
      ],
      theme: "okaidia",
      css: true,
    }),
    VueI18nPlugin({
      include: [
        pathResolve("../locales/**", import.meta.url),
        pathResolve("@repo/config/locales/**", import.meta.url),
      ],
    }),
    /**
     * 在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置
     * Mac 默认组合键 Option + Shift
     * Windows 默认组合键 Alt + Shift
     * 更多用法看 https://inspector.fe-dev.cn/guide/start.html
     */
    codeInspectorPlugin({
      bundler: "vite",
      hideConsole: true,
    }),
    /**
     * 开发环境下移除非必要的 vue-router 动态路由警告
     */
    removeNoMatch(),
    // svg 组件化支持
    svgLoader(),
  ];

  if (env.VITE_USE_MOCK === "true") {
    plugins.push(
    vitePluginFakeServer({
      logger: false,
      include: [pathResolve("./mock", import.meta.url)],
      infixName: false,
      enableProd: true,
      })
    );
  }

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
      // 支持 package.json 的 exports 字段
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
    plugins,
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
