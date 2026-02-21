export * from "./src/config";
export * from "./src/i18n";
export * from "./src/setting";
export * from "./src/token";
export * from "./src/auth";
export * from "./src/responsive";
export * from "./src/utils";
export type * from "./src/i18n/type";
export type * from "./src/utils";
export type * from "./src/types/config";
export type {
  SessionConfig,
  RequestConfig,
  ErrorHandlerConfig,
  PageBehaviorConfig,
  PerformanceConfig,
} from "./src/types/config";
import { transformI18n as t } from "./src/i18n";
export { t };
// 显式导出 config 模块的函数，确保正确导出
export { getConfig, setConfig, putConfig, responsiveStorageNameSpace, upgrade } from "./src/config";
