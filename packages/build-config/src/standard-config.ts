/**
 * 标准 Vite 配置创建器
 * 提供链式 API 简化 vite.config.ts 配置
 * @author CH
 * @version 1.0.0
 * @since 2026-03-18
 */
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { wrapperEnv, pathResolve, createAlias, createAppInfo } from "./utils";
import { getPluginsList } from "./plugins";
import { include, exclude } from "./optimize";
import { getSharedPublicConfig } from "./shared-public";

export interface StandardViteConfigOptions {
  /** 应用端口，默认从环境变量读取 */
  port?: number;
  /** API 代理配置 */
  proxy?: Record<
    string,
    {
      target: string;
      changeOrigin?: boolean;
      ws?: boolean;
      timeout?: number;
      proxyTimeout?: number;
    }
  >;
  /** 额外的依赖优化包 */
  extraInclude?: string[];
  /** 额外的排除包 */
  extraExclude?: string[];
  /** 是否启用 mock，默认从环境变量读取 */
  useMock?: boolean;
  /** mock 路径，默认为 ["mock"] */
  mockPath?: string[];
  /** 自定义别名 */
  customAlias?: Record<string, string>;
  /** 是否启用 sourcemap，默认 false */
  sourcemap?: boolean;
  /** 构建目标，默认 "es2020" */
  target?: string;
  /** chunk 大小警告限制，默认 4000 */
  chunkSizeWarningLimit?: number;
  /** 自定义 CSS 预处理器配置 */
  cssPreprocessorOptions?: {
    scss?: any;
    less?: any;
  };
  /** 自定义 define 配置 */
  customDefine?: Record<string, any>;
  /** 额外的 Vite 插件 */
  extraPlugins?: any[];
  /** 自定义 logger */
  customLogger?: any;
  /** 自定义 terser 配置 */
  customTerserOptions?: any;
  /** 自定义 rollup 配置 */
  customRollupOptions?: any;
}

/**
 * 创建标准 Vite 配置
 * @param metaUrl import.meta.url
 * @param pkg package.json 内容
 * @param options 配置选项
 * @returns Vite 配置函数
 *
 * @example
 * ```typescript
 * import pkg from "./package.json";
 *
 * export default createStandardViteConfig(import.meta.url, pkg, {
 *   port: 5174,
 *   proxy: {
 *     "/api": {
 *       target: "http://127.0.0.1:8080",
 *       changeOrigin: true,
 *     },
 *   },
 * });
 * ```
 */
export function createStandardViteConfig(
  metaUrl: string,
  pkg: any,
  options: StandardViteConfigOptions = {},
) {
  return ({ mode }: ConfigEnv): UserConfigExport => {
    // 当前应用的根目录
    const appRoot = resolve(dirname(fileURLToPath(metaUrl)), ".");
    const env = loadEnv(mode, appRoot);

    console.log("当前启动模式:", mode);
    console.log("应用根目录:", appRoot);

    const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
      wrapperEnv(env);

    // 合并别名
    const alias = {
      ...createAlias(metaUrl),
      ...options.customAlias,
    };

    // 合并依赖优化配置
    const optimizeDepsInclude = [...include, ...(options.extraInclude || [])];
    const optimizeDepsExclude = [...exclude, ...(options.extraExclude || [])];

    // 合并 CSS 预处理器配置
    const cssPreprocessorOptions = {
      scss: {
        additionalData: `
          @use "@layout/default/styles/layout/variables.scss" as *;
          @use "@layout/default/styles/layout/mixin.scss";
        `,
        ...options.cssPreprocessorOptions?.scss,
      },
      ...options.cssPreprocessorOptions,
    };

    // 合并 define 配置
    const defineConfig = {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_CONFIG__: JSON.stringify(env),
      __APP_INFO__: JSON.stringify(createAppInfo(pkg)),
      __APP_ENV__: JSON.stringify(mode),
      ...options.customDefine,
    };

    // 合并插件
    const plugins = [
      ...getPluginsList({
        VITE_CDN,
        VITE_COMPRESSION,
        i18nPaths: [
          pathResolve("../locales/**", metaUrl),
          pathResolve("@repo/config/locales/**", metaUrl),
        ],
        mockPath: options.mockPath,
      }),
      ...(options.extraPlugins || []),
    ];

    // 合并 terser 配置
    const terserOptions = options.customTerserOptions || {
      compress: {
        drop_console: true,
      },
    };

    // 合并 rollup 配置
    const rollupOptions = {
      input: {
        index: pathResolve("./index.html", metaUrl),
      },
      external: ["@element-plus/icons-vue"],
      output: {
        chunkFileNames: "static/js/[name]-[hash].js",
        entryFileNames: "static/js/[name]-[hash].js",
        assetFileNames: "static/[ext]/[name]-[hash].[ext]",
      },
      ...options.customRollupOptions,
    };

    return {
      base: VITE_PUBLIC_PATH,
      root: appRoot,
      ...getSharedPublicConfig(),
      resolve: {
        alias,
        dedupe: ["vue", "vue-router", "vue-i18n"],
        preserveSymlinks: false,
      },
      server: {
        port: options.port || VITE_PORT || 8848,
        host: "0.0.0.0",
        proxy: options.proxy || {},
        warmup: {
          clientFiles: ["./index.html", "./src/{views,components}/*"],
        },
      },
      ...(options.customLogger ? { customLogger: options.customLogger } : {}),
      css: {
        preprocessorOptions: cssPreprocessorOptions,
      },
      plugins,
      optimizeDeps: {
        include: optimizeDepsInclude,
        exclude: optimizeDepsExclude,
      },
      build: {
        target: options.target || "es2020",
        sourcemap: options.sourcemap || false,
        chunkSizeWarningLimit: options.chunkSizeWarningLimit || 4000,
        terserOptions,
        rollupOptions,
      },
      define: defineConfig,
    };
  };
}

/**
 * 创建标准 Vite 配置（链式 API）
 * @param metaUrl import.meta.url
 * @param pkg package.json 内容
 * @returns 配置构建器
 *
 * @example
 * ```typescript
 * import pkg from "./package.json";
 *
 * export default createViteConfig(import.meta.url, pkg)
 *   .port(5174)
 *   .proxy("/api", "http://127.0.0.1:8080")
 *   .build();
 * ```
 */
export function createViteConfig(metaUrl: string, pkg: any) {
  const options: StandardViteConfigOptions = {};

  const builder = {
    /**
     * 设置端口号
     */
    port(port: number) {
      options.port = port;
      return builder;
    },

    /**
     * 添加代理配置
     */
    proxy(path: string, target: string, changeOrigin = true) {
      if (!options.proxy) {
        options.proxy = {};
      }
      options.proxy[path] = { target, changeOrigin };
      return builder;
    },

    /**
     * 批量添加代理配置
     */
    proxies(
      proxies: Record<string, { target: string; changeOrigin?: boolean }>,
    ) {
      options.proxy = { ...options.proxy, ...proxies };
      return builder;
    },

    /**
     * 添加额外的依赖优化包
     */
    include(...packages: string[]) {
      options.extraInclude = [...(options.extraInclude || []), ...packages];
      return builder;
    },

    /**
     * 添加额外的排除包
     */
    exclude(...packages: string[]) {
      options.extraExclude = [...(options.extraExclude || []), ...packages];
      return builder;
    },

    /**
     * 启用 mock
     */
    mock(mockPath: string[] = ["mock"]) {
      options.useMock = true;
      options.mockPath = mockPath;
      return builder;
    },

    /**
     * 添加自定义别名
     */
    alias(name: string, path: string) {
      if (!options.customAlias) {
        options.customAlias = {};
      }
      options.customAlias[name] = path;
      return builder;
    },

    /**
     * 启用 sourcemap
     */
    sourcemap(enabled = true) {
      options.sourcemap = enabled;
      return builder;
    },

    /**
     * 设置构建目标
     */
    target(target: string) {
      options.target = target;
      return builder;
    },

    /**
     * 添加额外的 Vite 插件
     */
    plugins(...plugins: any[]) {
      options.extraPlugins = [...(options.extraPlugins || []), ...plugins];
      return builder;
    },

    /**
     * 设置自定义 logger
     */
    logger(logger: any) {
      options.customLogger = logger;
      return builder;
    },

    /**
     * 添加自定义 define 配置
     */
    define(key: string, value: any) {
      if (!options.customDefine) {
        options.customDefine = {};
      }
      options.customDefine[key] = value;
      return builder;
    },

    /**
     * 批量添加自定义 define 配置
     */
    defines(defines: Record<string, any>) {
      options.customDefine = { ...options.customDefine, ...defines };
      return builder;
    },

    /**
     * 设置 CSS 预处理器配置
     */
    cssPreprocessor(type: "scss" | "less", config: any) {
      if (!options.cssPreprocessorOptions) {
        options.cssPreprocessorOptions = {};
      }
      options.cssPreprocessorOptions[type] = config;
      return builder;
    },

    /**
     * 设置自定义 terser 配置
     */
    terser(terserOptions: any) {
      options.customTerserOptions = terserOptions;
      return builder;
    },

    /**
     * 设置自定义 rollup 配置
     */
    rollup(rollupOptions: any) {
      options.customRollupOptions = rollupOptions;
      return builder;
    },

    /**
     * 构建最终配置
     */
    build() {
      return createStandardViteConfig(metaUrl, pkg, options);
    },
  };

  return builder;
}
