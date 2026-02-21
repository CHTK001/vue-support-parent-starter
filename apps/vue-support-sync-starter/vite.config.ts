import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dayjs from "dayjs";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import pkg from "./package.json";

const root: string = process.cwd();

const pathResolve = (dir = ".", metaUrl = import.meta.url) => {
  const currentFileDir = dirname(fileURLToPath(metaUrl));
  return resolve(currentFileDir, dir);
};

const createAlias = (metaUrl: string): Record<string, string> => ({
  "@": pathResolve("./src", metaUrl),
});

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

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const newMode = mode;
  const env = loadEnv(newMode, root);
  console.log("当前启动模式:" + newMode);
  const { VITE_PORT, VITE_PUBLIC_PATH } = wrapperEnv(env);

  return {
    base: VITE_PUBLIC_PATH || "/",
    root,
    resolve: {
      alias: createAlias(import.meta.url),
      dedupe: ["vue", "vue-router"],
      preserveSymlinks: false,
    },
    server: {
      port: VITE_PORT || 3000,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8080",
          changeOrigin: true,
        },
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
    plugins: [
      vue(),
      vueJsx(),
    ],
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

