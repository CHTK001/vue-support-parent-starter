/**
 * 标准 Vite 配置创建器
 * 提供链式 API 简化 vite.config.ts 配置
 * @author CH
 * @version 1.0.0
 * @since 2026-03-18
 */
import {
  type ConfigEnv,
  loadEnv,
  mergeConfig,
  type UserConfig,
  type UserConfigExport,
} from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  wrapperEnv,
  pathResolve,
  createAlias,
  createAppInfo,
  root,
} from "./utils";
import { getPluginsList } from "./plugins";
import { include, exclude } from "./optimize";
import { getSharedPublicConfig } from "./shared-public";
import {
  createAggressiveTerserOptions,
  createFilteredLogger,
  createVendorManualChunks,
  resolvePackageImport,
  type WarningFilter,
} from "./helpers";

export interface StandardProxyConfig {
  target: string;
  changeOrigin?: boolean;
  ws?: boolean;
  timeout?: number;
  proxyTimeout?: number;
  [key: string]: any;
}

export interface StandardViteConfigOptions {
  /** 应用端口，默认从环境变量读取 */
  port?: number;
  /** 应用主机地址，默认 0.0.0.0 */
  host?: string;
  /** API 代理配置 */
  proxy?: Record<string, StandardProxyConfig>;
  /** 额外的依赖优化包 */
  extraInclude?: string[];
  /** 额外的排除包 */
  extraExclude?: string[];
  /** mock 路径，默认为 ["mock"] */
  mockPath?: string[];
  /** 自定义别名 */
  customAlias?: Record<string, string>;
  /** 自定义 resolve.conditions */
  resolveConditions?: string[];
  /** 自定义 resolve.dedupe */
  resolveDedupe?: string[];
  /** 自定义 preserveSymlinks，默认 false */
  preserveSymlinks?: boolean;
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
  /** 顶层 await 配置兼容参数，当前保留为 no-op */
  enableTopLevelAwait?: boolean;
  /** 自定义 terser 配置 */
  customTerserOptions?: any;
  /** 自定义 rollup 配置 */
  customRollupOptions?: any;
  /** remove-console 白名单 */
  removeConsoleExternal?: string[];
  /** 是否启用 remove-console 插件，默认 true */
  enableRemoveConsolePlugin?: boolean;
  /** server.fs.allow 追加目录 */
  serverFsAllow?: string[];
  /** server.warmup.clientFiles */
  warmupClientFiles?: string[];
  /** 额外合并配置 */
  customConfig?: UserConfig;
}

function mergeRollupOptions(baseOptions: any, overrideOptions: any = {}) {
  return {
    ...baseOptions,
    ...overrideOptions,
    input: {
      ...(baseOptions?.input || {}),
      ...(overrideOptions?.input || {}),
    },
    output: {
      ...(baseOptions?.output || {}),
      ...(overrideOptions?.output || {}),
    },
    external: overrideOptions?.external ?? baseOptions?.external,
  };
}

/**
 * 创建标准 Vite 配置
 * @param metaUrl import.meta.url
 * @param pkg package.json 内容
 * @param options 配置选项
 * @returns Vite 配置函数
 */
export function createStandardViteConfig(
  metaUrl: string,
  pkg: any,
  options: StandardViteConfigOptions = {},
) {
  return ({ mode }: ConfigEnv): UserConfigExport => {
    const appRoot = resolve(dirname(fileURLToPath(metaUrl)), ".");
    const env = loadEnv(mode, appRoot);

    console.log("当前启动模式:", mode);
    console.log("应用根目录:", appRoot);

    const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
      wrapperEnv(env);

    const alias = {
      ...createAlias(metaUrl),
      ...options.customAlias,
    };

    const optimizeDepsInclude = [...include, ...(options.extraInclude || [])];
    const optimizeDepsExclude = [...exclude, ...(options.extraExclude || [])];

    const cssPreprocessorOptions = {
      scss: {
        api: "modern-compiler",
        additionalData: `
          @use "@layout/default/styles/layout/variables.scss" as *;
          @use "@layout/default/styles/layout/mixin.scss";
        `,
        silenceDeprecations: ["color-functions", "global-builtin", "import"],
        ...options.cssPreprocessorOptions?.scss,
      },
      ...options.cssPreprocessorOptions,
    };

    const defineConfig = {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_CONFIG__: JSON.stringify(env),
      __APP_INFO__: JSON.stringify(createAppInfo(pkg)),
      __APP_ENV__: JSON.stringify(mode),
      ...options.customDefine,
    };

    const plugins = [
      ...getPluginsList({
        VITE_CDN,
        VITE_COMPRESSION,
        enableTopLevelAwait: options.enableTopLevelAwait,
        i18nPaths: [
          pathResolve("../locales/**", metaUrl),
          pathResolve("@repo/config/locales/**", metaUrl),
        ],
        mockPath: options.mockPath,
        removeConsoleExternal: options.removeConsoleExternal,
        enableRemoveConsolePlugin: options.enableRemoveConsolePlugin,
      }),
      ...(options.extraPlugins || []),
    ];

    const terserOptions = options.customTerserOptions || {
      compress: {
        drop_console: true,
      },
    };
    const resolvedPort = options.port || VITE_PORT || 8848;

    const rollupOptions = mergeRollupOptions(
      {
        input: {
          index: pathResolve("./index.html", metaUrl),
        },
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          manualChunks: createVendorManualChunks(),
        },
      },
      options.customRollupOptions,
    );

    const baseConfig: UserConfig = {
      base: VITE_PUBLIC_PATH,
      root: appRoot,
      ...getSharedPublicConfig(),
      resolve: {
        alias,
        dedupe: options.resolveDedupe || ["vue", "vue-router", "vue-i18n"],
        preserveSymlinks: options.preserveSymlinks ?? false,
        ...(options.resolveConditions?.length
          ? { conditions: options.resolveConditions }
          : {}),
      },
      server: {
        port: resolvedPort,
        host: options.host || "0.0.0.0",
        proxy: options.proxy || {},
        fs: {
          allow: [
            root,
            pathResolve("./", metaUrl),
            ...(options.serverFsAllow || []),
          ],
        },
        warmup: {
          clientFiles: options.warmupClientFiles || [
            "./index.html",
            "./src/{views,components}/*",
          ],
        },
      },
      preview: {
        port: resolvedPort,
        host: options.host || "0.0.0.0",
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

    if (!options.customConfig) {
      return baseConfig;
    }
    return mergeConfig(baseConfig, options.customConfig);
  };
}

/**
 * 创建标准 Vite 配置（链式 API）
 * @param metaUrl import.meta.url
 * @param pkg package.json 内容
 * @returns 配置构建器
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
     * 设置 host
     */
    host(host: string) {
      options.host = host;
      return builder;
    },

    /**
     * 添加代理配置
     */
    proxy(
      path: string,
      target: string,
      changeOrigin = true,
      extraOptions: Omit<StandardProxyConfig, "target" | "changeOrigin"> = {},
    ) {
      if (!options.proxy) {
        options.proxy = {};
      }
      options.proxy[path] = {
        target,
        changeOrigin,
        ...extraOptions,
      };
      return builder;
    },

    /**
     * 批量添加代理配置
     */
    proxies(proxies: Record<string, StandardProxyConfig>) {
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
     * 基于当前应用上下文解析并映射第三方包入口
     */
    packageAlias(name: string, specifier = name) {
      return builder.alias(name, resolvePackageImport(metaUrl, specifier));
    },

    /**
     * 设置 resolve.conditions
     */
    conditions(...conditions: string[]) {
      options.resolveConditions = [
        ...new Set([...(options.resolveConditions || []), ...conditions]),
      ];
      return builder;
    },

    /**
     * 设置 resolve.dedupe
     */
    dedupe(...packages: string[]) {
      options.resolveDedupe = [
        ...new Set([
          ...(options.resolveDedupe || ["vue", "vue-router", "vue-i18n"]),
          ...packages,
        ]),
      ];
      return builder;
    },

    /**
     * 设置 preserveSymlinks
     */
    preserveSymlinks(enabled = true) {
      options.preserveSymlinks = enabled;
      return builder;
    },

    /**
     * 增加 server.fs.allow
     */
    fsAllow(...paths: string[]) {
      options.serverFsAllow = [
        ...new Set([...(options.serverFsAllow || []), ...paths]),
      ];
      return builder;
    },

    /**
     * 设置 warmup client files
     */
    warmup(...clientFiles: string[]) {
      options.warmupClientFiles = clientFiles;
      return builder;
    },

    /**
     * 配置 remove-console 白名单
     */
    removeConsoleExternal(...paths: string[]) {
      options.removeConsoleExternal = [
        ...new Set([...(options.removeConsoleExternal || []), ...paths]),
      ];
      return builder;
    },

    /**
     * 启用或关闭 remove-console 插件
     */
    removeConsole(enabled = true) {
      options.enableRemoveConsolePlugin = enabled;
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
     * 过滤指定警告
     */
    filterWarnings(...patterns: WarningFilter[]) {
      options.customLogger = createFilteredLogger(
        patterns,
        options.customLogger,
      );
      return builder;
    },

    /**
     * 兼容保留：记录顶层 await 配置位，当前不会向 Vite 注入该插件
     */
    topLevelAwait(enabled = true) {
      options.enableTopLevelAwait = enabled;
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
     * 使用共享的高压缩 terser 预设
     */
    aggressiveTerser(overrides: any = {}) {
      options.customTerserOptions = createAggressiveTerserOptions(overrides);
      return builder;
    },

    /**
     * 设置自定义 rollup 配置
     */
    rollup(rollupOptions: any) {
      options.customRollupOptions = mergeRollupOptions(
        options.customRollupOptions || {},
        rollupOptions,
      );
      return builder;
    },

    /**
     * 设置 manualChunks
     */
    manualChunks(manualChunks: any) {
      return builder.rollup({
        output: {
          manualChunks,
        },
      });
    },

    /**
     * 合并额外的 Vite 配置
     */
    merge(config: UserConfig) {
      options.customConfig = options.customConfig
        ? mergeConfig(options.customConfig, config)
        : config;
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
