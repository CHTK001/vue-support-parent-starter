import { http, type ReturnResult } from "@repo/utils";

// 日志等级枚举
export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE";

// 节点日志器配置接口
export interface NodeLoggerConfig {
  pluginNodeLoggerConfigId?: number;
  pluginNodeLoggerConfigNodeName: string;
  pluginNodeLoggerConfigNodeUrl: string;
  pluginNodeLoggerConfigApplicationName: string;
  pluginNodeLoggerConfigLoggerName: string;
  pluginNodeLoggerConfigCurrentLevel?: LogLevel;
  pluginNodeLoggerConfigConfiguredLevel?: LogLevel;
  pluginNodeLoggerConfigEffectiveLevel?: LogLevel;
  pluginNodeLoggerConfigEnabled?: boolean;
  pluginNodeLoggerConfigLastUpdated?: string;
  pluginNodeLoggerConfigCreatedTime?: string;
  pluginNodeLoggerConfigUpdatedTime?: string;
  // 前端扩展字段
  newLevel?: string;
  updating?: boolean;
}

// 日志器详细信息接口
export interface LoggerDetails {
  configuredLevel?: LogLevel;
  effectiveLevel?: LogLevel;
  additivity?: boolean;
  appenders?: string[];
  localConfig?: NodeLoggerConfig;
}

// 批量设置结果接口
export interface BatchSetResult {
  [nodeUrl: string]: boolean;
}

// API响应接口
export interface LoggerConfigResponse {
  success: boolean;
  message?: string;
  nodeUrl?: string;
  loggers?: NodeLoggerConfig[];
  count?: number;
}

export interface LoggerDetailsResponse {
  success: boolean;
  message?: string;
  config?: NodeLoggerConfig;
  details?: LoggerDetails;
}

export interface BatchSetResponse {
  success: boolean;
  message?: string;
  results?: BatchSetResult;
  totalNodes?: number;
  successCount?: number;
  failureCount?: number;
}

export interface NodesListResponse {
  success: boolean;
  message?: string;
  nodeUrls?: string[];
  count?: number;
}

/**
 * 获取节点的所有日志器配置
 * @param nodeUrl 节点地址（Base64编码）
 */
export const getNodeLoggers = (nodeUrl: string) => {
  return http.request<ReturnResult<any[]>>(
    "get",
    `/node/plugin/node-logger/nodes/${nodeUrl}/loggers`
  );
};

/**
 * 获取指定日志器的详细配置
 * @param nodeUrl 节点地址（Base64编码）
 * @param loggerName 日志器名称
 */
export const getLoggerConfig = (nodeUrl: string, loggerName: string) => {
  return http.request<LoggerDetailsResponse>(
    "get",
    `/node/plugin/node-logger/nodes/${nodeUrl}/loggers/${encodeURIComponent(loggerName)}`
  );
};

/**
 * 设置日志器等级
 * @param nodeUrl 节点地址（Base64编码）
 * @param loggerName 日志器名称
 * @param level 日志等级
 */
export const setLoggerLevel = (
  nodeUrl: string,
  loggerName: string,
  level: string
) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/node/plugin/node-logger/nodes/${nodeUrl}/loggers/${encodeURIComponent(loggerName)}/level`,
    {
      params: { level },
    }
  );
};

/**
 * 批量设置相同应用的所有节点日志等级
 * @param applicationName 应用名称
 * @param loggerName 日志器名称
 * @param level 日志等级
 */
export const setLoggerLevelForAllNodes = (
  applicationName: string,
  loggerName: string,
  level: string
) => {
  return http.request<BatchSetResponse>(
    "post",
    `/node/plugin/node-logger/applications/${encodeURIComponent(applicationName)}/loggers/${encodeURIComponent(loggerName)}/level`,
    {
      params: { level },
    }
  );
};

/**
 * 获取相同应用名称的所有节点
 * @param applicationName 应用名称
 */
export const getNodesByApplicationName = (applicationName: string) => {
  return http.request<NodesListResponse>(
    "get",
    `/node/plugin/node-logger/applications/${encodeURIComponent(applicationName)}/nodes`
  );
};

/**
 * 刷新节点的日志器配置
 * @param nodeUrl 节点地址（Base64编码）
 */
export const refreshNodeLoggers = (nodeUrl: string) => {
  return http.request<ReturnResult<any[]>>(
    "post",
    `/node/plugin/node-logger/nodes/${nodeUrl}/refresh`
  );
};

/**
 * 获取所有应用名称列表
 */
export const getAllApplicationNames = () => {
  return http.request<ReturnResult<string[]>>(
    "get",
    "/node/plugin/node-logger/applications"
  );
};

/**
 * 获取节点日志器配置统计信息
 * @param nodeUrl 节点地址（Base64编码）
 */
export const getLoggerConfigStats = (nodeUrl: string) => {
  return http.request<
    ReturnResult<{
      totalLoggers: number;
      configuredLoggers: number;
      inheritedLoggers: number;
      levelDistribution: Record<LogLevel, number>;
    }>
  >("get", `/node/plugin/node-logger/nodes/${nodeUrl}/stats`);
};

/**
 * 重置日志器配置（恢复为继承状态）
 * @param nodeUrl 节点地址（Base64编码）
 * @param loggerName 日志器名称
 */
export const resetLoggerLevel = (nodeUrl: string, loggerName: string) => {
  return http.request<LoggerConfigResponse>(
    "delete",
    `/node/plugin/node-logger/nodes/${nodeUrl}/loggers/${encodeURIComponent(loggerName)}/level`
  );
};

/**
 * 批量重置应用的所有节点日志器配置
 * @param applicationName 应用名称
 * @param loggerName 日志器名称
 */
export const resetLoggerLevelForAllNodes = (
  applicationName: string,
  loggerName: string
) => {
  return http.request<BatchSetResponse>(
    "delete",
    `/node/plugin/node-logger/applications/${encodeURIComponent(applicationName)}/loggers/${encodeURIComponent(loggerName)}/level`
  );
};

// 工具函数：编码节点URL为Base64
export const encodeNodeUrl = (ipAddress: string, port: number): string => {
  const nodeUrl = `http://${ipAddress}:${port}`;
  try {
    return btoa(nodeUrl)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  } catch (error) {
    console.error("Base64编码失败:", nodeUrl, error);
    return encodeURIComponent(nodeUrl);
  }
};

// 工具函数：解码Base64节点URL
export const decodeNodeUrl = (encodedUrl: string): string => {
  try {
    const base64Str = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
    const paddedStr = base64Str + "=".repeat((4 - (base64Str.length % 4)) % 4);
    return atob(paddedStr);
  } catch (error) {
    console.error("Base64解码失败:", encodedUrl, error);
    return decodeURIComponent(encodedUrl);
  }
};

// 工具函数：获取日志等级标签类型
export const getLevelTagType = (
  level?: LogLevel
): "success" | "danger" | "warning" | "info" | "primary" => {
  switch (level) {
    case "ERROR":
      return "danger";
    case "WARN":
      return "warning";
    case "INFO":
      return "primary";
    case "DEBUG":
      return "success";
    case "TRACE":
      return "info";
    default:
      return "info";
  }
};

// 工具函数：获取日志等级颜色
export const getLevelColor = (level?: LogLevel): string => {
  switch (level) {
    case "ERROR":
      return "#f56c6c";
    case "WARN":
      return "#e6a23c";
    case "INFO":
      return "#409eff";
    case "DEBUG":
      return "#67c23a";
    case "TRACE":
      return "#909399";
    default:
      return "#909399";
  }
};

// 工具函数：验证日志等级
export const isValidLogLevel = (level: string): level is LogLevel => {
  return ["ERROR", "WARN", "INFO", "DEBUG", "TRACE"].includes(level);
};
