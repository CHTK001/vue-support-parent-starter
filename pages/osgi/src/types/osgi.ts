/**
 * OSGi 插件管理类型。
 *
 * 字段与后端 `/osgi/bundles` 原始出参一一对应（该端点不套 ReturnResult 信封）。
 */

/** 已安装 bundle 的运行时描述 */
export interface OsgiBundle {
  /** 框架内 bundle 标识 */
  bundleId: number;
  /** 符号名，安装/升级/卸载都以它为准 */
  symbolicName: string;
  /** bundle 版本 */
  version: string;
  /** ACTIVE / RESOLVED / INSTALLED / STARTING / STOPPING / UNINSTALLED */
  state: string;
  /** 安装来源位置，本地 jar 可直接下载 */
  location: string;
}

/** 变更类操作的返回 */
export interface OsgiAction {
  symbolicName?: string;
  success?: boolean;
}
