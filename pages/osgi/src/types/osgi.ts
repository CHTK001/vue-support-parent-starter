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

/**
 * 部署目录里的 jar 文件。
 *
 * <p>「卸载」只是把 bundle 从框架里摘掉，jar 仍留在磁盘上；要删文件必须先卸载。
 * 后端把「文件是否存在、是否仍在框架中」一次返回，页面据此决定删除按钮是否可用，
 * 而不是让用户点了才收到「请先卸载」。</p>
 */
export interface OsgiJar {
  /** 部署目录中的文件名 */
  fileName: string;
  /** 文件字节数，读取失败为 -1 */
  size: number;
  /** 最后修改时间（毫秒），读取失败为 0 */
  lastModified: number;
  /** 是否仍是框架中的 bundle */
  installed: boolean;
  /** 对应 bundle 的符号名，未安装为 null */
  symbolicName: string | null;
  /** 对应 bundle 的状态，未安装为 null */
  state: string | null;
}

/** 删除 jar 的结果 */
export interface OsgiJarDeleteResult {
  /** 被删除的文件名 */
  fileName: string;
  /** 是否真的删掉了一个文件（已不存在时为 false） */
  deleted: boolean;
}

/**
 * 插件操作实时日志（socket {@code osgi / operation-log}）。
 *
 * <p>字段与后端 {@code OsgiLogEvent} 一一对应：{@code status} 区分开始 / 成功 / 失败，
 * {@code duration} 是后端实测耗时（毫秒），失败时 {@code message} 就是原因。</p>
 */
export interface OsgiLogEntry {
  /** 日志级别：INFO / WARN / ERROR */
  level: string;
  /** 阶段：start / success / failure */
  status: string;
  /** 操作：install / update / start / stop / uninstall / delete-jar / list ... */
  action: string;
  /** 插件符号名，清单类操作可能为空 */
  symbolicName: string;
  /** 说明或错误信息 */
  message: string;
  /** 开始时间戳（毫秒） */
  startedAt: number;
  /** 耗时（毫秒），start 阶段为 0 */
  duration: number;
}

/**
 * 框架统计（`/osgi/stats`）。
 *
 * <p>后端返回 Map，这里只声明页面用到的字段，其余原样保留在索引签名里，
 * 避免后端新增字段时前端类型报错。</p>
 */
export interface OsgiStats {
  /** bundle 总数（含系统 bundle） */
  totalBundles?: number;
  /** 被持有的服务引用数 */
  heldServiceReferences?: number;
  /** 自动启动失败数 */
  autoStartFailures?: number;
  /** 已注册服务类型清单 */
  registeredServiceTypes?: string[];
  [key: string]: unknown;
}

/** 服务注册表中的一条登记（`/osgi/services`） */
export interface OsgiService {
  /** 服务接口类型名 */
  type: string;
  /** 服务持久化 ID */
  pid: string;
  /** 实现类名 */
  implClass: string;
  /** 稳定标识 */
  stableId: string;
  /** OSGi 服务 ID */
  osgiServiceId: number;
  /** 排序值，降序排列，首项即当前生效服务 */
  ranking: number;
  /** 服务属性 */
  properties: Record<string, unknown>;
}

/**
 * 容器侧桥接快照（`/osgi/snapshot`）。
 *
 * <p>用于确认「OSGi 侧变化是否已传导到容器侧」；rejected 是验收拒绝记录，
 * 空对象表示没有拒绝。</p>
 */
export interface OsgiSnapshot {
  /** 框架是否处于活跃状态 */
  frameworkActive?: boolean;
  /** 自动启动失败数 */
  autoStartFailures?: number;
  /** 是否装配了 Bean 桥接 */
  bridgeAvailable?: boolean;
  /** 桥接记录的框架版本号 */
  frameworkVersion?: string;
  /** 是否开启验收 */
  acceptanceEnabled?: boolean;
  /** bundle 生命周期是否触发定义失效 */
  invalidateOnBundleLifecycle?: boolean;
  /** 桥接定义数 */
  definitionCount?: number;
  /** 桥接定义名清单 */
  definitions?: string[];
  /** 验收拒绝记录 */
  rejected?: Record<string, unknown>;
  [key: string]: unknown;
}
