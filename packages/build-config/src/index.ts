// 工具函数
export {
  root,
  convertEnv,
  pathResolve,
  createAlias,
  createAppInfo,
  wrapperEnv,
  getPackageSize,
} from "./utils";

// 插件
export { getPluginsList, type PluginsOptions } from "./plugins";

// 优化配置
export { include, exclude } from "./optimize";

// 压缩插件
export { configCompressPlugin } from "./compress";

// CDN 配置
export { cdn } from "./cdn";

// 构建信息
export { viteBuildInfo } from "./info";

// 共享 public 目录配置
export { getSharedPublicConfig } from "./shared-public";

// 共享构建辅助函数
export {
  createAggressiveTerserOptions,
  createFilteredLogger,
  createVendorManualChunks,
  createWorkspaceDependencyFallbackPlugin,
  resolvePackageImport,
  type ManualChunkGroup,
  type ManualChunkMatcher,
  type WarningFilter,
} from "./helpers";

// 标准配置创建器
export {
  createStandardViteConfig,
  createViteConfig,
  type StandardProxyConfig,
  type StandardViteConfigOptions,
} from "./standard-config";
