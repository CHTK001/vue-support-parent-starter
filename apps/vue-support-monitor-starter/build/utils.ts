import { formatBytes, sum } from "@pureadmin/utils";
import dayjs from "dayjs";
import { readdir, stat } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dependencies, devDependencies, engines, name, version } from "../package.json";

/** ViteEnv环境变量类型 */
interface ViteEnv {
  VITE_PORT: number;
  VITE_PUBLIC_PATH: string;
  VITE_ROUTER_HISTORY: string;
  VITE_CDN: boolean;
  NODE_ENV: string;
  VITE_HIDE_HOME: string;
  VITE_COMPRESSION: string;
  VITE_API_PREFIX: string;
  VITE_API_URL: string;
  [key: string]: any;
}

/** 启动`node`进程时所在工作目录的绝对路径 */
const root: string = process.cwd();

/**
 * @description 将`process.env.NODE_ENV`转换为`dev`、`prod`、`test`等
 * @param env `process.env.NODE_ENV`
 */
const convertEnv = (env: string) => {
  if (env === "development") {
    return "dev";
  }

  if (env === "production") {
    return "prod";
  }

  return env;
};
/**
 * @description 根据可选的路径片段生成一个新的绝对路径
 * @param dir 路径片段，默认`build`
 * @param metaUrl 模块的完整`url`，如果在`build`目录外调用必传`import.meta.url`
 */
const pathResolve = (dir = ".", metaUrl = import.meta.url) => {
  // 当前文件目录的绝对路径
  const currentFileDir = dirname(fileURLToPath(metaUrl));
  // build 目录的绝对路径
  const buildDir = resolve(currentFileDir, "build");
  // 解析的绝对路径
  const resolvedPath = resolve(currentFileDir, dir);
  // 检查解析的绝对路径是否在 build 目录内
  if (resolvedPath.startsWith(buildDir)) {
    // 在 build 目录内，返回当前文件路径
    return fileURLToPath(metaUrl);
  }
  // 不在 build 目录内，返回解析后的绝对路径
  return resolvedPath;
};

/** 设置别名 */
const alias: Record<string, string> = {
  "@": pathResolve("../src"),
  "@build": pathResolve(),
  "@layout": pathResolve("../../../layout"),
  "@layout/default": pathResolve("../../../layout/default"),
};

/** 平台的名称、版本、运行所需的node和pnpm版本、依赖、最后构建时间的类型提示 */
const __APP_INFO__ = {
  pkg: { name, version, engines, dependencies, devDependencies },
  lastBuildTime: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
};

/** 处理环境变量 */
const wrapperEnv = (envConf: any): ViteEnv => {
  // 默认值
  const ret: ViteEnv = {
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

const fileListTotal: number[] = [];

/** 获取指定文件夹中所有文件的总大小 */
const getPackageSize = (options) => {
  const { folder = "dist", callback, format = true } = options;
  readdir(folder, (err, files: string[]) => {
    if (err) throw err;
    let count = 0;
    const checkEnd = () => {
      if (++count == files.length) {
        const data = format ? formatBytes(sum(fileListTotal)) : sum(fileListTotal);
        callback(data);
      }
    };
    files.forEach((item: string) => {
      stat(`${folder}/${item}`, async (err, stats) => {
        if (err) throw err;
        if (stats.isFile()) {
          fileListTotal.push(stats.size);
          checkEnd();
        } else if (stats.isDirectory()) {
          getPackageSize({
            folder: `${folder}/${item}/`,
            callback: checkEnd,
          });
        }
      });
    });
    if (files.length === 0) {
      callback(0);
    }
  });
};

export { __APP_INFO__, alias, getPackageSize, pathResolve, root, wrapperEnv, convertEnv };
