import { formatBytes, sum } from "@pureadmin/utils";
import dayjs from "dayjs";
import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 查找包含 packages 目录的根目录
 * 从当前文件位置向上查找，直到找到包含 packages 目录的位置
 */
const findRoot = (): string => {
  let currentDir = dirname(fileURLToPath(import.meta.url));
  while (currentDir !== dirname(currentDir)) {
    const packagesDir = resolve(currentDir, "packages");
    if (existsSync(packagesDir)) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }
  return process.cwd();
};

/** 启动`node`进程时所在工作目录的绝对路径 */
export const root: string = findRoot();

/**
 * @description 将`process.env.NODE_ENV`转换为`dev`、`prod`、`test`等
 * @param env `process.env.NODE_ENV`
 */
export const convertEnv = (env: string) => {
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
export const pathResolve = (dir = ".", metaUrl = import.meta.url) => {
  const currentFileDir = dirname(fileURLToPath(metaUrl));
  const buildDir = resolve(currentFileDir, "build");
  const resolvedPath = resolve(currentFileDir, dir);
  if (resolvedPath.startsWith(buildDir)) {
    return fileURLToPath(metaUrl);
  }
  return resolvedPath;
};

/** 设置别名（基础） */
export const createAlias = (metaUrl: string): Record<string, string> => {
  return {
    "@": pathResolve("./src", metaUrl),
    // pages 下各业务模块在开发环境直接指向源码入口，方便被各个 app 以包名方式引入
    "@pages/dict": resolve(root, "pages/dict/src"),
    "@pages/example": resolve(root, "pages/example/src"),
    "@pages/map": resolve(root, "pages/map/src"),
    "@pages/project": resolve(root, "pages/project/src"),
    "@pages/setting": resolve(root, "pages/setting/src"),
    "@pages/system": resolve(root, "pages/system/src"),
    "@pages/tools": resolve(root, "pages/tools/src"),
    "@pages/video": resolve(root, "pages/video/src"),
    "@pages/pay": resolve(root, "pages/pay/src"),
    "@pages/doc": resolve(root, "pages/doc/src"),
    "@repo": resolve(root, "packages"),
    "@repo/assets": resolve(root, "packages/assets"),
    "@repo/components": resolve(root, "packages/components"),
    "@repo/config": resolve(root, "packages/config"),
    "@repo/core": resolve(root, "packages/core"),
    "@repo/pages": resolve(root, "packages/pages"),
    "@repo/utils": resolve(root, "packages/utils"),
    "@repo/codec-wasm": resolve(root, "packages/codec-wasm"),
  };
};

/** 创建 APP_INFO */
export const createAppInfo = (pkg: {
  name: string;
  version: string;
  engines?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}) => ({
  pkg,
  lastBuildTime: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss"),
});

/** 处理环境变量 */
export const wrapperEnv = (envConf: any): ViteEnv => {
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
    let realName = envConf[envName].replace(/\n/g, "\n");
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

  return ret as ViteEnv;
};

/**
 * 读取目录大小
 */
export const getDirSize = (dirPath: string): Promise<number> => {
  return new Promise((resolvePromise, rejectPromise) => {
    readdir(dirPath, (err, files) => {
      if (err) {
        rejectPromise(err);
        return;
      }

      const tasks = files.map((file) => {
        return new Promise<number>((resolveTask, rejectTask) => {
          const filePath = resolve(dirPath, file);
          stat(filePath, (error, stats) => {
            if (error) {
              rejectTask(error);
              return;
            }

            if (stats.isDirectory()) {
              getDirSize(filePath)
                .then((size) => resolveTask(size))
                .catch((e) => rejectTask(e));
            } else {
              resolveTask(stats.size);
            }
          });
        });
      });

      Promise.all(tasks)
        .then((sizes) => {
          resolvePromise(sum(sizes));
        })
        .catch((e) => rejectPromise(e));
    });
  });
};

/**
 * 读取打包目录总大小
 * @param options.folder 目录，相对项目根目录，默认 dist
 * @param options.callback 计算完成后的回调
 */
export const getPackageSize = (options: { folder?: string; callback?: (size: string | number) => void }) => {
  const { folder = "dist", callback } = options;
  const targetDir = resolve(root, folder);

  if (!existsSync(targetDir)) {
    if (callback) {
      callback("0KB");
    }
    return;
  }

  getDirSize(targetDir)
    .then((size) => {
      const formatted = formatBytes(size);
      if (callback) {
        callback(formatted);
      }
    })
    .catch(() => {
      if (callback) {
        callback("0KB");
      }
    });
};
